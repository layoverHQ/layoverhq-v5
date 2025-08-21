import { type NextRequest, NextResponse } from "next/server"

async function getLayoverOrchestrator() {
  const { default: LayoverSearchOrchestrator } = await import("@/lib/services/layover-orchestrator")
  return LayoverSearchOrchestrator
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Extract search parameters
    const origin = searchParams.get("origin") || "LOS"
    const destination = searchParams.get("destination") || "ATL"
    const departureDate = searchParams.get("departureDate") || "2025-08-21"
    const returnDate = searchParams.get("returnDate")
    const adults = Number.parseInt(searchParams.get("adults") || "1")
    const children = Number.parseInt(searchParams.get("children") || "0")
    const infants = Number.parseInt(searchParams.get("infants") || "0")
    const cabinClass = (searchParams.get("cabinClass") as any) || "economy"
    const maxPrice = searchParams.get("maxPrice")
      ? Number.parseInt(searchParams.get("maxPrice")!)
      : undefined
    const maxConnections = searchParams.get("maxConnections")
      ? Number.parseInt(searchParams.get("maxConnections")!)
      : undefined
    const preferLayovers = searchParams.get("preferLayovers") === "true"
    const maxLayoverDuration = searchParams.get("maxLayoverDuration")
      ? Number.parseInt(searchParams.get("maxLayoverDuration")!)
      : undefined
    const minLayoverDuration = searchParams.get("minLayoverDuration")
      ? Number.parseInt(searchParams.get("minLayoverDuration")!)
      : undefined

    console.log("[v0] Layover-optimized flight search request:", {
      origin,
      destination,
      departureDate,
      returnDate,
      passengers: { adults, children, infants },
      cabinClass,
      maxPrice,
      maxConnections,
      preferLayovers,
      maxLayoverDuration,
      minLayoverDuration,
    })

    const LayoverOrchestrator = await getLayoverOrchestrator()
    const results = await LayoverOrchestrator.searchOptimalLayovers({
      origin,
      destination,
      departureDate,
      returnDate,
      passengers: { adults, children, infants },
      cabinClass,
      preferLayovers,
      maxLayoverDuration,
      minLayoverDuration,
    })

    console.log(
      "[v0] Layover search results:",
      results.totalResults,
      "flights found with layover intelligence from",
      Object.keys(results.providers).length,
      "providers",
    )

    return NextResponse.json(
      {
        success: true,
        data: {
          flights: results.flights,
          marketInsights: results.marketInsights,
          recommendations: results.recommendations,
          searchParams: {
            origin,
            destination,
            departureDate,
            returnDate,
            passengers: { adults, children, infants },
            cabinClass,
            maxPrice,
            maxConnections,
            preferLayovers,
            maxLayoverDuration,
            minLayoverDuration,
          },
          total: results.totalResults,
          providers: results.providers,
          searchTime: results.searchTime,
          sources: ["duffel", "kiwi", "amadeus"],
          layoverOptimization: true,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  } catch (error) {
    console.error("[v0] Layover search API error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Layover-optimized flight search failed",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("[v0] Layover-optimized flight search request:", body)

    const LayoverOrchestrator = await getLayoverOrchestrator()
    const results = await LayoverOrchestrator.searchOptimalLayovers(body)

    console.log(
      "[v0] Layover search results:",
      results.totalResults,
      "flights found with layover intelligence from",
      Object.keys(results.providers).length,
      "providers",
    )

    return NextResponse.json(
      {
        success: true,
        data: {
          flights: results.flights,
          marketInsights: results.marketInsights,
          recommendations: results.recommendations,
          searchParams: body,
          total: results.totalResults,
          providers: results.providers,
          searchTime: results.searchTime,
          sources: ["duffel", "kiwi", "amadeus"],
          layoverOptimization: true,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  } catch (error) {
    console.error("[v0] Layover search API error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Layover-optimized flight search failed",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}
