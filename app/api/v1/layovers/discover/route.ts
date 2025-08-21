import { type NextRequest, NextResponse } from "next/server"
import {
  coreLayoverDiscoveryEngine,
  type LayoverDiscoveryParams,
} from "@/lib/services/core-layover-discovery-engine"
import { EnhancedAuth } from "@/lib/enhanced-auth"
import { logger } from "@/lib/logger"
import { errorTracker } from "@/lib/error-tracking"
import { ratelimit } from "@/lib/rate-limit"
import { performanceMonitor } from "@/lib/performance/performance-monitor"
import {
  enhancedErrorHandler,
  ErrorSeverity,
  ErrorCategory,
  withErrorHandling,
} from "@/lib/monitoring/enhanced-error-handling"

export async function POST(request: NextRequest) {
  // Start performance tracking
  const perfTracker = performanceMonitor.startTracking("/api/v1/layovers/discover", "POST")
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  try {
    // Rate limiting
    const ip =
      request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const rateLimitResult = await ratelimit.api.limit(`layover_discovery_${ip}`)

    if (!rateLimitResult.success) {
      perfTracker.end(429)
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 },
      )
    }

    const body = (await request.json()) as LayoverDiscoveryParams & { userId?: string }

    // Validate required parameters
    if (!body.origin || !body.destination || !body.departureDate) {
      perfTracker.end(400)
      return NextResponse.json(
        {
          error: "Missing required parameters",
          required: ["origin", "destination", "departureDate"],
        },
        { status: 400 },
      )
    }

    // Validate passengers
    if (!body.passengers || body.passengers.adults < 1) {
      perfTracker.end(400)
      return NextResponse.json(
        { error: "At least one adult passenger is required" },
        { status: 400 },
      )
    }

    logger.info("[LayoverDiscovery] Starting discovery request", {
      requestId,
      origin: body.origin,
      destination: body.destination,
      departureDate: body.departureDate,
      passengers: body.passengers,
      userId: body.userId,
    })

    // Discover layover opportunities with enhanced error handling
    const results = await withErrorHandling(
      () => coreLayoverDiscoveryEngine.discoverLayoverOpportunities(body),
      {
        service: "layover-discovery-api",
        operation: "discoverOpportunities",
        requestId,
        endpoint: "/api/v1/layovers/discover",
        method: "POST",
        userId: body.userId,
        ip,
        metadata: {
          origin: body.origin,
          destination: body.destination,
          departureDate: body.departureDate,
        },
      },
      {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.API_ERROR,
        retries: 1,
      },
    )

    // Log success metrics
    logger.info("[LayoverDiscovery] Discovery completed successfully", {
      requestId,
      opportunitiesFound: results.opportunities.length,
      totalFlights: results.totalFlights,
      searchTime: results.searchTime,
      userId: body.userId,
    })

    // End performance tracking with success
    perfTracker.end(200, false, body.userId)

    return NextResponse.json({
      success: true,
      data: {
        opportunities: results.opportunities.map((opp) => ({
          id: opp.id,
          location: {
            airport: opp.airport,
            city: opp.city,
            country: opp.country,
            coordinates: opp.coordinates,
          },
          timing: {
            duration: opp.duration,
            durationHours: Math.round((opp.duration / 60) * 10) / 10,
            arrivalTime: opp.arrivalTime,
            departureTime: opp.departureTime,
          },
          scores: {
            overall: Math.round(opp.overallScore * 100),
            feasibility: Math.round(opp.feasibilityScore * 100),
            experience: Math.round(opp.experienceScore * 100),
            weather: Math.round(opp.weatherScore * 100),
          },
          context: {
            weather: {
              temperature: opp.weather.temperature,
              condition: opp.weather.condition,
              isGoodForOutdoor: opp.weather.isGoodForOutdoor,
            },
            transit: {
              canLeaveAirport: opp.transitAnalysis.canLeaveAirport,
              availableTimeInCity: opp.transitAnalysis.availableTimeInCity,
              bestTransitMode: opp.transitAnalysis.transitOptions[0]?.mode || "unknown",
            },
            experiencesAvailable: opp.experiences.length,
          },
          recommendations: opp.topRecommendations,
          warnings: opp.warnings,
          flight: {
            id: opp.flightId,
            price: opp.totalFlightPrice,
            airline: opp.airline,
          },
        })),
        insights: {
          best: results.insights.bestOverallOpportunity
            ? {
                id: results.insights.bestOverallOpportunity.id,
                city: results.insights.bestOverallOpportunity.city,
                score: Math.round(results.insights.bestOverallOpportunity.overallScore * 100),
                duration: results.insights.bestOverallOpportunity.duration,
              }
            : null,
          categories: {
            weatherFriendly: results.insights.weatherFriendlyOptions.map((opp) => ({
              id: opp.id,
              city: opp.city,
              weatherScore: Math.round(opp.weatherScore * 100),
            })),
            quickExplore: results.insights.quickExploreOptions.map((opp) => ({
              id: opp.id,
              city: opp.city,
              duration: opp.duration,
            })),
            extendedStay: results.insights.extendedStayOptions.map((opp) => ({
              id: opp.id,
              city: opp.city,
              duration: opp.duration,
            })),
          },
        },
        market: {
          averageLayoverDuration: results.marketData.averageLayoverDuration,
          averageLayoverHours:
            Math.round((results.marketData.averageLayoverDuration / 60) * 10) / 10,
          popularCities: results.marketData.mostPopularCities,
          priceRange: results.marketData.priceRange,
        },
        metadata: {
          totalOpportunities: results.opportunities.length,
          totalFlights: results.totalFlights,
          searchTime: results.searchTime,
          searchParams: {
            origin: body.origin,
            destination: body.destination,
            departureDate: body.departureDate,
            passengers: body.passengers,
          },
        },
      },
    })
  } catch (error) {
    // End performance tracking with error
    perfTracker.end(500)

    // Enhanced error handling
    await enhancedErrorHandler.handleError(
      error as Error,
      {
        service: "layover-discovery-api",
        operation: "discover",
        requestId,
        endpoint: "/api/v1/layovers/discover",
        method: "POST",
        ip: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        metadata: {
          url: request.url,
          method: request.method,
        },
      },
      ErrorSeverity.HIGH,
      ErrorCategory.API_ERROR,
    )

    logger.error("[LayoverDiscovery] Discovery request failed", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
    })

    return NextResponse.json(
      {
        error: "Failed to discover layover opportunities",
        message: "An internal error occurred while processing your request",
        requestId,
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Convert query parameters to LayoverDiscoveryParams
    const params: LayoverDiscoveryParams = {
      origin: searchParams.get("origin") || "",
      destination: searchParams.get("destination") || "",
      departureDate: searchParams.get("departureDate") || "",
      returnDate: searchParams.get("returnDate") || undefined,
      passengers: {
        adults: parseInt(searchParams.get("adults") || "1"),
        children: parseInt(searchParams.get("children") || "0"),
        infants: parseInt(searchParams.get("infants") || "0"),
      },
      preferences: {
        minLayoverDuration: searchParams.get("minLayoverDuration")
          ? parseInt(searchParams.get("minLayoverDuration")!)
          : undefined,
        maxLayoverDuration: searchParams.get("maxLayoverDuration")
          ? parseInt(searchParams.get("maxLayoverDuration")!)
          : undefined,
        preferredActivities: searchParams.get("activities")?.split(",") || undefined,
        budgetRange:
          searchParams.get("budgetMin") && searchParams.get("budgetMax")
            ? [parseInt(searchParams.get("budgetMin")!), parseInt(searchParams.get("budgetMax")!)]
            : undefined,
        physicalDemand:
          (searchParams.get("physicalDemand") as "low" | "moderate" | "high") || undefined,
      },
    }

    // Validate required parameters
    if (!params.origin || !params.destination || !params.departureDate) {
      return NextResponse.json(
        {
          error: "Missing required parameters",
          required: ["origin", "destination", "departureDate"],
        },
        { status: 400 },
      )
    }

    // Use POST endpoint logic for GET requests (for backward compatibility)
    const mockRequest = new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify(params),
    })

    return await POST(mockRequest as NextRequest)
  } catch (error) {
    logger.error("[LayoverDiscovery] GET request failed", { error })

    return NextResponse.json({ error: "Failed to process GET request" }, { status: 500 })
  }
}
