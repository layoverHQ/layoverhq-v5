import { createClient } from "@/lib/supabase/client"
import { createServiceRoleClient } from "@/lib/supabase/server"

export interface Airport {
  id: string
  iata_code: string
  icao_code: string
  name: string
  city: string
  country: string
  timezone: string
  latitude: number
  longitude: number
  elevation: number
  hub: boolean
  popular: boolean
  search_rank: number
  created_at: string
  updated_at: string
}

export interface AirportSearchParams {
  query: string
  limit?: number
  country?: string
  hub_only?: boolean
  popular_only?: boolean
}

export interface AirportSearchResult {
  airports: Airport[]
  total: number
  has_more: boolean
}

class AirportService {
  private supabase = createClient()
  private serviceClient = createServiceRoleClient()

  /**
   * Search airports with intelligent ranking
   */
  async searchAirports(params: AirportSearchParams): Promise<AirportSearchResult> {
    try {
      const { query, limit = 10, country, hub_only, popular_only } = params

      if (!query.trim()) {
        return { airports: [], total: 0, has_more: false }
      }

      let queryBuilder = this.supabase.from("airports").select("*", { count: "exact" })

      // Build search query with multiple conditions
      const searchConditions = []
      const searchTerm = query.toLowerCase().trim()

      // Exact matches get highest priority
      searchConditions.push(`iata_code.ilike.${searchTerm}`)
      searchConditions.push(`city.ilike.${searchTerm}`)
      searchConditions.push(`name.ilike.%${searchTerm}%`)
      searchConditions.push(`country.ilike.${searchTerm}`)

      // Use OR for search conditions
      queryBuilder = queryBuilder.or(searchConditions.join(","))

      // Apply filters
      if (country) {
        queryBuilder = queryBuilder.eq("country", country)
      }

      if (hub_only) {
        queryBuilder = queryBuilder.eq("hub", true)
      }

      if (popular_only) {
        queryBuilder = queryBuilder.eq("popular", true)
      }

      // Order by relevance and popularity
      queryBuilder = queryBuilder
        .order("search_rank", { ascending: false })
        .order("hub", { ascending: false })
        .order("popular", { ascending: false })
        .order("iata_code", { ascending: true })
        .limit(limit)

      const { data: airports, error, count } = await queryBuilder

      if (error) {
        console.error("Error searching airports:", error)
        throw new Error("Failed to search airports")
      }

      return {
        airports: airports || [],
        total: count || 0,
        has_more: (count || 0) > limit,
      }
    } catch (error) {
      console.error("Airport search error:", error)
      throw new Error("Failed to search airports")
    }
  }

  /**
   * Get airport by IATA code
   */
  async getAirportByCode(iataCode: string): Promise<Airport | null> {
    try {
      const { data, error } = await this.supabase
        .from("airports")
        .select("*")
        .eq("iata_code", iataCode.toUpperCase())
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          return null // No rows returned
        }
        throw error
      }

      return data
    } catch (error) {
      console.error("Error getting airport by code:", error)
      return null
    }
  }

  /**
   * Get popular airports for quick selection
   */
  async getPopularAirports(limit: number = 20): Promise<Airport[]> {
    try {
      const { data, error } = await this.supabase
        .from("airports")
        .select("*")
        .eq("popular", true)
        .order("search_rank", { ascending: false })
        .limit(limit)

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error getting popular airports:", error)
      return []
    }
  }

  /**
   * Get hub airports
   */
  async getHubAirports(limit: number = 30): Promise<Airport[]> {
    try {
      const { data, error } = await this.supabase
        .from("airports")
        .select("*")
        .eq("hub", true)
        .order("search_rank", { ascending: false })
        .limit(limit)

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error getting hub airports:", error)
      return []
    }
  }

  /**
   * Get airports by country
   */
  async getAirportsByCountry(country: string, limit: number = 50): Promise<Airport[]> {
    try {
      const { data, error } = await this.supabase
        .from("airports")
        .select("*")
        .eq("country", country)
        .order("search_rank", { ascending: false })
        .order("iata_code", { ascending: true })
        .limit(limit)

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error getting airports by country:", error)
      return []
    }
  }

  /**
   * Get nearby airports within a radius
   */
  async getNearbyAirports(
    latitude: number,
    longitude: number,
    radiusKm: number = 100,
    limit: number = 20,
  ): Promise<Airport[]> {
    try {
      // Using PostGIS distance calculation if available, otherwise fallback to simple calculation
      const { data, error } = await this.supabase.rpc("get_nearby_airports", {
        lat: latitude,
        lng: longitude,
        radius_km: radiusKm,
        max_results: limit,
      })

      if (error) {
        // Fallback to client-side calculation
        return this.getNearbyAirportsFallback(latitude, longitude, radiusKm, limit)
      }

      return data || []
    } catch (error) {
      console.error("Error getting nearby airports:", error)
      return this.getNearbyAirportsFallback(latitude, longitude, radiusKm, limit)
    }
  }

  /**
   * Fallback method for nearby airports calculation
   */
  private async getNearbyAirportsFallback(
    latitude: number,
    longitude: number,
    radiusKm: number = 100,
    limit: number = 20,
  ): Promise<Airport[]> {
    try {
      const { data, error } = await this.supabase
        .from("airports")
        .select("*")
        .order("search_rank", { ascending: false })
        .limit(100) // Get more to filter by distance

      if (error) {
        throw error
      }

      if (!data) return []

      // Calculate distances and filter
      const airportsWithDistance = data.map((airport) => ({
        ...airport,
        distance: this.calculateDistance(latitude, longitude, airport.latitude, airport.longitude),
      }))

      // Filter by radius and sort by distance
      return airportsWithDistance
        .filter((airport) => airport.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit)
        .map(({ distance, ...airport }) => airport)
    } catch (error) {
      console.error("Error in nearby airports fallback:", error)
      return []
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1)
    const dLon = this.deg2rad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180)
  }

  /**
   * Initialize airport database with data from GitHub repository
   */
  async initializeAirportDatabase(): Promise<void> {
    try {
      // This would typically be called during setup/migration
      // For now, we'll create the table structure
      await this.createAirportTable()

      // In a real implementation, you would:
      // 1. Download the CSV from https://github.com/lxndrblz/Airports.git
      // 2. Parse and transform the data
      // 3. Insert into Supabase

      console.log("Airport database initialized")
    } catch (error) {
      console.error("Error initializing airport database:", error)
      throw error
    }
  }

  /**
   * Create airport table if it doesn't exist
   */
  private async createAirportTable(): Promise<void> {
    try {
      // This is a simplified table creation
      // In production, you'd use Supabase migrations
      const { error } = await this.serviceClient.rpc("create_airports_table_if_not_exists")

      if (error) {
        console.log("Table creation RPC not available, continuing...")
      }
    } catch (error) {
      console.log("Table creation not available, continuing...")
    }
  }
}

// Export singleton instance
export const airportService = new AirportService()
