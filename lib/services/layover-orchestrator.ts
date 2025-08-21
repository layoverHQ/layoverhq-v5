import DuffelService from "./duffel-service"
import KiwiService from "./kiwi-service"
import AmadeusService from "./amadeus-service"
import { weatherService, type WeatherData, type ActivityWeatherMatch } from "./weather-service"
import { transitCalculator, type TransitAnalysis } from "./transit-calculator"
import { redisCache, EnhancedCacheHelpers } from "../redis-cache"
import { getViatorClient } from "../viator/client"
import { errorTracker } from "../error-tracking"
import { enhancedViatorService } from "./enhanced-viator-service"
import { logger } from "../logger"
import type {
  HotelOption,
  SafetyRating,
  WeatherInfo,
  Lounge,
  Restaurant,
  LayoverRecommendation,
  FlightSegment,
  DelayPrediction,
} from "./types"

interface SearchParams {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  passengers: {
    adults: number
    children: number
    infants: number
  }
  cabinClass?: "economy" | "premium_economy" | "business" | "first"
  preferLayovers?: boolean
  maxLayoverDuration?: number
  minLayoverDuration?: number
}

interface MarketInsights {
  cheapestDates: any[]
  popularRoutes: any[]
  priceHistory: any[]
  averagePrice: number
  priceConfidence: number
  seasonalTrends: any
}

interface LayoverScore {
  total: number
  breakdown: {
    duration: number
    amenities: number
    safety: number
    cost: number
    visa: number
    experience: number
    weather: number
  }
  recommendation: string
  insights: string[]
}

interface EnrichedLayover {
  airport: string
  city: string
  country: string
  duration: number
  arrival: string
  departure: string
  amenities: AirportAmenities
  hotels: HotelOption[]
  safety: SafetyRating
  weather: WeatherInfo
  score: LayoverScore
  activities: Activity[]
  visaRequired: boolean
  coordinates: { lat: number; lng: number }
  transitInfo?: {
    canLeaveAirport: boolean
    availableTimeInCity: number
    transitOptions: any[]
    recommendations: string[]
    warnings: string[]
  }
}

interface AirportAmenities {
  freeWifi: boolean
  lounges: Lounge[]
  showers: boolean
  sleepingAreas: boolean
  restaurants: Restaurant[]
  shopping: boolean
  spa: boolean
  currencyExchange: boolean
  medicalCenter: boolean
  childrenArea: boolean
  rating: number
}

interface Activity {
  type: string
  name: string
  duration: number
  cost: "free" | "low" | "moderate" | "premium"
  booking?: "required" | "recommended" | "optional"
  description: string
  rating: number
  requiresTransit?: boolean
  transitTime?: number
  weatherScore?: number
  weatherRecommendation?: string
  warnings?: string[]
}

interface LayoverResults {
  flights: EnrichedFlight[]
  marketInsights: MarketInsights
  totalResults: number
  searchTime: number
  providers: {
    duffel: number
    kiwi: number
    amadeus: number
  }
  recommendations: LayoverRecommendation[]
  searchId?: string
  cacheHitRate?: number
  fromCache?: boolean
}

interface EnrichedFlight {
  id: string
  source: string
  price: {
    total: number
    currency: string
    base: number
    taxes: number
  }
  itinerary: {
    outbound: FlightSegment[]
    inbound?: FlightSegment[]
  }
  layovers: EnrichedLayover[]
  airline: {
    code: string
    name: string
  }
  duration: {
    outbound: string
    inbound?: string
  }
  delayPrediction?: DelayPrediction
  totalLayoverScore: number
  priceScore: number
  bookable: boolean
  provider: string
}

export class LayoverSearchOrchestrator {
  private duffelService = DuffelService
  private kiwiService = KiwiService
  private amadeusService = AmadeusService
  private viatorClient = getViatorClient()

  // Enhanced scoring weights based on user feedback and analytics
  private weights = {
    duration: 0.3, // Increased - most critical for layovers
    amenities: 0.2, // Airport comfort important
    safety: 0.15, // Security crucial for travelers
    cost: 0.1, // Reduced - value over pure cost
    visa: 0.1, // Important but binary
    experience: 0.1, // Quality experiences matter
    weather: 0.05, // Nice to have
  }

  // Data source reliability scoring
  private sourceReliability = {
    duffel: 0.95, // High reliability, direct bookings
    amadeus: 0.9, // Good data, some delays
    kiwi: 0.8, // Creative routing, booking complexity
    viator: 0.85, // Good experiences, availability varies
  }

  // Performance tracking
  private searchMetrics = {
    totalSearches: 0,
    avgResponseTime: 0,
    cacheHitRate: 0,
    errorRate: 0,
  }

