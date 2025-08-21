import { createServiceRoleClient } from "@/lib/supabase/server"

// Airport data structure based on the GitHub repository
interface AirportCSV {
  iata_code: string
  icao_code: string
  timezone: string
  name: string
  city_code: string
  country: string
  url: string
  elevation: string
  latitude: string
  longitude: string
  city: string
  county: string
  state: string
}

// Enhanced airport data for our database
interface EnhancedAirport {
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
}

class AirportSeeder {
  private supabase = createServiceRoleClient()

  /**
   * Download airport data from GitHub repository
   */
  async downloadAirportData(): Promise<AirportCSV[]> {
    try {
      // Fetch the CSV data from the GitHub repository
      const response = await fetch(
        "https://raw.githubusercontent.com/lxndrblz/Airports/main/airports.csv",
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch airport data: ${response.statusText}`)
      }

      const csvText = await response.text()
      return this.parseCSV(csvText)
    } catch (error) {
      console.error("Error downloading airport data:", error)
      throw error
    }
  }

  /**
   * Parse CSV data into structured format
   */
  private parseCSV(csvText: string): AirportCSV[] {
    const lines = csvText.split("\n")
    const headers = lines[0].split(",")
    const airports: AirportCSV[] = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const values = this.parseCSVLine(line)
      if (values.length !== headers.length) continue

      const airport: any = {}
      headers.forEach((header, index) => {
        airport[header.trim()] = values[index]?.trim() || ""
      })

      airports.push(airport as AirportCSV)
    }

    return airports
  }

  /**
   * Parse CSV line handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const values: string[] = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === "," && !inQuotes) {
        values.push(current)
        current = ""
      } else {
        current += char
      }
    }

    values.push(current)
    return values
  }

  /**
   * Transform CSV data to enhanced airport format
   */
  private transformAirportData(csvAirports: AirportCSV[]): EnhancedAirport[] {
    // Define major hub airports
    const hubAirports = new Set([
      "ATL",
      "LAX",
      "ORD",
      "DFW",
      "JFK",
      "DEN",
      "SFO",
      "CLT",
      "LAS",
      "PHX", // US
      "LHR",
      "CDG",
      "AMS",
      "FRA",
      "MUC",
      "MAD",
      "BCN",
      "FCO",
      "MXP",
      "ZRH", // Europe
      "SIN",
      "BKK",
      "HKG",
      "NRT",
      "ICN",
      "DEL",
      "BOM",
      "KUL",
      "CGK",
      "MNL", // Asia
      "SYD",
      "MEL",
      "BNE",
      "PER", // Australia
      "JNB",
      "CAI",
      "NBO",
      "ADD",
      "CMN",
      "LOS",
      "ABV",
      "ACC",
      "DAR", // Africa
      "DOH",
      "DXB",
      "AUH",
      "IST",
      "RUH",
      "JED",
      "KWI",
      "MCT",
      "BAH", // Middle East
      "YYZ",
      "YVR",
      "MEX",
      "GRU",
      "EZE",
      "SCL",
      "LIM", // Americas
    ])

    // Define popular airports (major cities, tourist destinations)
    const popularAirports = new Set([
      "CPT",
      "DUR",
      "KGL",
      "EBB",
      "KRT",
      "SSA", // Additional African
      "SAW",
      "BCN",
      "MXP",
      "YVR",
      "MEL",
      "BNE",
      "PER", // Additional popular
      "CPH",
      "ARN",
      "OSL",
      "HEL",
      "VIE",
      "PRG",
      "BUD",
      "WAW", // European
      "BJS",
      "SHA",
      "CAN",
      "CTU",
      "XIY",
      "CKG",
      "HGH",
      "SZX", // Chinese
      "BOM",
      "BLR",
      "HYD",
      "CCU",
      "MAA",
      "COK",
      "TRV", // Indian
      "KUL",
      "SIN",
      "BKK",
      "DMK",
      "HKT",
      "CNX",
      "KBV", // Southeast Asian
      "NRT",
      "HND",
      "KIX",
      "CTS",
      "FUK",
      "NGO",
      "ITM", // Japanese
      "ICN",
      "GMP",
      "PUS",
      "CJU",
      "MWX",
      "TAE", // Korean
    ])

    return csvAirports
      .filter((airport) => airport.iata_code && airport.iata_code.length === 3)
      .map((airport) => {
        const isHub = hubAirports.has(airport.iata_code)
        const isPopular = popularAirports.has(airport.iata_code) || isHub

        // Calculate search rank based on importance
        let searchRank = 0
        if (isHub) searchRank += 100
        if (isPopular) searchRank += 50
        if (airport.country === "USA") searchRank += 20
        if (airport.country === "United Kingdom") searchRank += 20
        if (airport.country === "Germany") searchRank += 20
        if (airport.country === "France") searchRank += 20
        if (airport.country === "Japan") searchRank += 20
        if (airport.country === "China") searchRank += 20
        if (airport.country === "India") searchRank += 20
        if (airport.country === "Australia") searchRank += 20
        if (airport.country === "Canada") searchRank += 20

        return {
          iata_code: airport.iata_code.toUpperCase(),
          icao_code: airport.icao_code || "",
          name: airport.name || "",
          city: airport.city || airport.city_code || "",
          country: airport.country || "",
          timezone: airport.timezone || "",
          latitude: parseFloat(airport.latitude) || 0,
          longitude: parseFloat(airport.longitude) || 0,
          elevation: parseInt(airport.elevation) || 0,
          hub: isHub,
          popular: isPopular,
          search_rank: searchRank,
        }
      })
      .filter(
        (airport) =>
          airport.latitude !== 0 && airport.longitude !== 0 && airport.name && airport.city,
      )
      .sort((a, b) => b.search_rank - a.search_rank)
  }

  /**
   * Create airports table in Supabase
   */
  async createAirportsTable(): Promise<void> {
    try {
      // Create the airports table with proper structure
      const { error } = await this.supabase.rpc("create_airports_table")

      if (error) {
        console.log("Table creation RPC not available, using SQL...")
        await this.createTableWithSQL()
      }
    } catch (error) {
      console.log("Falling back to SQL table creation...")
      await this.createTableWithSQL()
    }
  }

  /**
   * Create table using SQL (fallback method)
   */
  private async createTableWithSQL(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS airports (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        iata_code VARCHAR(3) UNIQUE NOT NULL,
        icao_code VARCHAR(4),
        name TEXT NOT NULL,
        city TEXT NOT NULL,
        country TEXT NOT NULL,
        timezone TEXT,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        elevation INTEGER,
        hub BOOLEAN DEFAULT FALSE,
        popular BOOLEAN DEFAULT FALSE,
        search_rank INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_airports_iata_code ON airports(iata_code);
      CREATE INDEX IF NOT EXISTS idx_airports_city ON airports(city);
      CREATE INDEX IF NOT EXISTS idx_airports_country ON airports(country);
      CREATE INDEX IF NOT EXISTS idx_airports_hub ON airports(hub);
      CREATE INDEX IF NOT EXISTS idx_airports_popular ON airports(popular);
      CREATE INDEX IF NOT EXISTS idx_airports_search_rank ON airports(search_rank);
      CREATE INDEX IF NOT EXISTS idx_airports_location ON airports(latitude, longitude);

      -- Create full-text search index
      CREATE INDEX IF NOT EXISTS idx_airports_search ON airports USING gin(
        to_tsvector('english', name || ' ' || city || ' ' || country)
      );
    `

    try {
      const { error } = await this.supabase.rpc("exec_sql", { sql: createTableSQL })
      if (error) {
        console.log("SQL execution not available, table creation skipped")
      }
    } catch (error) {
      console.log("Table creation skipped - manual setup required")
    }
  }

  /**
   * Seed the airport database
   */
  async seedAirportDatabase(): Promise<void> {
    try {
      console.log("Starting airport database seeding...")

      // Create table if it doesn't exist
      await this.createAirportsTable()

      // Download airport data
      console.log("Downloading airport data from GitHub...")
      const csvAirports = await this.downloadAirportData()
      console.log(`Downloaded ${csvAirports.length} airports`)

      // Transform data
      console.log("Transforming airport data...")
      const enhancedAirports = this.transformAirportData(csvAirports)
      console.log(`Transformed ${enhancedAirports.length} airports`)

      // Insert data in batches
      console.log("Inserting airport data...")
      const batchSize = 100
      let insertedCount = 0

      for (let i = 0; i < enhancedAirports.length; i += batchSize) {
        const batch = enhancedAirports.slice(i, i + batchSize)

        const { error } = await this.supabase
          .from("airports")
          .upsert(batch, { onConflict: "iata_code" })

        if (error) {
          console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error)
        } else {
          insertedCount += batch.length
          console.log(
            `Inserted batch ${Math.floor(i / batchSize) + 1}: ${insertedCount}/${enhancedAirports.length}`,
          )
        }
      }

      console.log(`Airport database seeding completed! Inserted ${insertedCount} airports`)
    } catch (error) {
      console.error("Error seeding airport database:", error)
      throw error
    }
  }

  /**
   * Check if airports table has data
   */
  async hasData(): Promise<boolean> {
    try {
      const { count, error } = await this.supabase
        .from("airports")
        .select("*", { count: "exact", head: true })

      if (error) {
        console.error("Error checking airport data:", error)
        return false
      }

      return (count || 0) > 0
    } catch (error) {
      console.error("Error checking airport data:", error)
      return false
    }
  }

  /**
   * Get airport count
   */
  async getAirportCount(): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from("airports")
        .select("*", { count: "exact", head: true })

      if (error) {
        console.error("Error getting airport count:", error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error("Error getting airport count:", error)
      return 0
    }
  }
}

// Export singleton instance
export const airportSeeder = new AirportSeeder()

// Export types
export type { AirportCSV, EnhancedAirport }
