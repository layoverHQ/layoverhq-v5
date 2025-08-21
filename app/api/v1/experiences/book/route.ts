import { type NextRequest, NextResponse } from "next/server"
import { enhancedViatorService } from "@/lib/services/enhanced-viator-service"
import { EnhancedAuth } from "@/lib/enhanced-auth"
import { logger } from "@/lib/logger"
import { errorTracker } from "@/lib/error-tracking"

interface BookingRequest {
  productCode: string
  date: string
  time: string
  travelers: Array<{
    title: string
    firstName: string
    lastName: string
    email?: string
    phone?: string
  }>
  options?: {
    currency?: string
    language?: string
    pickupLocation?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication for bookings
    const user = await EnhancedAuth.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Authentication required for bookings" }, { status: 401 })
    }

    const body = (await request.json()) as BookingRequest

    // Validate required fields
    if (
      !body.productCode ||
      !body.date ||
      !body.time ||
      !body.travelers ||
      body.travelers.length === 0
    ) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["productCode", "date", "time", "travelers"],
        },
        { status: 400 },
      )
    }

    // Validate traveler information
    for (const traveler of body.travelers) {
      if (!traveler.firstName || !traveler.lastName) {
        return NextResponse.json(
          { error: "Traveler first name and last name are required" },
          { status: 400 },
        )
      }
    }

    logger.info("[ExperienceBooking] Starting booking process", {
      userId: user.id,
      productCode: body.productCode,
      date: body.date,
      travelerCount: body.travelers.length,
    })

    // First check availability
    const availability = await enhancedViatorService.checkAvailability(
      body.productCode,
      body.date,
      body.travelers.length,
    )

    if (!availability.available) {
      return NextResponse.json(
        {
          error: "Experience not available",
          message: "The selected experience is not available for the chosen date and time",
          restrictions: availability.restrictions,
        },
        { status: 409 },
      )
    }

    // Create the booking
    const bookingResult = await enhancedViatorService.createBooking(
      body.productCode,
      body.date,
      body.time,
      body.travelers,
      body.options,
    )

    if (!bookingResult.success) {
      logger.error("[ExperienceBooking] Booking failed", {
        userId: user.id,
        productCode: body.productCode,
        error: bookingResult.error,
      })

      return NextResponse.json(
        {
          error: "Booking failed",
          message: bookingResult.error || "Unable to complete booking at this time",
        },
        { status: 500 },
      )
    }

    logger.info("[ExperienceBooking] Booking successful", {
      userId: user.id,
      productCode: body.productCode,
      bookingReference: bookingResult.bookingReference,
      confirmationNumber: bookingResult.confirmationNumber,
    })

    // TODO: Store booking in database
    // TODO: Send confirmation email
    // TODO: Update user's booking history

    return NextResponse.json({
      success: true,
      booking: {
        reference: bookingResult.bookingReference,
        confirmationNumber: bookingResult.confirmationNumber,
        status: bookingResult.status,
        totalPrice: bookingResult.totalPrice,
        productCode: body.productCode,
        date: body.date,
        time: body.time,
        travelers: body.travelers,
        createdAt: new Date().toISOString(),
      },
      message: "Booking confirmed successfully",
    })
  } catch (error) {
    await errorTracker.trackError(error as Error, {
      service: "experience-booking-api",
      operation: "createBooking",
      metadata: {
        url: request.url,
        method: request.method,
      },
    })

    logger.error("[ExperienceBooking] Booking request failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    })

    return NextResponse.json(
      {
        error: "Booking request failed",
        message: "An internal error occurred while processing your booking",
      },
      { status: 500 },
    )
  }
}

// Get booking status
export async function GET(request: NextRequest) {
  try {
    const user = await EnhancedAuth.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bookingReference = searchParams.get("reference")

    if (!bookingReference) {
      return NextResponse.json({ error: "Booking reference is required" }, { status: 400 })
    }

    const status = await enhancedViatorService.getBookingStatus(bookingReference)

    return NextResponse.json({
      success: true,
      booking: {
        reference: bookingReference,
        status: status.status,
        confirmationNumber: status.confirmationNumber,
        voucher: status.voucher,
        cancellationPolicy: status.cancellationPolicy,
      },
    })
  } catch (error) {
    logger.error("[ExperienceBooking] Status check failed", { error })

    return NextResponse.json({ error: "Failed to check booking status" }, { status: 500 })
  }
}