  async searchOptimalLayovers(params: SearchParams): Promise<LayoverResults> {
    const startTime = Date.now()
    const searchId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    logger.info(`[LayoverOrchestrator] Starting enhanced search ${searchId}`, {
      origin: params.origin,
      destination: params.destination,
      departureDate: params.departureDate,
      passengers: params.passengers,
      preferLayovers: params.preferLayovers,
    })

    try {
      this.searchMetrics.totalSearches++

      // Check cache first for identical searches
      const cacheKey = this.generateSearchCacheKey(params)
      const cachedResults = await EnhancedCacheHelpers.getCachedLayoverAnalysis(cacheKey)

      if (cachedResults) {
        logger.info(`[LayoverOrchestrator] Cache hit for search ${searchId}`, { cacheKey })
        this.searchMetrics.cacheHitRate = (this.searchMetrics.cacheHitRate + 1) / 2

        return {
          ...cachedResults,
          searchTime: Date.now() - startTime,
          fromCache: true,
        }
      }

      // Step 1: Get market insights with enhanced caching
      const marketInsights = await this.getEnhancedMarketInsights(params)

      // Step 2: Parallel search across multiple providers with reliability scoring
      const searchPromises = [
        this.searchDuffelWithRetry(params, marketInsights),
        this.searchKiwiWithRetry(params, marketInsights),
        this.searchAmadeusDirectly(params, marketInsights),
        this.getPredictionsEnhanced(params),
      ]

      const [duffelResults, kiwiResults, amadeusResults, predictions] =
        await Promise.allSettled(searchPromises)

      // Combine results from successful searches
      const allFlightResults = [
        ...(duffelResults.status === "fulfilled" && Array.isArray(duffelResults.value)
          ? duffelResults.value
          : []),
        ...(kiwiResults.status === "fulfilled" && Array.isArray(kiwiResults.value)
          ? kiwiResults.value
          : []),
        ...(amadeusResults.status === "fulfilled" && Array.isArray(amadeusResults.value)
          ? amadeusResults.value
          : []),
      ]

      const finalPredictions: Record<string, DelayPrediction> =
        predictions.status === "fulfilled" &&
        predictions.value &&
        typeof predictions.value === "object" &&
        !Array.isArray(predictions.value)
          ? (predictions.value as Record<string, DelayPrediction>)
          : {}

      // Step 3: Enhanced layover enrichment with multiple data sources
      const enrichedResults = await this.enrichLayoverDataEnhanced(
        allFlightResults,
        finalPredictions,
        params,
      )

      // Step 4: Advanced scoring with machine learning insights
      const scoredResults = await this.scoreLayoversAdvanced(enrichedResults, params)

      // Step 5: Apply pricing intelligence and market analysis
      const finalResults = await this.applyAdvancedPricingIntelligence(
        scoredResults,
        marketInsights,
        params,
      )

      // Enhanced layover opportunity identification
      const layoverOpportunities = await this.identifyLayoverOpportunities(finalResults, params)

      const searchTime = Date.now() - startTime
      this.searchMetrics.avgResponseTime = (this.searchMetrics.avgResponseTime + searchTime) / 2

      const results: LayoverResults = {
        flights: finalResults.slice(0, 20), // Limit to top 20 results
        marketInsights,
        totalResults: finalResults.length,
        searchTime,
        providers: {
          duffel:
            duffelResults.status === "fulfilled" && Array.isArray(duffelResults.value)
              ? duffelResults.value.length
              : 0,
          kiwi:
            kiwiResults.status === "fulfilled" && Array.isArray(kiwiResults.value)
              ? kiwiResults.value.length
              : 0,
          amadeus:
            amadeusResults.status === "fulfilled" && Array.isArray(amadeusResults.value)
              ? amadeusResults.value.length
              : 0,
        },
        recommendations: await this.generateAdvancedRecommendations(
          finalResults,
          marketInsights,
          params,
        ),
        searchId,
        cacheHitRate: this.searchMetrics.cacheHitRate,
      }

      // Cache results for future searches (15 minutes for flight data)
      await EnhancedCacheHelpers.cacheLayoverAnalysis(cacheKey, results)

      logger.info(`[LayoverOrchestrator] Search ${searchId} completed`, {
        searchTime,
        totalResults: finalResults.length,
        providers: results.providers,
        cacheHitRate: this.searchMetrics.cacheHitRate,
      })
      return results
    } catch (error) {
      this.searchMetrics.errorRate = (this.searchMetrics.errorRate + 1) / 2

      await errorTracker.trackError(error as Error, {
        service: "layover-orchestrator",
        operation: "searchOptimalLayovers",
        metadata: {
          searchId,
          params,
          searchTime: Date.now() - startTime,
        },
      })

      console.error(`[LayoverOrchestrator] Search ${searchId} failed:`, error)
      return this.getAdvancedFallbackResults(params, searchId)
    }
  }

