/**
 * Enhanced Booking API - Phase 2 Revenue Engine Integration
 *
 * Complete booking orchestration with revenue optimization:
 * - Flight + Experience bundle bookings
 * - Dynamic pricing and commission calculation
 * - Multi-currency payment processing
 * - Real-time availability checking
 * - Revenue analytics tracking
 * - Automated commission distribution
 */

import { type NextRequest, NextResponse } from "next/server"
import { BookingOrchestrator } from "@/lib/services/booking-orchestrator"
import {
  enhancedLayoverDiscoveryEngine,
  type UserProfile,
  type LayoverContext,
} from "@/lib/services/enhanced-layover-discovery-engine"
import { configurableViatorService } from "@/lib/services/configurable-viator-service"
import { commissionEngine } from "@/lib/services/commission-engine"
import { EnhancedAuth } from "@/lib/enhanced-auth"
import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { errorTracker } from "@/lib/error-tracking"

interface EnhancedBookingRequest {
  flightOffer: {
    id: string
    provider: string
    price: {
      total: number
      currency: string
    }
    layovers: Array<{
      airport: string
      city: string
      country: string
      duration: number
      arrival: string
      departure: string
      coordinates?: { lat: number; lng: number }
    }>
  }
  passengers: Array<{
    type: "adult" | "child" | "infant"
    firstName: string
    lastName: string
    dateOfBirth: string
    email?: string
    phone?: string
  }>
  experienceSelections: Array<{
    experienceId: string
    layoverCity: string
    date: string
    time: string
    travelers: Array<{
      title: string
      firstName: string
      lastName: string
      email?: string
      phone?: string
    }>
    specialRequests?: string
  }>
  preferences: {
    maxBudgetPerExperience?: number
    preferredCategories?: string[]
    riskTolerance?: "conservative" | "moderate" | "adventurous"
    physicalCapability?: "low" | "moderate" | "high"
  }
  payment: {
    method: string
    currency: string
    billingAddress?: {
      line1: string
      line2?: string
      city: string
      state?: string
      postal_code: string
      country: string
    }
  }
  extras?: {
    hotelPreferences?: {
      autoBook: boolean
      maxPrice: number
      minRating: number
      amenities: string[]
    }
    ancillaries?: Array<{
      type: string
      selection: any
    }>
  }
}

interface EnhancedBookingResponse {
  success: boolean
  booking?: {
    id: string
    confirmationCode: string
    status: string
    totalPrice: number
    currency: string
    flightDetails: any
    experienceBookings: Array<{
      experienceId: string
      confirmationNumber: string
      destination: string
      date: string
      time: string
      price: number
      commission: number
      voucher?: {
        downloadUrl: string
        instructions: string[]
      }
    }>
    commissionSummary: {
      totalCommission: number
      platformRevenue: number
      partnerPayouts: number
    }
    createdAt: string
  }
  analytics?: {
    revenueGenerated: number
    commissionEarned: number
    bookingProbabilityScore: number
    optimizationStrategies: string[]
  }
  error?: string
  message?: string
}

const bookingOrchestrator = new BookingOrchestrator()

