import { createClient } from "@/lib/supabase/client"

export interface Airline {
  id: string
  name: string
  iata_code: string
  icao_code: string
  country: string
  logo_url: string
  flag_url: string
  website: string
  alliance?: string
  hub_airports: string[]
  popular_routes: string[]
  created_at: string
  updated_at: string
}

export interface AirlineSearchParams {
  query: string
  country?: string
  alliance?: string
  limit?: number
}

export interface AirlineSearchResult {
  airlines: Airline[]
  total: number
  has_more: boolean
}

class AirlineService {
  private supabase = createClient()
  private airlinesCache: Airline[] = []
  private cacheExpiry: number = 0
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

  /**
   * Fetch airlines data from GitHub repository
   */
  async fetchAirlinesFromGitHub(): Promise<Airline[]> {
    try {
      const response = await fetch(
        "https://raw.githubusercontent.com/dotmarn/Airlines/master/airlines.json",
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch airlines data: ${response.statusText}`)
      }

      const rawData = await response.json()
      return this.transformAirlinesData(rawData)
    } catch (error) {
      console.error("Error fetching airlines from GitHub:", error)
      throw error
    }
  }

  /**
   * Transform raw GitHub data to our format
   */
  private transformAirlinesData(rawData: any[]): Airline[] {
    return rawData
      .filter((airline) => airline.name && airline.iata_code)
      .map((airline) => {
        // Determine alliance based on airline name/code
        const alliance = this.determineAlliance(airline.name, airline.iata_code)

        // Determine hub airports based on airline
        const hubAirports = this.determineHubAirports(
          airline.name,
          airline.iata_code,
          airline.country,
        )

        // Determine popular routes
        const popularRoutes = this.determinePopularRoutes(
          airline.name,
          airline.iata_code,
          airline.country,
        )

        return {
          id: airline.id || `airline_${airline.iata_code}`,
          name: airline.name,
          iata_code: airline.iata_code.toUpperCase(),
          icao_code: airline.icao_code || "",
          country: airline.country || "Unknown",
          logo_url: airline.logo || airline.logo_url || "",
          flag_url: airline.flag || airline.flag_url || "",
          website: airline.website || airline.url || "",
          alliance,
          hub_airports: hubAirports,
          popular_routes: popularRoutes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  /**
   * Determine airline alliance
   */
  private determineAlliance(airlineName: string, iataCode: string): string | undefined {
    const name = airlineName.toLowerCase()
    const code = iataCode.toLowerCase()

    // Star Alliance
    if (
      [
        "united",
        "lufthansa",
        "air canada",
        "ana",
        "asiana",
        "singapore airlines",
        "thai airways",
        "turkish airlines",
      ].some((airline) => name.includes(airline))
    ) {
      return "Star Alliance"
    }

    // OneWorld
    if (
      [
        "american airlines",
        "british airways",
        "cathay pacific",
        "qatar airways",
        "japan airlines",
        "iberia",
        "finnair",
      ].some((airline) => name.includes(airline))
    ) {
      return "OneWorld"
    }

    // SkyTeam
    if (
      [
        "delta",
        "air france",
        "klm",
        "korean air",
        "china eastern",
        "china southern",
        "aeromexico",
      ].some((airline) => name.includes(airline))
    ) {
      return "SkyTeam"
    }

    // Other major alliances
    if (name.includes("emirates") || name.includes("etihad")) {
      return "UAE Alliance"
    }

    if (name.includes("qatar airways")) {
      return "OneWorld"
    }

    return undefined
  }

  /**
   * Determine hub airports for airlines
   */
  private determineHubAirports(airlineName: string, iataCode: string, country: string): string[] {
    const name = airlineName.toLowerCase()
    const code = iataCode.toLowerCase()

    // Major US airlines
    if (name.includes("american airlines") || code === "aa") {
      return ["DFW", "CLT", "ORD", "MIA", "LAX", "JFK"]
    }
    if (name.includes("delta") || code === "dl") {
      return ["ATL", "DTW", "MSP", "SLC", "JFK", "LAX"]
    }
    if (name.includes("united") || code === "ua") {
      return ["ORD", "DEN", "IAH", "SFO", "EWR", "LAX"]
    }

    // Major European airlines
    if (name.includes("british airways") || code === "ba") {
      return ["LHR", "LGW", "LCY", "EDI", "MAN"]
    }
    if (name.includes("lufthansa") || code === "lh") {
      return ["FRA", "MUC", "BER", "DUS", "HAM"]
    }
    if (name.includes("air france") || code === "af") {
      return ["CDG", "ORY", "NCE", "TLS", "BOD"]
    }
    if (name.includes("klm") || code === "kl") {
      return ["AMS", "EIN", "RTM"]
    }

    // Major Asian airlines
    if (name.includes("japan airlines") || code === "jl") {
      return ["NRT", "HND", "KIX", "CTS", "FUK"]
    }
    if (name.includes("ana") || code === "nh") {
      return ["HND", "NRT", "KIX", "CTS", "FUK"]
    }
    if (name.includes("singapore airlines") || code === "sq") {
      return ["SIN", "CGK", "BKK", "HKG", "NRT"]
    }
    if (name.includes("cathay pacific") || code === "cx") {
      return ["HKG", "TPE", "BKK", "SIN", "NRT"]
    }

    // Middle Eastern airlines
    if (name.includes("emirates") || code === "ek") {
      return ["DXB", "DXE", "AUH"]
    }
    if (name.includes("qatar airways") || code === "qr") {
      return ["DOH", "AUH", "DXB"]
    }
    if (name.includes("etihad") || code === "ey") {
      return ["AUH", "DXB", "DOH"]
    }

    // African airlines
    if (name.includes("ethiopian") || code === "et") {
      return ["ADD", "NBO", "DAR", "LUN"]
    }
    if (name.includes("kenya airways") || code === "kq") {
      return ["NBO", "DAR", "LUN", "ADD"]
    }
    if (name.includes("south african") || code === "sa") {
      return ["JNB", "CPT", "DUR", "GRJ"]
    }

    // Default to major airports in the airline's country
    const countryHubs: { [key: string]: string[] } = {
      USA: ["JFK", "LAX", "ORD", "ATL", "DFW"],
      "United Kingdom": ["LHR", "LGW", "MAN", "EDI"],
      Germany: ["FRA", "MUC", "BER", "DUS"],
      France: ["CDG", "ORY", "NCE", "TLS"],
      Netherlands: ["AMS", "EIN", "RTM"],
      Japan: ["NRT", "HND", "KIX", "CTS"],
      Singapore: ["SIN", "CGK", "BKK"],
      "Hong Kong": ["HKG", "TPE", "BKK"],
      Qatar: ["DOH", "AUH", "DXB"],
      UAE: ["DXB", "AUH", "DOH"],
      Ethiopia: ["ADD", "NBO", "DAR"],
      Kenya: ["NBO", "DAR", "ADD"],
      "South Africa": ["JNB", "CPT", "DUR"],
    }

    return countryHubs[country] || []
  }

  /**
   * Determine popular routes for airlines
   */
  private determinePopularRoutes(airlineName: string, iataCode: string, country: string): string[] {
    const name = airlineName.toLowerCase()
    const code = iataCode.toLowerCase()

    // Major international routes
    if (name.includes("emirates") || code === "ek") {
      return ["DXB-LHR", "DXB-JFK", "DXB-SIN", "DXB-BKK", "DXB-HKG"]
    }
    if (name.includes("qatar airways") || code === "qr") {
      return ["DOH-LHR", "DOH-JFK", "DOH-CDG", "DOH-SIN", "DOH-BKK"]
    }
    if (name.includes("singapore airlines") || code === "sq") {
      return ["SIN-LHR", "SIN-JFK", "SIN-SYD", "SIN-NRT", "SIN-HKG"]
    }
    if (name.includes("british airways") || code === "ba") {
      return ["LHR-JFK", "LHR-LAX", "LHR-SIN", "LHR-HKG", "LHR-SYD"]
    }
    if (name.includes("lufthansa") || code === "lh") {
      return ["FRA-JFK", "FRA-LAX", "FRA-SIN", "FRA-HKG", "FRA-NRT"]
    }

    // Default popular routes based on country
    const countryRoutes: { [key: string]: string[] } = {
      USA: ["JFK-LHR", "LAX-NRT", "ORD-CDG", "ATL-AMS"],
      "United Kingdom": ["LHR-JFK", "LHR-SIN", "LHR-HKG", "LHR-SYD"],
      Germany: ["FRA-JFK", "FRA-SIN", "FRA-HKG", "FRA-NRT"],
      France: ["CDG-JFK", "CDG-SIN", "CDG-HKG", "CDG-NRT"],
      Japan: ["NRT-JFK", "NRT-LHR", "NRT-SIN", "NRT-HKG"],
      Singapore: ["SIN-LHR", "SIN-JFK", "SIN-SYD", "SIN-NRT"],
      "Hong Kong": ["HKG-LHR", "HKG-JFK", "HKG-SIN", "HKG-NRT"],
    }

    return countryRoutes[country] || []
  }

  /**
   * Get airlines with caching
   */
  async getAirlines(): Promise<Airline[]> {
    // Check if cache is still valid
    if (this.airlinesCache.length > 0 && Date.now() < this.cacheExpiry) {
      return this.airlinesCache
    }

    try {
      // Try to get from Supabase first
      const { data: dbAirlines, error } = await this.supabase
        .from("airlines")
        .select("*")
        .order("name")

      if (!error && dbAirlines && dbAirlines.length > 0) {
        this.airlinesCache = dbAirlines
        this.cacheExpiry = Date.now() + this.CACHE_DURATION
        return dbAirlines
      }

      // Fallback to GitHub
      const githubAirlines = await this.fetchAirlinesFromGitHub()
      this.airlinesCache = githubAirlines
      this.cacheExpiry = Date.now() + this.CACHE_DURATION
      return githubAirlines
    } catch (error) {
      console.error("Error getting airlines:", error)
      return this.airlinesCache // Return cached data if available
    }
  }

  /**
   * Search airlines
   */
  async searchAirlines(params: AirlineSearchParams): Promise<AirlineSearchResult> {
    try {
      const { query, country, alliance, limit = 20 } = params

      if (!query.trim()) {
        return { airlines: [], total: 0, has_more: false }
      }

      let queryBuilder = this.supabase.from("airlines").select("*", { count: "exact" })

      // Build search query
      const searchConditions = []
      const searchTerm = query.toLowerCase().trim()

      searchConditions.push(`name.ilike.%${searchTerm}%`)
      searchConditions.push(`iata_code.ilike.${searchTerm}`)
      searchConditions.push(`country.ilike.${searchTerm}`)

      queryBuilder = queryBuilder.or(searchConditions.join(","))

      // Apply filters
      if (country) {
        queryBuilder = queryBuilder.eq("country", country)
      }

      if (alliance) {
        queryBuilder = queryBuilder.eq("alliance", alliance)
      }

      // Order by relevance
      queryBuilder = queryBuilder.order("name", { ascending: true }).limit(limit)

      const { data: airlines, error, count } = await queryBuilder

      if (error) {
        throw error
      }

      return {
        airlines: airlines || [],
        total: count || 0,
        has_more: (count || 0) > limit,
      }
    } catch (error) {
      console.error("Error searching airlines:", error)
      // Fallback to client-side search
      return this.searchAirlinesClientSide(params)
    }
  }

  /**
   * Client-side search fallback
   */
  private async searchAirlinesClientSide(
    params: AirlineSearchParams,
  ): Promise<AirlineSearchResult> {
    const { query, country, alliance, limit = 20 } = params
    const airlines = await this.getAirlines()

    let filtered = airlines.filter((airline) => {
      const matchesQuery =
        airline.name.toLowerCase().includes(query.toLowerCase()) ||
        airline.iata_code.toLowerCase().includes(query.toLowerCase()) ||
        airline.country.toLowerCase().includes(query.toLowerCase())

      const matchesCountry = !country || airline.country === country
      const matchesAlliance = !alliance || airline.alliance === alliance

      return matchesQuery && matchesCountry && matchesAlliance
    })

    filtered = filtered.slice(0, limit)

    return {
      airlines: filtered,
      total: filtered.length,
      has_more: false,
    }
  }

  /**
   * Get airline by IATA code
   */
  async getAirlineByCode(iataCode: string): Promise<Airline | null> {
    try {
      const { data, error } = await this.supabase
        .from("airlines")
        .select("*")
        .eq("iata_code", iataCode.toUpperCase())
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          return null
        }
        throw error
      }

      return data
    } catch (error) {
      console.error("Error getting airline by code:", error)
      // Fallback to cache
      const airlines = await this.getAirlines()
      return airlines.find((a) => a.iata_code === iataCode.toUpperCase()) || null
    }
  }

  /**
   * Get airlines by alliance
   */
  async getAirlinesByAlliance(alliance: string): Promise<Airline[]> {
    try {
      const { data, error } = await this.supabase
        .from("airlines")
        .select("*")
        .eq("alliance", alliance)
        .order("name")

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error getting airlines by alliance:", error)
      // Fallback to cache
      const airlines = await this.getAirlines()
      return airlines.filter((a) => a.alliance === alliance)
    }
  }

  /**
   * Get airlines by country
   */
  async getAirlinesByCountry(country: string): Promise<Airline[]> {
    try {
      const { data, error } = await this.supabase
        .from("airlines")
        .select("*")
        .eq("country", country)
        .order("name")

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error getting airlines by country:", error)
      // Fallback to cache
      const airlines = await this.getAirlines()
      return airlines.filter((a) => a.country === country)
    }
  }

  /**
   * Get all alliances
   */
  async getAlliances(): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from("airlines")
        .select("alliance")
        .not("alliance", "is", null)

      if (error) {
        throw error
      }

      const alliances = [...new Set(data?.map((a) => a.alliance).filter(Boolean))]
      return alliances.sort()
    } catch (error) {
      console.error("Error getting alliances:", error)
      // Fallback to cache
      const airlines = await this.getAirlines()
      const alliances = [...new Set(airlines.map((a) => a.alliance).filter(Boolean))]
      return alliances.sort()
    }
  }

  /**
   * Get all countries
   */
  async getCountries(): Promise<string[]> {
    try {
      const { data, error } = await this.supabase.from("airlines").select("country")

      if (error) {
        throw error
      }

      const countries = [...new Set(data?.map((a) => a.country).filter(Boolean))]
      return countries.sort()
    } catch (error) {
      console.error("Error getting countries:", error)
      // Fallback to cache
      const airlines = await this.getAirlines()
      const countries = [...new Set(airlines.map((a) => a.country).filter(Boolean))]
      return countries.sort()
    }
  }
}

// Export singleton instance
export const airlineService = new AirlineService()
