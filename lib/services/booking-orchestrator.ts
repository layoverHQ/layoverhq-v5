import DuffelService from "./duffel-service"
import AmadeusService from "./amadeus-service"
import {
  configurableViatorService,
  type RevenueOptimizedExperience,
} from "./configurable-viator-service"
import {
  stripePaymentService,
  type BookingDetails,
  type BookingConfirmation as StripeBookingConfirmation,
} from "./stripe-payment-service"
import { commissionEngine, type CommissionCalculation } from "./commission-engine"
import {
  enhancedLayoverDiscoveryEngine,
  type LayoverContext,
  type UserProfile,
} from "./enhanced-layover-discovery-engine"
import { weatherService } from "./weather-service"
import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"

interface BookingExtras {
  hotelPreferences: HotelPreferences
  ancillaries: AncillaryService[]
  services: string[]
  payment: PaymentInfo
}

interface HotelPreferences {
  autoBook: boolean
  maxPrice: number
  minRating: number
  amenities: string[]
}

interface AncillaryService {
  type: string
  selection: any
}

interface PaymentInfo {
  method: string
  currency: string
}

interface Passenger {
  type: "adult" | "child" | "infant"
  firstName: string
  lastName: string
  dateOfBirth: string
  email?: string
  phone?: string
}

interface BookingConfirmation {
  id: string
  status: "confirmed" | "pending" | "failed"
  flightBooking: any
  hotelBookings: any[]
  ancillaries: any[]
  experienceBookings: ExperienceBookingResult[]
  totalPrice: number
  currency: string
  confirmationCode: string
  tickets: any[]
  commissionSummary?: {
    totalCommission: number
    platformRevenue: number
    partnerPayouts: number
  }
}

interface ExperienceBookingRequest {
  experienceId: string
  date: string
  time: string
  travelers: Array<{
    title: string
    firstName: string
    lastName: string
    email?: string
    phone?: string
  }>
  layoverDuration: number
  destination: string
  userTier: string
}

interface ExperienceBookingResult {
  experienceId: string
  bookingConfirmation: StripeBookingConfirmation
  commissionCalculation: CommissionCalculation
  revenue: {
    basePrice: number
    finalPrice: number
    commission: number
    partnerPayout: number
  }
}

export class BookingOrchestrator {
  private duffelService = DuffelService
  private amadeusService = AmadeusService

  async createLayoverBooking(
    flightOffer: any,
    passengers: Passenger[],
    extras: BookingExtras,
  ): Promise<BookingConfirmation> {
    logger.info("[BookingOrchestrator] Starting layover booking process", {
      flightId: flightOffer.id,
      passengers: passengers.length,
      layovers: flightOffer.layovers?.length || 0,
    })

    try {
      // Step 1: Validate and confirm price
      const priceConfirmation = await this.confirmPrice(flightOffer)

      // Step 2: Check if hotel booking needed for long layovers
      const hotelBookings = await this.handleLayoverAccommodation(
        flightOffer.layovers,
        passengers,
        extras.hotelPreferences,
      )

      // Step 3: Create the main flight booking
      const flightBooking = await this.createFlightBooking(priceConfirmation, passengers, extras)

      // Step 4: Add ancillary services
      const ancillaries = await this.addAncillaryServices(flightBooking, extras.ancillaries)

      // Step 5: Process payment and confirm
      const confirmation = await this.processPaymentAndConfirm(
        flightBooking,
        hotelBookings,
        ancillaries,
        [],
        extras.payment,
      )

      // Step 6: Send confirmations and set up monitoring
      await this.postBookingActions(confirmation)

      logger.info("[BookingOrchestrator] Booking completed successfully", {
        confirmationCode: confirmation.confirmationCode,
        totalPrice: confirmation.totalPrice,
      })
      return confirmation
    } catch (error) {
      logger.error("[BookingOrchestrator] Booking failed", { error })
      throw error
    }
  }

