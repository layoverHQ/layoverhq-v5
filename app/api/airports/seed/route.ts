import { NextRequest, NextResponse } from "next/server"
import { airportSeeder } from "@/lib/data/airport-seeder"

export async function POST(request: NextRequest) {
  try {
    // Check if database already has data
    const hasData = await airportSeeder.hasData()

    if (hasData) {
      const count = await airportSeeder.getAirportCount()
      return NextResponse.json({
        message: "Airport database already seeded",
        count,
        status: "already_seeded",
      })
    }

    // Start seeding process
    console.log("Starting airport database seeding...")
    await airportSeeder.seedAirportDatabase()

    // Get final count
    const count = await airportSeeder.getAirportCount()

    return NextResponse.json({
      message: "Airport database seeded successfully",
      count,
      status: "seeded",
    })
  } catch (error) {
    console.error("Airport seeding API error:", error)
    return NextResponse.json(
      {
        error: "Failed to seed airport database",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const hasData = await airportSeeder.hasData()
    const count = await airportSeeder.getAirportCount()

    return NextResponse.json({
      has_data: hasData,
      count,
      status: hasData ? "ready" : "empty",
    })
  } catch (error) {
    console.error("Airport status check error:", error)
    return NextResponse.json({ error: "Failed to check airport database status" }, { status: 500 })
  }
}
