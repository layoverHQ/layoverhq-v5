import { NextRequest, NextResponse } from "next/server"
import { airportService } from "@/lib/services/airport-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const limit = parseInt(searchParams.get("limit") || "10")
    const country = searchParams.get("country") || undefined
    const hubOnly = searchParams.get("hub_only") === "true"
    const popularOnly = searchParams.get("popular_only") === "true"

    if (!query.trim()) {
      return NextResponse.json({
        airports: [],
        total: 0,
        has_more: false,
        message: "Query parameter is required",
      })
    }

    const result = await airportService.searchAirports({
      query: query.trim(),
      limit: Math.min(limit, 50), // Cap at 50 results
      country,
      hub_only: hubOnly,
      popular_only: popularOnly,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Airport search API error:", error)
    return NextResponse.json({ error: "Failed to search airports" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, limit = 10, country, hub_only, popular_only } = body

    if (!query || !query.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    const result = await airportService.searchAirports({
      query: query.trim(),
      limit: Math.min(limit, 50),
      country,
      hub_only,
      popular_only,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Airport search API error:", error)
    return NextResponse.json({ error: "Failed to search airports" }, { status: 500 })
  }
}
