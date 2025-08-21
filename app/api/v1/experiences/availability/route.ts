import { type NextRequest, NextResponse } from "next/server"
import { enhancedViatorService } from "@/lib/services/enhanced-viator-service"
import { logger } from "@/lib/logger"
import { errorTracker } from "@/lib/error-tracking"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productCode, date, travelers = 1 } = body

    // Validate required parameters
    if (!productCode || !date) {
      return NextResponse.json(
        {
          error: "Missing required parameters",
          required: ["productCode", "date"],
        },
        { status: 400 },
      )
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD" }, { status: 400 })
    }

    // Check if date is in the future
    const requestedDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (requestedDate < today) {
      return NextResponse.json(
        {
          error: "Invalid date",
          message: "Cannot check availability for past dates",
        },
        { status: 400 },
      )
    }

    logger.info("[ExperienceAvailability] Checking availability", {
      productCode,
      date,
      travelers,
    })

    const availability = await enhancedViatorService.checkAvailability(productCode, date, travelers)

    return NextResponse.json({
      success: true,
      availability: {
        productCode,
        date,
        travelers,
        available: availability.available,
        availableTimes: availability.availableTimes || [],
        pricing: availability.pricing,
        restrictions: availability.restrictions || [],
        checkedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    await errorTracker.trackError(error as Error, {
      service: "experience-availability-api",
      operation: "checkAvailability",
      metadata: {
        url: request.url,
        method: request.method,
      },
    })

    logger.error("[ExperienceAvailability] Availability check failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    })

    return NextResponse.json(
      {
        error: "Availability check failed",
        message: "Unable to check availability at this time",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productCode = searchParams.get("productCode")
    const date = searchParams.get("date")
    const travelers = parseInt(searchParams.get("travelers") || "1")

    if (!productCode || !date) {
      return NextResponse.json(
        {
          error: "Missing required parameters",
          required: ["productCode", "date"],
        },
        { status: 400 },
      )
    }

    // Use POST endpoint logic
    const mockRequest = new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify({ productCode, date, travelers }),
    })

    return await POST(mockRequest as NextRequest)
  } catch (error) {
    logger.error("[ExperienceAvailability] GET request failed", { error })

    return NextResponse.json({ error: "Failed to process availability request" }, { status: 500 })
  }
}
