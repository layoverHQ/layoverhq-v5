import { NextRequest, NextResponse } from "next/server"
import { getViatorClient } from "@/lib/viator/client"
import { getMockExperiences } from "@/lib/viator/mock-data"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const city = searchParams.get("city")
    const maxDurationHours = searchParams.get("maxDurationHours")
    const date = searchParams.get("date")
    const currencyCode = searchParams.get("currency") || "USD"
    const useMockData = searchParams.get("mock") === "true"

    if (!city) {
      return NextResponse.json({ error: "City parameter is required" }, { status: 400 })
    }

    let experiences = []

    // Try to get real data from Viator API, fallback to mock if it fails
    if (!useMockData) {
      try {
        const client = getViatorClient()
        experiences = await client.searchLayoverExperiences({
          city,
          maxDurationHours: maxDurationHours ? parseInt(maxDurationHours) : undefined,
          date: date || undefined,
          currencyCode,
        })
      } catch (apiError) {
        console.warn("Viator API failed, using mock data:", apiError)
        experiences = getMockExperiences(
          city,
          maxDurationHours ? parseInt(maxDurationHours) : undefined,
        )
      }
    } else {
      experiences = getMockExperiences(
        city,
        maxDurationHours ? parseInt(maxDurationHours) : undefined,
      )
    }

    return NextResponse.json({
      success: true,
      data: experiences,
      count: experiences.length,
      source:
        experiences.length > 0 && experiences[0].productCode?.startsWith("VTR-")
          ? "mock"
          : "viator",
    })
  } catch (error) {
    console.error("Error searching Viator experiences:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to search experiences",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { destinations, layoverTime } = body

    if (!destinations || !Array.isArray(destinations)) {
      return NextResponse.json({ error: "Destinations array is required" }, { status: 400 })
    }

    const client = getViatorClient()
    const results = []

    // Convert layover time to hours
    const maxHours = layoverTime ? parseInt(layoverTime) : 6

    for (const destination of destinations) {
      try {
        const experiences = await client.searchLayoverExperiences({
          city: destination,
          maxDurationHours: maxHours,
        })

        results.push({
          city: destination,
          experiences: experiences.slice(0, 5), // Limit to top 5 per city
        })
      } catch (error) {
        console.error(`Error fetching experiences for ${destination}:`, error)
        results.push({
          city: destination,
          experiences: [],
          error: "Failed to fetch experiences",
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
    })
  } catch (error) {
    console.error("Error in bulk experience search:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to search experiences",
      },
      { status: 500 },
    )
  }
}
