import { NextRequest, NextResponse } from "next/server"
import { airlineService } from "@/lib/services/airline-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const limit = parseInt(searchParams.get("limit") || "20")
    const country = searchParams.get("country") || undefined
    const alliance = searchParams.get("alliance") || undefined

    if (!query.trim()) {
      return NextResponse.json({
        airlines: [],
        total: 0,
        has_more: false,
        message: "Query parameter is required",
      })
    }

    const result = await airlineService.searchAirlines({
      query: query.trim(),
      limit: Math.min(limit, 50), // Cap at 50 results
      country,
      alliance,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Airline search API error:", error)
    return NextResponse.json({ error: "Failed to search airlines" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, limit = 20, country, alliance } = body

    if (!query || !query.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    const result = await airlineService.searchAirlines({
      query: query.trim(),
      limit: Math.min(limit, 50),
      country,
      alliance,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Airline search API error:", error)
    return NextResponse.json({ error: "Failed to search airlines" }, { status: 500 })
  }
}