  /**
   * Create complete layover booking with experiences
   */
  async createEnhancedLayoverBooking(
    flightOffer: any,
    passengers: Passenger[],
    experienceRequests: ExperienceBookingRequest[],
    userProfile: UserProfile,
    extras: BookingExtras,
  ): Promise<BookingConfirmation> {
    logger.info("[BookingOrchestrator] Starting enhanced layover booking with experiences", {
      flightId: flightOffer.id,
      passengers: passengers.length,
      experiences: experienceRequests.length,
      userTier: userProfile.demographics.loyaltyTier,
    })

    try {
      // Step 1: Validate and confirm flight price
      const priceConfirmation = await this.confirmPrice(flightOffer)

      // Step 2: Process experience bookings with revenue optimization
      const experienceBookings = await this.processExperienceBookings(
        experienceRequests,
        userProfile,
      )

      // Step 3: Handle layover accommodation if needed
      const hotelBookings = await this.handleLayoverAccommodation(
        flightOffer.layovers,
        passengers,
        extras.hotelPreferences,
      )

      // Step 4: Create the main flight booking
      const flightBooking = await this.createFlightBooking(priceConfirmation, passengers, extras)

      // Step 5: Add ancillary services
      const ancillaries = await this.addAncillaryServices(flightBooking, extras.ancillaries)

      // Step 6: Process payment and confirm with commission tracking
      const confirmation = await this.processPaymentAndConfirm(
        flightBooking,
        hotelBookings,
        ancillaries,
        experienceBookings,
        extras.payment,
      )

      // Step 7: Track revenue analytics
      await this.trackRevenueAnalytics(confirmation, userProfile)

      // Step 8: Send confirmations and set up monitoring
      await this.postBookingActions(confirmation)

      logger.info("[BookingOrchestrator] Enhanced booking completed successfully", {
        confirmationCode: confirmation.confirmationCode,
        totalPrice: confirmation.totalPrice,
        totalCommission: confirmation.commissionSummary?.totalCommission,
        experienceBookings: experienceBookings.length,
      })

      return confirmation
    } catch (error) {
      logger.error("[BookingOrchestrator] Enhanced booking failed", { error })
      throw error
    }
  }

  private async confirmPrice(flightOffer: any): Promise<any> {
    if (flightOffer.provider === "duffel") {
      // Use Duffel to confirm current price
      return {
        offerId: flightOffer.id,
        amount: flightOffer.price.total,
        currency: flightOffer.price.currency,
        provider: "duffel",
        confirmed: true,
      }
    }

    throw new Error("Price confirmation only available for Duffel flights")
  }

  private async handleLayoverAccommodation(
    layovers: any[],
    passengers: Passenger[],
    preferences: HotelPreferences,
  ): Promise<any[]> {
    const longLayovers = layovers.filter((l) => l.duration > 480) // > 8 hours

    if (longLayovers.length === 0) {
      console.log("[v0] BookingOrchestrator: No long layovers requiring accommodation")
      return []
    }

    console.log(`[v0] BookingOrchestrator: Found ${longLayovers.length} long layovers`)

    return Promise.all(
      longLayovers.map(async (layover) => {
        try {
          // Mock hotel search - in production, use Amadeus Hotel API
          const hotels = await this.searchLayoverHotels(layover, passengers)

          const suitableHotels = hotels.filter((hotel) => {
            if (layover.duration < 720) {
              // < 12 hours
              return hotel.dayRoomAvailable
            }
            return hotel.rating >= preferences.minRating && hotel.price <= preferences.maxPrice
          })

          if (preferences.autoBook && suitableHotels.length > 0) {
            const bestHotel = this.selectBestHotel(suitableHotels, preferences, layover)
            const booking = await this.bookHotel(bestHotel, passengers, layover)

            console.log(`[v0] BookingOrchestrator: Auto-booked hotel for ${layover.city}`)
            return { layover, hotel: bestHotel, booking, status: "booked" }
          }

          return { layover, suggested: suitableHotels, status: "suggested" }
        } catch (error) {
          console.error(`[v0] BookingOrchestrator: Hotel search failed for ${layover.city}:`, error)
          return { layover, error: error.message, status: "failed" }
        }
      }),
    )
  }

  private async searchLayoverHotels(layover: any, passengers: Passenger[]): Promise<any[]> {
    // Mock hotel data - in production, use Amadeus Hotel Search API
    return [
      {
        id: "hotel_1",
        name: "Airport Transit Hotel",
        rating: 4.2,
        price: 120,
        currency: "USD",
        distance: "0.2 km from airport",
        dayRoomAvailable: true,
        amenities: ["wifi", "shower", "restaurant"],
        coordinates: { lat: layover.coordinates?.lat || 0, lng: layover.coordinates?.lng || 0 },
      },
      {
        id: "hotel_2",
        name: "City Center Hotel",
        rating: 4.5,
        price: 180,
        currency: "USD",
        distance: "15 km from airport",
        dayRoomAvailable: false,
        amenities: ["wifi", "pool", "spa", "restaurant"],
        shuttleService: true,
      },
    ]
  }

  private selectBestHotel(hotels: any[], preferences: HotelPreferences, layover: any): any {
    // Score hotels based on preferences
    return hotels.reduce((best, hotel) => {
      const score = this.scoreHotel(hotel, preferences, layover)
      return score > (best.score || 0) ? { ...hotel, score } : best
    }, hotels[0])
  }