export async function POST(request: NextRequest) {
  try {
    // Require authentication for enhanced bookings
    const user = await EnhancedAuth.getCurrentUser()
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required for enhanced bookings",
        },
        { status: 401 },
      )
    }

    const body = (await request.json()) as EnhancedBookingRequest

    // Validate required fields
    if (!body.flightOffer || !body.passengers || body.passengers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          message: "Flight offer and passengers are required",
        },
        { status: 400 },
      )
    }

    logger.info("[EnhancedBooking] Processing enhanced booking request", {
      userId: user.id,
      flightId: body.flightOffer.id,
      passengers: body.passengers.length,
      experiences: body.experienceSelections.length,
      totalAmount: body.flightOffer.price.total,
    })

    // Get user profile for personalization
    const userProfile = await getUserProfile(user.id)
    if (!userProfile) {
      return NextResponse.json(
        {
          success: false,
          error: "User profile not found",
          message: "Unable to load user preferences for booking optimization",
        },
        { status: 400 },
      )
    }

    // Validate and optimize experience selections
    const optimizedExperiences = await validateAndOptimizeExperiences(
      body.experienceSelections,
      body.flightOffer.layovers,
      userProfile,
      body.preferences,
    )

    if (optimizedExperiences.length === 0 && body.experienceSelections.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid experiences",
          message: "None of the selected experiences are available or suitable for your layover",
        },
        { status: 409 },
      )
    }

    // Check availability for all selected experiences
    const availabilityChecks = await Promise.all(
      optimizedExperiences.map(async (exp) => {
        const availability = await configurableViatorService.checkAvailability(
          exp.experienceId,
          exp.date,
          exp.travelers.length,
        )
        return { experienceId: exp.experienceId, available: availability.available }
      }),
    )

    const unavailableExperiences = availabilityChecks.filter((check) => !check.available)
    if (unavailableExperiences.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Experiences unavailable",
          message: `Some selected experiences are no longer available: ${unavailableExperiences.map((e) => e.experienceId).join(", ")}`,
        },
        { status: 409 },
      )
    }

    // Create enhanced booking with revenue optimization
    const booking = await bookingOrchestrator.createEnhancedLayoverBooking(
      body.flightOffer,
      body.passengers,
      optimizedExperiences.map((exp) => ({
        experienceId: exp.experienceId,
        date: exp.date,
        time: exp.time,
        travelers: exp.travelers,
        layoverDuration: getLayoverDuration(body.flightOffer.layovers, exp.layoverCity),
        destination: exp.layoverCity,
        userTier: userProfile.demographics.loyaltyTier,
      })),
      userProfile,
      {
        hotelPreferences: body.extras?.hotelPreferences || {
          autoBook: false,
          maxPrice: 200,
          minRating: 3.5,
          amenities: ["wifi", "shuttle"],
        },
        ancillaries: body.extras?.ancillaries || [],
        services: [],
        payment: body.payment,
      },
    )

    // Generate analytics summary
    const analytics = {
      revenueGenerated: booking.commissionSummary?.platformRevenue || 0,
      commissionEarned: booking.commissionSummary?.totalCommission || 0,
      bookingProbabilityScore: calculateAverageBookingProbability(booking.experienceBookings),
      optimizationStrategies: extractOptimizationStrategies(booking.experienceBookings),
    }

    // Format response
    const response: EnhancedBookingResponse = {
      success: true,
      booking: {
        id: booking.id,
        confirmationCode: booking.confirmationCode,
        status: booking.status,
        totalPrice: booking.totalPrice,
        currency: booking.currency,
        flightDetails: {
          confirmationCode: booking.flightBooking.confirmationCode,
          totalPrice: booking.flightBooking.totalPrice,
          tickets: booking.tickets,
        },
        experienceBookings: booking.experienceBookings.map((exp) => ({
          experienceId: exp.experienceId,
          confirmationNumber: exp.bookingConfirmation.confirmationNumber,
          destination: exp.bookingConfirmation.experienceDetails.title,
          date: exp.bookingConfirmation.experienceDetails.date,
          time: exp.bookingConfirmation.experienceDetails.time,
          price: exp.revenue.finalPrice,
          commission: exp.revenue.commission,
          voucher: exp.bookingConfirmation.voucher,
        })),
        commissionSummary: booking.commissionSummary || {
          totalCommission: 0,
          platformRevenue: 0,
          partnerPayouts: 0,
        },
        createdAt: new Date().toISOString(),
      },
      analytics,
    }

    logger.info("[EnhancedBooking] Enhanced booking completed successfully", {
      userId: user.id,
      bookingId: booking.id,
      confirmationCode: booking.confirmationCode,
      totalRevenue: analytics.revenueGenerated,
      experienceCount: booking.experienceBookings.length,
    })

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    await errorTracker.trackError(error as Error, {
      service: "enhanced-booking-api",
      operation: "createEnhancedBooking",
      metadata: {
        url: request.url,
        method: request.method,
      },
    })

    logger.error("[EnhancedBooking] Enhanced booking failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    })

    return NextResponse.json(
      {
        success: false,
        error: "Booking failed",
        message: "An error occurred while processing your enhanced booking. Please try again.",
      },
      { status: 500 },
    )
  }
}

// Get booking status and analytics
export async function GET(request: NextRequest) {
  try {
    const user = await EnhancedAuth.getCurrentUser()
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 },
      )
    }

    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get("bookingId")
    const confirmationCode = searchParams.get("confirmationCode")

    if (!bookingId && !confirmationCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Booking ID or confirmation code required",
        },
        { status: 400 },
      )
    }

    const supabase = await createClient()
    let query = supabase.from("booking_analytics").select(`
      *,
      experience_booking_analytics(*)
    `)

    if (bookingId) {
      query = query.eq("booking_id", bookingId)
    } else {
      query = query.eq("confirmation_code", confirmationCode)
    }

    const { data: booking, error } = await query.single()

    if (error || !booking) {
      return NextResponse.json(
        {
          success: false,
          error: "Booking not found",
        },
        { status: 404 },
      )
    }

    // Verify user owns this booking
    if (booking.user_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Access denied",
        },
        { status: 403 },
      )
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.booking_id,
        confirmationCode: booking.confirmation_code,
        status: "confirmed", // Would come from actual booking status
        totalPrice: booking.total_price,
        currency: booking.currency,
        experienceCount: booking.experience_count,
        totalCommission: booking.total_commission,
        platformRevenue: booking.platform_revenue,
        createdAt: booking.created_at,
        experiences: booking.experience_booking_analytics || [],
      },
    })
  } catch (error) {
    logger.error("[EnhancedBooking] Failed to get booking status", { error })

    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve booking",
      },
      { status: 500 },
    )
  }
}

