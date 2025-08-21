import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const POPULAR_AIRPORTS = [
  {
    iata_code: "ATL",
    name: "Hartsfield-Jackson Atlanta International Airport",
    city: "Atlanta",
    country: "United States",
    country_code: "US",
    type: "airport",
    priority: 1,
  },
  {
    iata_code: "DXB",
    name: "Dubai International Airport",
    city: "Dubai",
    country: "United Arab Emirates",
    country_code: "AE",
    type: "airport",
    priority: 1,
  },
  {
    iata_code: "LHR",
    name: "London Heathrow Airport",
    city: "London",
    country: "United Kingdom",
    country_code: "GB",
    type: "airport",
    priority: 1,
  },
  {
    iata_code: "LAX",
    name: "Los Angeles International Airport",
    city: "Los Angeles",
    country: "United States",
    country_code: "US",
    type: "airport",
    priority: 1,
  },
  {
    iata_code: "JFK",
    name: "John F. Kennedy International Airport",
    city: "New York",
    country: "United States",
    country_code: "US",
    type: "airport",
    priority: 1,
  },
  {
    iata_code: "CDG",
    name: "Charles de Gaulle Airport",
    city: "Paris",
    country: "France",
    country_code: "FR",
    type: "airport",
    priority: 1,
  },
  {
    iata_code: "FRA",
    name: "Frankfurt Airport",
    city: "Frankfurt",
    country: "Germany",
    country_code: "DE",
    type: "airport",
    priority: 1,
  },
  {
    iata_code: "SIN",
    name: "Singapore Changi Airport",
    city: "Singapore",
    country: "Singapore",
    country_code: "SG",
    type: "airport",
    priority: 1,
  },
  {
    iata_code: "DOH",
    name: "Hamad International Airport",
    city: "Doha",
    country: "Qatar",
    country_code: "QA",
    type: "airport",
    priority: 1,
  },
  {
    iata_code: "IST",
    name: "Istanbul Airport",
    city: "Istanbul",
    country: "Turkey",
    country_code: "TR",
    type: "airport",
    priority: 1,
  },
  {
    iata_code: "AMS",
    name: "Amsterdam Airport Schiphol",
    city: "Amsterdam",
    country: "Netherlands",
    country_code: "NL",
    type: "airport",
    priority: 2,
  },
  {
    iata_code: "KEF",
    name: "Keflavik International Airport",
    city: "Reykjavik",
    country: "Iceland",
    country_code: "IS",
    type: "airport",
    priority: 2,
  },
  {
    iata_code: "ORD",
    name: "O'Hare International Airport",
    city: "Chicago",
    country: "United States",
    country_code: "US",
    type: "airport",
    priority: 2,
  },
  {
    iata_code: "NRT",
    name: "Narita International Airport",
    city: "Tokyo",
    country: "Japan",
    country_code: "JP",
    type: "airport",
    priority: 2,
  },
  {
    iata_code: "ICN",
    name: "Incheon International Airport",
    city: "Seoul",
    country: "South Korea",
    country_code: "KR",
    type: "airport",
    priority: 2,
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    console.log("[v0] Airport search API called with query:", query)

    if (!query || query.length < 2) {
      return NextResponse.json({ airports: [] })
    }

    const supabase = await createClient()

    let airports = []
    let usesFallback = false

    try {
      // Search airports using full-text search and fuzzy matching
      const { data: dbAirports, error } = await (
        await supabase
      )
        .from("airports")
        .select("code, name, city, country, is_hub")
        .or(
          `
          code.ilike.%${query}%,
          name.ilike.%${query}%,
          city.ilike.%${query}%,
          country.ilike.%${query}%
        `,
        )
        .eq("is_active", true)
        .order("is_hub", { ascending: false })
        .order("code")
        .limit(limit)

      if (error) {
        console.log("[v0] Database search failed, using fallback:", error.message)
        usesFallback = true
      } else if (dbAirports && dbAirports.length > 0) {
        airports = dbAirports
        console.log("[v0] Found", airports.length, "airports from database")
      } else {
        console.log("[v0] No airports found in database, using fallback")
        usesFallback = true
      }
    } catch (dbError) {
      console.log("[v0] Database connection failed, using fallback:", dbError)
      usesFallback = true
    }

    if (usesFallback) {
      const queryLower = query.toLowerCase()
      airports = POPULAR_AIRPORTS.filter(
        (airport) =>
          airport.iata_code.toLowerCase().includes(queryLower) ||
          airport.name.toLowerCase().includes(queryLower) ||
          airport.city.toLowerCase().includes(queryLower) ||
          airport.country.toLowerCase().includes(queryLower),
      ).slice(0, limit)

      console.log("[v0] Using fallback data, found", airports.length, "matching airports")
    }

    // Format results for autocomplete
    const formattedAirports = airports.map((airport) => ({
      code: airport.code || airport.iata_code,
      name: airport.name,
      city: airport.city,
      country: airport.country,
      countryCode: airport.country_code || "XX",
      type: airport.type || "airport",
      priority: airport.is_hub ? 1 : airport.priority || 3,
    }))

    console.log("[v0] Returning", formattedAirports.length, "formatted airports")

    return NextResponse.json({
      airports: formattedAirports,
      source: usesFallback ? "fallback" : "database",
    })
  } catch (error) {
    console.error("[v0] Airport search API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