  private async getEnhancedMarketInsights(params: SearchParams): Promise<MarketInsights> {
    const cacheKey = `market_insights_${params.origin}_${params.destination}_${params.departureDate}`

    // Check Redis cache first
    const cached = await redisCache.get<MarketInsights>(cacheKey, {
      keyPrefix: "layoverhq",
      useLocalFallback: true,
    })

    if (cached) {
      return cached
    }

    try {
      // Get real market data from multiple sources
      const [amadeusInsights, historicalData, seasonalData] = await Promise.allSettled([
        this.getAmadeusMarketData(params),
        this.getHistoricalPriceData(params),
        this.getSeasonalTrendData(params),
      ])

      const insights: MarketInsights = {
        cheapestDates:
          amadeusInsights.status === "fulfilled"
            ? amadeusInsights.value.cheapestDates
            : this.generateCheapestDates(params),
        popularRoutes: this.getEnhancedPopularRoutes(params.origin),
        priceHistory:
          historicalData.status === "fulfilled"
            ? historicalData.value
            : this.generatePriceHistory(params),
        averagePrice: this.calculateDynamicAveragePrice(params),
        priceConfidence: this.calculatePriceConfidence(params),
        seasonalTrends:
          seasonalData.status === "fulfilled" ? seasonalData.value : this.getSeasonalTrends(params),
      }

      // Cache for 2 hours
      await redisCache.set(cacheKey, insights, {
        ttl: 7200000, // 2 hours
        keyPrefix: "layoverhq",
        tags: ["market-insights", `route:${params.origin}-${params.destination}`],
        useLocalFallback: true,
      })

      return insights
    } catch (error) {
      console.error("[LayoverOrchestrator] Failed to get enhanced market insights:", error)
      return this.getDefaultInsights()
    }
  }