// Helper functions
async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const supabase = await createClient()

    const { data: profile } = await supabase
      .from("profiles")
      .select(
        `
        *,
        user_preferences(*),
        booking_history(*)
      `,
      )
      .eq("id", userId)
      .single()

    if (!profile) return null

    // Transform database profile to UserProfile format
    return {
      id: profile.id,
      preferences: {
        activityTypes: profile.user_preferences?.activity_types || ["cultural", "outdoor"],
        budgetRange: {
          min: profile.user_preferences?.budget_min || 50,
          max: profile.user_preferences?.budget_max || 300,
        },
        physicalCapability: profile.user_preferences?.physical_capability || "moderate",
        riskTolerance: profile.user_preferences?.risk_tolerance || "moderate",
        culturalInterest: profile.user_preferences?.cultural_interest || 0.7,
        languageComfort: profile.user_preferences?.languages || ["en"],
        groupSize: profile.user_preferences?.group_size || 2,
      },
      history: {
        previousBookings:
          profile.booking_history?.map((booking: any) => ({
            experienceId: booking.experience_id,
            rating: booking.rating || 4.0,
            destination: booking.destination,
            activityType: booking.activity_type,
            price: booking.price,
            duration: booking.duration,
            weather: booking.weather_conditions || "good",
            satisfaction: booking.satisfaction || 0.8,
          })) || [],
        searchPatterns: {
          commonSearchTimes: [9, 14, 16], // Default hours
          preferredDurations: [120, 180, 240], // Default durations
          seasonalPreferences: [3, 4, 5, 9, 10], // Spring and fall
        },
      },
      demographics: {
        ageGroup: profile.age_group || "adult",
        travelExperience: profile.travel_experience || "experienced",
        loyaltyTier: profile.loyalty_tier || "bronze",
      },
    }
  } catch (error) {
    logger.error("[EnhancedBooking] Failed to get user profile", { error, userId })
    return null
  }
}

async function validateAndOptimizeExperiences(
  selections: EnhancedBookingRequest["experienceSelections"],
  layovers: EnhancedBookingRequest["flightOffer"]["layovers"],
  userProfile: UserProfile,
  preferences: EnhancedBookingRequest["preferences"],
) {
  const validatedSelections = []

  for (const selection of selections) {
    try {
      // Find matching layover
      const layover = layovers.find((l) => l.city === selection.layoverCity)
      if (!layover) {
        logger.warn("[EnhancedBooking] No matching layover for experience", {
          experienceId: selection.experienceId,
          city: selection.layoverCity,
        })
        continue
      }

      // Check if layover duration is sufficient
      if (layover.duration < 120) {
        // Less than 2 hours
        logger.warn("[EnhancedBooking] Layover too short for experience", {
          experienceId: selection.experienceId,
          duration: layover.duration,
        })
        continue
      }

      // Validate timing
      const experienceDate = new Date(selection.date)
      const layoverArrival = new Date(layover.arrival)
      const layoverDeparture = new Date(layover.departure)

      if (experienceDate < layoverArrival || experienceDate > layoverDeparture) {
        logger.warn("[EnhancedBooking] Experience timing outside layover window", {
          experienceId: selection.experienceId,
          experienceDate: selection.date,
          layoverWindow: [layover.arrival, layover.departure],
        })
        continue
      }

      validatedSelections.push(selection)
    } catch (error) {
      logger.error("[EnhancedBooking] Failed to validate experience", {
        experienceId: selection.experienceId,
        error,
      })
    }
  }

  return validatedSelections
}

function getLayoverDuration(layovers: any[], city: string): number {
  const layover = layovers.find((l) => l.city === city)
  return layover?.duration || 240 // Default 4 hours
}

function calculateAverageBookingProbability(experienceBookings: any[]): number {
  if (experienceBookings.length === 0) return 0

  const totalProbability = experienceBookings.reduce((sum, booking) => {
    return sum + (booking.commissionCalculation?.factors?.bookingProbability || 0.5)
  }, 0)

  return totalProbability / experienceBookings.length
}

function extractOptimizationStrategies(experienceBookings: any[]): string[] {
  const allStrategies = experienceBookings.flatMap(
    (booking) => booking.commissionCalculation?.appliedStrategies || [],
  )

  return [...new Set(allStrategies)] // Remove duplicates
}