  private scoreHotel(hotel: any, preferences: HotelPreferences, layover: any): number {
    let score = 0

    // Rating score (40%)
    score += (hotel.rating / 5) * 0.4

    // Price score (30%)
    const priceScore = Math.max(0, 1 - hotel.price / preferences.maxPrice)
    score += priceScore * 0.3

    // Distance score (20%)
    const distanceScore = hotel.distance.includes("km")
      ? Math.max(0, 1 - Number.parseFloat(hotel.distance) / 20)
      : 0.8
    score += distanceScore * 0.2

    // Amenities score (10%)
    const amenityMatches = preferences.amenities.filter((pref) =>
      hotel.amenities.includes(pref),
    ).length
    score += (amenityMatches / preferences.amenities.length) * 0.1

    return score
  }

  private async bookHotel(hotel: any, passengers: Passenger[], layover: any): Promise<any> {
    // Mock hotel booking - in production, use Amadeus Hotel Booking API
    return {
      id: `booking_${Date.now()}`,
      hotelId: hotel.id,
      confirmationCode: `HTL${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      checkIn: layover.arrival,
      checkOut: layover.departure,
      guests: passengers.filter((p) => p.type === "adult").length,
      totalPrice: hotel.price,
      currency: hotel.currency,
      status: "confirmed",
    }
  }

  private async createFlightBooking(
    priceConfirmation: any,
    passengers: Passenger[],
    extras: BookingExtras,
  ): Promise<any> {
    if (priceConfirmation.provider === "duffel") {
      // Mock Duffel booking - in production, use actual Duffel Booking API
      return {
        id: `flight_${Date.now()}`,
        offerId: priceConfirmation.offerId,
        confirmationCode: `FLT${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        passengers: passengers,
        totalPrice: priceConfirmation.amount,
        currency: priceConfirmation.currency,
        status: "confirmed",
        tickets: passengers.map((passenger, index) => ({
          id: `ticket_${index}`,
          passengerName: `${passenger.firstName} ${passenger.lastName}`,
          ticketNumber: `TKT${Math.random().toString(36).substr(2, 10).toUpperCase()}`,
        })),
      }
    }

    throw new Error("Direct booking only available through Duffel")
  }

  private async addAncillaryServices(
    flightBooking: any,
    ancillaries: AncillaryService[],
  ): Promise<any[]> {
    // Mock ancillary services - in production, use Duffel Ancillaries API
    return ancillaries.map((service) => ({
      id: `anc_${Date.now()}_${service.type}`,
      type: service.type,
      description: `${service.type} service`,
      price: this.getAncillaryPrice(service.type),
      currency: flightBooking.currency,
      status: "confirmed",
    }))
  }

  private getAncillaryPrice(type: string): number {
    const prices: Record<string, number> = {
      seat_selection: 25,
      extra_baggage: 50,
      meal: 15,
      lounge_access: 45,
      priority_boarding: 20,
    }
    return prices[type] || 0
  }

  /**
   * Process experience bookings with revenue optimization
   */
  private async processExperienceBookings(
    experienceRequests: ExperienceBookingRequest[],
    userProfile: UserProfile,
  ): Promise<ExperienceBookingResult[]> {
    const results: ExperienceBookingResult[] = []

    for (const request of experienceRequests) {
      try {
        logger.info("[BookingOrchestrator] Processing experience booking", {
          experienceId: request.experienceId,
          destination: request.destination,
          userTier: request.userTier,
        })

        // Get weather data for the experience
        const weather = await weatherService.getWeatherForLayover(
          request.destination,
          new Date(request.date),
          request.layoverDuration,
        )

        // Calculate dynamic pricing and commission
        const commissionCalculation = await commissionEngine.calculateDynamicPricing(
          request.experienceId,
          100, // Base price - would come from Viator API
          "USD",
          request.layoverDuration,
          weather,
          request.userTier,
          "DXB", // Destination code - would be mapped from destination
          "cultural", // Experience type - would come from experience data
        )

        // Create booking details for Stripe
        const bookingDetails: BookingDetails = {
          experienceId: request.experienceId,
          experienceTitle: `Experience in ${request.destination}`,
          basePrice: commissionCalculation.basePrice,
          finalPrice: commissionCalculation.finalPrice,
          currency: "USD",
          layoverDuration: request.layoverDuration,
          destination: request.destination,
          date: request.date,
          time: request.time,
          travelers: request.travelers,
          userId: userProfile.id,
          userTier: request.userTier,
        }

        // Create payment intent
        const paymentIntent = await stripePaymentService.createPaymentIntent(
          bookingDetails,
          commissionCalculation,
        )

        // Simulate payment success and confirm booking
        const bookingConfirmation = await stripePaymentService.confirmBooking(paymentIntent.id, {
          specialRequests: "Layover experience booking",
        })

        // Track commission
        await commissionEngine.trackCommission(commissionCalculation, userProfile.id)

        results.push({
          experienceId: request.experienceId,
          bookingConfirmation,
          commissionCalculation,
          revenue: {
            basePrice: commissionCalculation.basePrice,
            finalPrice: commissionCalculation.finalPrice,
            commission: commissionCalculation.commissionAmount,
            partnerPayout: commissionCalculation.partnerPayout,
          },
        })

        logger.info("[BookingOrchestrator] Experience booking successful", {
          experienceId: request.experienceId,
          confirmationNumber: bookingConfirmation.confirmationNumber,
          commission: commissionCalculation.commissionAmount,
        })
      } catch (error) {
        logger.error("[BookingOrchestrator] Experience booking failed", {
          experienceId: request.experienceId,
          error,
        })
        // Continue with other bookings rather than failing the entire process
      }
    }

    return results
  }