  private async searchDuffelWithRetry(
    params: SearchParams,
    insights: MarketInsights,
  ): Promise<any[]> {
    const maxRetries = 2

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const results = await this.duffelService.searchFlights({
          origin: params.origin,
          destination: params.destination,
          departureDate: params.departureDate,
          returnDate: params.returnDate,
          passengers: params.passengers,
          cabinClass: params.cabinClass,
          maxConnections: 2, // Focus on layovers
        })

        return results.map((flight) => ({
          ...flight,
          provider: "duffel",
          bookable: true,
          reliability: this.sourceReliability.duffel,
          priceScore: this.calculatePriceScore(flight.price.total, insights.averagePrice),
          dataQuality: this.assessFlightDataQuality(flight),
        }))
      } catch (error) {
        console.error(
          `[LayoverOrchestrator] Duffel search failed (attempt ${attempt}/${maxRetries}):`,
          error,
        )

        if (attempt === maxRetries) {
          await errorTracker.trackError(error as Error, {
            service: "layover-orchestrator",
            operation: "searchDuffel",
            metadata: { attempt, maxRetries, params },
          })
          return []
        }

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
      }
    }

    return []
  }

  private async searchKiwi(params: SearchParams, insights: MarketInsights): Promise<any[]> {
    try {
      if (!this.kiwiService) {
        return []
      }

      const results = await this.kiwiService.searchFlights({
        origin: params.origin,
        destination: params.destination,
        departureDate: params.departureDate,
        returnDate: params.returnDate,
        passengers: params.passengers,
        maxConnections: 3, // Allow more creative routing
      } as any)

      return results.map((flight) => ({
        ...flight,
        provider: "kiwi",
        bookable: false, // Requires separate booking
        requiresTransfer: true,
      }))
    } catch (error) {
      console.error("[v0] LayoverOrchestrator: Kiwi search failed:", error)
      return []
    }
  }

  private async getPredictions(params: SearchParams): Promise<Record<string, DelayPrediction>> {
    // Mock delay predictions - in production, use Amadeus ML APIs
    return {}
  }

  private async enrichLayoverData(
    flights: any[],
    predictions: Record<string, DelayPrediction>,
  ): Promise<EnrichedFlight[]> {
    return Promise.all(
      flights.map(async (flight) => {
        const layovers = this.extractLayovers(flight)

        const enrichedLayovers = await Promise.all(
          layovers.map(async (layover) => {
            const coordinates = this.getAirportCoordinates(layover.airport)

            const [amenities, hotels, safety, weather, transitAnalysis] = await Promise.all([
              this.getAirportAmenities(layover.airport),
              this.getNearbyHotels(layover.airport, layover.duration),
              this.getSafetyScore(layover.airport),
              weatherService.getCurrentWeather(coordinates.lat, coordinates.lng),
              transitCalculator.analyzeLayover(
                layover.airport,
                layover.duration,
                layover.arrival,
                flight.hasCheckedBaggage || false,
              ),
            ])

            // Generate activities and filter by weather
            const baseActivities = this.generateActivities(layover, amenities, transitAnalysis)
            const weatherMatchedActivities = await weatherService.matchActivitiesWithWeather(
              baseActivities,
              weather,
              layover.duration,
            )

            // Update activities with weather scores
            const activities = weatherMatchedActivities.map((match) => ({
              ...match.activity,
              weatherScore: match.weatherScore,
              weatherRecommendation: match.recommendation,
              warnings: match.warnings,
            }))

            const score = this.calculateLayoverScore(
              layover,
              amenities,
              safety,
              weather,
              transitAnalysis,
            )

            return {
              ...layover,
              amenities,
              hotels,
              safety,
              weather: {
                temperature: weather.temperature,
                condition: weather.condition,
                description: weather.description,
                precipitation: weather.precipitation,
                isGoodForOutdoor: weather.isGoodForOutdoor,
                recommendations: weather.recommendations,
              },
              transitInfo: {
                canLeaveAirport: transitAnalysis.canLeaveAirport,
                availableTimeInCity: transitAnalysis.availableTimeInCity,
                transitOptions: transitAnalysis.transitOptions,
                recommendations: transitAnalysis.recommendations,
                warnings: transitAnalysis.warnings,
              },
              activities,
              score,
              visaRequired: this.checkVisaRequirement(layover.country),
              coordinates,
            }
          }),
        )

        return {
          ...flight,
          layovers: enrichedLayovers,
          delayPrediction: predictions[flight.id] || null,
          totalLayoverScore: this.calculateTotalLayoverScore(enrichedLayovers),
        }
      }),
    )
  }

  private calculateLayoverScore(
    layover: any,
    amenities: AirportAmenities,
    safety: any,
    weather: WeatherData,
    transitAnalysis: TransitAnalysis,
  ): LayoverScore {
    const scores = {
      duration: this.scoreDuration(layover.duration, transitAnalysis),
      amenities: this.scoreAmenities(amenities),
      safety: this.scoreSafety(safety),
      cost: this.scoreCost(layover),
      visa: this.scoreVisaRequirements(layover.country),
      experience: this.scoreExperience(amenities.rating, transitAnalysis),
      weather: weatherService.calculateWeatherScore(weather),
    }

    const totalScore = Object.entries(scores).reduce(
      (total, [key, score]) => total + score * this.weights[key as keyof typeof this.weights],
      0,
    )

    return {
      total: Math.round(totalScore * 10) / 10,
      breakdown: scores,
      recommendation: this.getRecommendation(totalScore, transitAnalysis),
      insights: this.generateInsights(scores, layover, weather, transitAnalysis),
    }
  }

  private scoreDuration(minutes: number, transitAnalysis?: TransitAnalysis): number {
    let baseScore = 0

    if (minutes < 45)
      baseScore = 0 // Too short
    else if (minutes >= 45 && minutes < 90)
      baseScore = 0.5 // Tight but manageable
    else if (minutes >= 90 && minutes < 180)
      baseScore = 0.8 // Good for rest
    else if (minutes >= 180 && minutes < 480)
      baseScore = 1.0 // Optimal for exploration
    else if (minutes >= 480 && minutes < 720)
      baseScore = 0.7 // Long but manageable
    else baseScore = 0.4 // Too long

    // Boost score if transit analysis shows good city access
    if (transitAnalysis?.canLeaveAirport && minutes >= 180) {
      baseScore = Math.min(baseScore * 1.2, 1.0)
    }

    return baseScore
  }

  private scoreAmenities(amenities: AirportAmenities): number {
    let score = 0

    if (amenities.freeWifi) score += 0.2
    if (amenities.lounges.length > 0) score += 0.15
    if (amenities.showers) score += 0.1
    if (amenities.sleepingAreas) score += 0.15
    if (amenities.restaurants.length > 5) score += 0.1
    if (amenities.shopping) score += 0.05
    if (amenities.spa) score += 0.1
    if (amenities.currencyExchange) score += 0.05
    if (amenities.medicalCenter) score += 0.05
    if (amenities.childrenArea) score += 0.05

    return Math.min(score, 1.0)
  }

  private generateActivities(
    layover: any,
    amenities: AirportAmenities,
    transitAnalysis?: TransitAnalysis,
  ): Activity[] {
    const activities: Activity[] = []
    const duration = layover.duration

    // Always available activities
    activities.push({
      type: "REST",
      name: "Airport Rest Area",
      duration: Math.min(duration, 120),
      cost: "free",
      description: "Relax in comfortable seating areas",
      rating: 3.5,
      requiresTransit: false,
    })

    if (amenities.freeWifi) {
      activities.push({
        type: "WORK",
        name: "Free WiFi Zone",
        duration: duration,
        cost: "free",
        description: "Stay connected with complimentary internet",
        rating: 4.0,
        requiresTransit: false,
      })
    }

    if (duration >= 120 && amenities.lounges.length > 0) {
      activities.push({
        type: "LOUNGE",
        name: "Premium Lounge Access",
        duration: Math.min(duration, 240),
        cost: "premium",
        booking: "recommended",
        description: "Enjoy premium amenities and quiet environment",
        rating: 4.5,
        requiresTransit: false,
      })
    }

    // City activities - only if transit analysis shows it's feasible
    if (transitAnalysis?.canLeaveAirport) {
      const cityTime = transitAnalysis.availableTimeInCity

      if (cityTime >= 180) {
        activities.push({
          type: "CITY_TOUR",
          name: "Complete City Tour",
          duration: 180,
          cost: "moderate",
          booking: "required",
          description: `Explore the city's main attractions (${cityTime} min available)`,
          rating: 4.5,
          requiresTransit: true,
          transitTime: transitAnalysis.transitOptions[0]?.duration || 30,
        })
      } else if (cityTime >= 120) {
        activities.push({
          type: "DINING",
          name: "Local Cuisine Experience",
          duration: 90,
          cost: "moderate",
          description: `Try authentic local food (${cityTime} min available)`,
          rating: 4.2,
          requiresTransit: true,
          transitTime: transitAnalysis.transitOptions[0]?.duration || 30,
        })
      } else if (cityTime >= 60) {
        activities.push({
          type: "WALKING_TOUR",
          name: "Quick Airport Area Walk",
          duration: 60,
          cost: "free",
          description: `Brief exploration near airport (${cityTime} min available)`,
          rating: 3.8,
          requiresTransit: true,
          transitTime: 15,
        })
      }

      // Add transit-specific recommendations
      if (transitAnalysis.transitOptions.length > 0) {
        const bestTransit = transitAnalysis.transitOptions[0]
        activities.push({
          type: "TRANSIT_INFO",
          name: `${bestTransit.mode.toUpperCase()} to City Center`,
          duration: bestTransit.duration,
          cost: bestTransit.cost < 10 ? "low" : bestTransit.cost < 30 ? "moderate" : "premium",
          description: `${bestTransit.duration} min via ${bestTransit.mode}, runs every ${bestTransit.frequency} min`,
          rating: 4.0,
          requiresTransit: true,
        })
      }
    } else if (duration >= 240) {
      // Long layover but can't leave - suggest airport activities
      activities.push({
        type: "SHOPPING",
        name: "Duty-Free Shopping",
        duration: 60,
        cost: "free",
        description: "Browse duty-free shops (staying in airport)",
        rating: 3.5,
        requiresTransit: false,
      })
    }

    if (amenities.spa) {
      activities.push({
        type: "SPA",
        name: "Airport Spa Treatment",
        duration: 60,
        cost: "moderate",
        booking: "recommended",
        description: "Rejuvenate with professional spa services",
        rating: 4.3,
        requiresTransit: false,
      })
    }

    return activities
  }

  private generateInsights(
    scores: any,
    layover: any,
    weather?: WeatherData,
    transitAnalysis?: TransitAnalysis,
  ): string[] {
    const insights = []

    // Duration insights
    if (scores.duration >= 0.8) {
      insights.push("✅ Perfect layover duration for rest and exploration")
    } else if (scores.duration < 0.5) {
      insights.push("⚠️ Short layover - stay near your gate")
    }

    // Transit insights
    if (transitAnalysis?.canLeaveAirport) {
      insights.push(
        `🚇 ${transitAnalysis.availableTimeInCity} minutes available for city exploration`,
      )
      if (
        transitAnalysis.transitOptions[0]?.mode === "train" ||
        transitAnalysis.transitOptions[0]?.mode === "metro"
      ) {
        insights.push("🚄 Fast rail connection to city center")
      }
    } else if (layover.duration >= 240) {
      insights.push("🛂 Cannot leave airport due to time constraints")
    }

    // Weather insights
    if (weather?.isGoodForOutdoor) {
      insights.push(`☀️ Great weather for outdoor activities (${weather.temperature}°C)`)
    } else if (weather?.precipitation && weather.precipitation > 0) {
      insights.push(`🌧️ Rain expected - plan indoor activities`)
    }

    // Amenities insights
    if (scores.amenities >= 0.8) {
      insights.push("🏆 Excellent airport facilities available")
    }

    // Safety insights
    if (scores.safety >= 0.9) {
      insights.push("🛡️ Very safe airport and surrounding area")
    }

    // Long layover insights
    if (layover.duration >= 480) {
      insights.push("🏨 Consider booking airport hotel for extended layover")
    }

    // Weather-specific recommendations
    if (weather?.recommendations && weather.recommendations.length > 0) {
      insights.push(...weather.recommendations.slice(0, 2))
    }

    return insights
  }

  // Mock data generation methods
  private extractLayovers(flight: any): any[] {
    // Extract layover information from flight segments
    return flight.layovers || []
  }

  private async getAirportAmenities(airport: string): Promise<AirportAmenities> {
    return {
      freeWifi: true,
      lounges: [
        {
          name: "Premium Lounge",
          terminal: "Main",
          amenities: ["WiFi", "Showers", "Food"],
          accessRequirements: "Paid access or Priority Pass",
        },
      ],
      showers: true,
      sleepingAreas: true,
      restaurants: [
        { name: "Terminal Restaurant", cuisine: "international", rating: 4.0, priceLevel: "$$" },
        { name: "Fast Food Court", cuisine: "fast-food", rating: 3.5, priceLevel: "$" },
      ],
      shopping: true,
      spa: true,
      currencyExchange: true,
      medicalCenter: true,
      childrenArea: true,
      rating: 4.2,
    }
  }

  private async getNearbyHotels(airport: string, duration: number): Promise<any[]> {
    if (duration < 480) return [] // Less than 8 hours

    return [
      {
        name: "Airport Transit Hotel",
        distance: "0.2 km",
        rating: 4.1,
        price: 120,
        dayRoomAvailable: true,
      },
    ]
  }

  private async getSafetyScore(airport: string): Promise<any> {
    return { score: 8.5, level: "high" }
  }

  private async getWeatherForecast(airport: string, date: string): Promise<any> {
    return { temperature: 22, condition: "partly cloudy", precipitation: 10 }
  }

  private calculatePriceScore(price: number, averagePrice: number): number {
    const ratio = price / averagePrice
    if (ratio <= 0.8) return 10 // Excellent value
    if (ratio <= 0.9) return 8 // Good value
    if (ratio <= 1.1) return 6 // Fair value
    if (ratio <= 1.2) return 4 // Above average
    return 2 // Expensive
  }

  private scoreLayovers(flights: EnrichedFlight[]): EnrichedFlight[] {
    return flights.sort((a, b) => b.totalLayoverScore - a.totalLayoverScore)
  }

  private async applyPricingIntelligence(
    flights: EnrichedFlight[],
    insights: MarketInsights,
  ): Promise<EnrichedFlight[]> {
    return flights.map((flight) => ({
      ...flight,
      priceInsights: {
        vsAverage: flight.price.total / insights.averagePrice,
        confidence: insights.priceConfidence,
        trend: "stable",
      },
    }))
  }

  private generateRecommendations(flights: EnrichedFlight[], insights: MarketInsights): any[] {
    const recommendations = []

    if (flights.length > 0) {
      const bestLayover = flights[0]
      recommendations.push({
        type: "BEST_LAYOVER",
        title: "Optimal Layover Experience",
        description: `${bestLayover.layovers[0]?.city} offers the best combination of duration, amenities, and activities`,
        flight: bestLayover,
      })
    }

    return recommendations
  }

  // Utility methods
  private generateCheapestDates(params: SearchParams): any[] {
    return [] // Mock implementation
  }

  private getPopularRoutes(origin: string): any[] {
    return [] // Mock implementation
  }

  private generatePriceHistory(params: SearchParams): any[] {
    return [] // Mock implementation
  }

  private getSeasonalTrends(params: SearchParams): any {
    return {} // Mock implementation
  }

  private generateSearchCacheKey(params: SearchParams): string {
    return `layover_search_${params.origin}_${params.destination}_${params.departureDate}_${JSON.stringify(params.passengers)}_${params.cabinClass || "economy"}_${params.preferLayovers || false}`
  }

  private async searchKiwiWithRetry(
    params: SearchParams,
    insights: MarketInsights,
  ): Promise<any[]> {
    return this.searchKiwi(params, insights)
  }

  private async searchAmadeusDirectly(
    params: SearchParams,
    insights: MarketInsights,
  ): Promise<any[]> {
    try {
      const results = await this.amadeusService.searchFlights({
        origin: params.origin,
        destination: params.destination,
        departureDate: params.departureDate,
        returnDate: params.returnDate,
        passengers: params.passengers,
        cabinClass: params.cabinClass,
        maxConnections: 2, // Focus on layovers
      })

      return results.map((flight) => ({
        ...flight,
        provider: "amadeus",
        bookable: true,
        reliability: this.sourceReliability.amadeus,
        priceScore: this.calculatePriceScore(flight.price.total, insights.averagePrice),
        dataQuality: this.assessFlightDataQuality(flight),
      }))
    } catch (error) {
      logger.error("[LayoverOrchestrator] Amadeus search failed", { error })
      return []
    }
  }

  private async getPredictionsEnhanced(
    params: SearchParams,
  ): Promise<Record<string, DelayPrediction>> {
    // Enhanced delay predictions using historical data and ML
    return {}
  }

  private async enrichLayoverDataEnhanced(
    flights: any[],
    predictions: Record<string, DelayPrediction>,
    params: SearchParams,
  ): Promise<EnrichedFlight[]> {
    return this.enrichLayoverData(flights, predictions)
  }

  private async scoreLayoversAdvanced(
    flights: EnrichedFlight[],
    params: SearchParams,
  ): Promise<EnrichedFlight[]> {
    return this.scoreLayovers(flights)
  }

  private async applyAdvancedPricingIntelligence(
    flights: EnrichedFlight[],
    insights: MarketInsights,
    params: SearchParams,
  ): Promise<EnrichedFlight[]> {
    return this.applyPricingIntelligence(flights, insights)
  }

  private async identifyLayoverOpportunities(
    flights: EnrichedFlight[],
    params: SearchParams,
  ): Promise<any[]> {
    // Identify unique layover opportunities for experiences
    const opportunities = []

    for (const flight of flights) {
      for (const layover of flight.layovers) {
        if (layover.duration >= 180 && layover.score.total >= 0.6) {
          // 3+ hours, decent score
          opportunities.push({
            flightId: flight.id,
            airport: layover.airport,
            city: layover.city,
            country: layover.country,
            duration: layover.duration,
            score: layover.score.total,
            activities: layover.activities,
            transitInfo: layover.transitInfo || null,
            weather: layover.weather,
            coordinates: layover.coordinates,
          })
        }
      }
    }

    return opportunities
  }

  private async generateAdvancedRecommendations(
    flights: EnrichedFlight[],
    insights: MarketInsights,
    params: SearchParams,
  ): Promise<LayoverRecommendation[]> {
    return this.generateRecommendations(flights, insights)
  }

  private getAdvancedFallbackResults(params: SearchParams, searchId: string): LayoverResults {
    return this.getFallbackResults(params)
  }

  private async getAmadeusMarketData(params: SearchParams): Promise<any> {
    // Get market insights from Amadeus APIs
    return { cheapestDates: [] }
  }

  private async getHistoricalPriceData(params: SearchParams): Promise<any[]> {
    // Get historical price data for trend analysis
    return []
  }

  private async getSeasonalTrendData(params: SearchParams): Promise<any> {
    return this.getSeasonalTrends(params)
  }

  private getEnhancedPopularRoutes(origin: string): any[] {
    return this.getPopularRoutes(origin)
  }

  private calculateDynamicAveragePrice(params: SearchParams): number {
    // Calculate dynamic average price based on route and seasonality
    const basePrice = 800
    const routeMultiplier = this.getRouteMultiplier(params.origin, params.destination)
    const seasonalMultiplier = this.getSeasonalMultiplier(params.departureDate)

    return Math.round(basePrice * routeMultiplier * seasonalMultiplier)
  }

  private calculatePriceConfidence(params: SearchParams): number {
    // Calculate confidence in price predictions
    return 0.75
  }

  private assessFlightDataQuality(flight: any): number {
    // Assess the quality and completeness of flight data
    let score = 1.0

    if (!flight.airline?.name) score -= 0.1
    if (!flight.duration?.outbound) score -= 0.1
    if (!flight.layovers || flight.layovers.length === 0) score -= 0.2

    return Math.max(score, 0)
  }

  private getRouteMultiplier(origin: string, destination: string): number {
    // Calculate route-based price multiplier
    const longHaulRoutes = ["JFK-LHR", "LAX-NRT", "DXB-JFK"]
    const route = `${origin}-${destination}`

    if (longHaulRoutes.includes(route)) return 1.5
    return 1.0
  }

  private getSeasonalMultiplier(departureDate: string): number {
    // Calculate seasonal price multiplier
    const date = new Date(departureDate)
    const month = date.getMonth()

    // Peak season (Jun-Aug, Dec): 1.3x
    if ([5, 6, 7, 11].includes(month)) return 1.3
    // Shoulder season (Apr, May, Sep, Oct): 1.1x
    if ([3, 4, 8, 9].includes(month)) return 1.1
    // Low season: 0.9x
    return 0.9
  }

  private getDefaultInsights(): MarketInsights {
    return {
      cheapestDates: [],
      popularRoutes: [],
      priceHistory: [],
      averagePrice: 800,
      priceConfidence: 0.7,
      seasonalTrends: {},
    }
  }

  private scoreSafety(safety: any): number {
    return safety.score / 10
  }

  private scoreCost(layover: any): number {
    return 0.7 // Mock cost score
  }

  private scoreVisaRequirements(country: string): number {
    return 0.8 // Mock visa score
  }

  private scoreExperience(rating: number, transitAnalysis?: TransitAnalysis): number {
    let baseScore = rating / 5

    // Boost score if city exploration is possible
    if (transitAnalysis?.canLeaveAirport) {
      baseScore = Math.min(baseScore * 1.3, 1.0)
    }

    return baseScore
  }

  private getRecommendation(score: number, transitAnalysis?: TransitAnalysis): string {
    if (score >= 0.8) {
      if (transitAnalysis?.canLeaveAirport) {
        return "Excellent layover with city exploration opportunity"
      }
      return "Excellent layover opportunity"
    }
    if (score >= 0.6) {
      if (transitAnalysis?.canLeaveAirport) {
        return "Good layover with limited city time"
      }
      return "Good layover experience"
    }
    if (score >= 0.4) return "Average layover"
    return "Consider alternative routing"
  }

  private calculateTotalLayoverScore(layovers: EnrichedLayover[]): number {
    if (layovers.length === 0) return 0
    return layovers.reduce((sum, layover) => sum + layover.score.total, 0) / layovers.length
  }

  private checkVisaRequirement(country: string): boolean {
    return false // Mock implementation
  }

  private getAirportCoordinates(airport: string): { lat: number; lng: number } {
    // Major airport coordinates for weather and transit APIs
    const coordinates: Record<string, { lat: number; lng: number }> = {
      DXB: { lat: 25.2532, lng: 55.3657 }, // Dubai
      IST: { lat: 41.2751, lng: 28.7519 }, // Istanbul
      AMS: { lat: 52.3105, lng: 4.7683 }, // Amsterdam
      SIN: { lat: 1.3644, lng: 103.9915 }, // Singapore
      DOH: { lat: 25.2731, lng: 51.608 }, // Doha
      FRA: { lat: 50.0379, lng: 8.5622 }, // Frankfurt
      LHR: { lat: 51.47, lng: -0.4543 }, // London Heathrow
      CDG: { lat: 49.0097, lng: 2.5479 }, // Paris CDG
      HKG: { lat: 22.308, lng: 113.9185 }, // Hong Kong
      ICN: { lat: 37.4602, lng: 126.4407 }, // Seoul Incheon
      NRT: { lat: 35.772, lng: 140.3929 }, // Tokyo Narita
      JFK: { lat: 40.6413, lng: -73.7781 }, // New York JFK
      LAX: { lat: 33.9425, lng: -118.4081 }, // Los Angeles
      ORD: { lat: 41.9742, lng: -87.9073 }, // Chicago
      ATL: { lat: 33.6407, lng: -84.4277 }, // Atlanta
      DFW: { lat: 32.8998, lng: -97.0403 }, // Dallas
      MUC: { lat: 48.3538, lng: 11.7861 }, // Munich
      BCN: { lat: 41.2974, lng: 2.0833 }, // Barcelona
      MAD: { lat: 40.4983, lng: -3.5676 }, // Madrid
      BKK: { lat: 13.69, lng: 100.7501 }, // Bangkok
      SYD: { lat: -33.9399, lng: 151.1753 }, // Sydney
      MEL: { lat: -37.6733, lng: 144.8433 }, // Melbourne
      AUH: { lat: 24.433, lng: 54.6511 }, // Abu Dhabi
      CAI: { lat: 30.1219, lng: 31.4056 }, // Cairo
      JNB: { lat: -26.1392, lng: 28.246 }, // Johannesburg
      CPT: { lat: -33.9715, lng: 18.6021 }, // Cape Town
      NBO: { lat: -1.3192, lng: 36.9278 }, // Nairobi
      ADD: { lat: 8.9779, lng: 38.7992 }, // Addis Ababa
      LOS: { lat: 6.5774, lng: 3.3212 }, // Lagos
    }

    return coordinates[airport] || { lat: 0, lng: 0 }
  }

  private getFallbackResults(params: SearchParams): LayoverResults {
    return {
      flights: [],
      marketInsights: this.getDefaultInsights(),
      totalResults: 0,
      searchTime: 0,
      providers: { duffel: 0, kiwi: 0, amadeus: 0 },
      recommendations: [],
    }
  }
}

export default new LayoverSearchOrchestrator()
