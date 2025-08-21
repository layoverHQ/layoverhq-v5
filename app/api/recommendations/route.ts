import { NextRequest, NextResponse } from "next/server"
import { getRecommendationEngine } from "@/lib/recommendations/engine"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const origin = searchParams.get("origin") || "NYC" // Default to New York
    const budget = searchParams.get("budget") || "economy"
    const interests = searchParams.get("interests")?.split(",") || ["culture", "food"]
    const minLayover = parseInt(searchParams.get("minLayover") || "4")
    const maxLayover = parseInt(searchParams.get("maxLayover") || "12")
    const departureDate = searchParams.get("departureDate")
    const returnDate = searchParams.get("returnDate")
    const limit = parseInt(searchParams.get("limit") || "6")

    const engine = getRecommendationEngine()

    const recommendations = await engine.getPersonalizedRecommendations({
      origin,
      departureDate,
      returnDate,
      preferences: {
        budget: budget as "economy" | "premium" | "luxury",
        interests,
        layoverDuration: {
          min: minLayover,
          max: maxLayover,
        },
      },
      limit,
    })

    return NextResponse.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
      filters: {
        origin,
        budget,
        interests,
        layoverDuration: `${minLayover}-${maxLayover} hours`,
      },
    })
  } catch (error) {
    console.error("Error getting recommendations:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get recommendations",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { origin, preferences, departureDate, returnDate, limit = 6 } = body

    if (!origin) {
      return NextResponse.json({ error: "Origin is required" }, { status: 400 })
    }

    const engine = getRecommendationEngine()

    const recommendations = await engine.getPersonalizedRecommendations({
      origin,
      departureDate,
      returnDate,
      preferences: preferences || {
        budget: "economy",
        interests: ["culture", "food"],
        layoverDuration: { min: 4, max: 12 },
      },
      limit,
    })

    // Track user preferences for future personalization
    // In production, save to database
    console.log("User preferences tracked:", { origin, preferences })

    return NextResponse.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
      personalized: true,
    })
  } catch (error) {
    console.error("Error getting personalized recommendations:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get recommendations",
      },
      { status: 500 },
    )
  }
}