  private async processPaymentAndConfirm(
    flightBooking: any,
    hotelBookings: any[],
    ancillaries: any[],
    experienceBookings: ExperienceBookingResult[],
    payment: PaymentInfo,
  ): Promise<BookingConfirmation> {
    // Calculate total price including experiences
    const experienceTotal = experienceBookings.reduce((sum, exp) => sum + exp.revenue.finalPrice, 0)

    const totalPrice =
      flightBooking.totalPrice +
      hotelBookings.reduce((sum, hotel) => sum + (hotel.booking?.totalPrice || 0), 0) +
      ancillaries.reduce((sum, anc) => sum + anc.price, 0) +
      experienceTotal

    // Calculate commission summary
    const commissionSummary =
      experienceBookings.length > 0
        ? {
            totalCommission: experienceBookings.reduce(
              (sum, exp) => sum + exp.revenue.commission,
              0,
            ),
            platformRevenue: experienceBookings.reduce(
              (sum, exp) => sum + exp.revenue.commission,
              0,
            ),
            partnerPayouts: experienceBookings.reduce(
              (sum, exp) => sum + exp.revenue.partnerPayout,
              0,
            ),
          }
        : undefined

    return {
      id: `booking_${Date.now()}`,
      status: "confirmed",
      flightBooking,
      hotelBookings,
      ancillaries,
      experienceBookings,
      totalPrice,
      currency: payment.currency,
      confirmationCode: `LHQ${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      tickets: flightBooking.tickets,
      commissionSummary,
    }
  }

  /**
   * Track revenue analytics for the booking
   */
  private async trackRevenueAnalytics(
    confirmation: BookingConfirmation,
    userProfile: UserProfile,
  ): Promise<void> {
    try {
      const supabase = await createClient()

      // Track overall booking analytics
      await supabase.from("booking_analytics").insert({
        booking_id: confirmation.id,
        confirmation_code: confirmation.confirmationCode,
        user_id: userProfile.id,
        user_tier: userProfile.demographics.loyaltyTier,
        total_price: confirmation.totalPrice,
        currency: confirmation.currency,
        experience_count: confirmation.experienceBookings.length,
        total_commission: confirmation.commissionSummary?.totalCommission || 0,
        platform_revenue: confirmation.commissionSummary?.platformRevenue || 0,
        booking_type: "enhanced_layover",
        created_at: new Date().toISOString(),
      })

      // Track individual experience analytics
      for (const expBooking of confirmation.experienceBookings) {
        await supabase.from("experience_booking_analytics").insert({
          booking_id: confirmation.id,
          experience_id: expBooking.experienceId,
          base_price: expBooking.revenue.basePrice,
          final_price: expBooking.revenue.finalPrice,
          commission_earned: expBooking.revenue.commission,
          partner_payout: expBooking.revenue.partnerPayout,
          commission_rate: expBooking.commissionCalculation.commissionRate,
          applied_strategies: expBooking.commissionCalculation.appliedStrategies,
          user_tier: userProfile.demographics.loyaltyTier,
          created_at: new Date().toISOString(),
        })
      }

      logger.info("[BookingOrchestrator] Revenue analytics tracked", {
        bookingId: confirmation.id,
        totalCommission: confirmation.commissionSummary?.totalCommission,
        experienceCount: confirmation.experienceBookings.length,
      })
    } catch (error) {
      logger.error("[BookingOrchestrator] Failed to track revenue analytics", { error })
      // Don't fail the booking for analytics issues
    }
  }

  private async postBookingActions(confirmation: BookingConfirmation): Promise<void> {
    // Send confirmation emails, set up monitoring, etc.
    console.log(`[v0] BookingOrchestrator: Confirmation ${confirmation.confirmationCode} processed`)

    // In production:
    // - Send confirmation emails
    // - Set up flight monitoring
    // - Schedule reminder notifications
    // - Update user booking history
  }
}

export default new BookingOrchestrator()
