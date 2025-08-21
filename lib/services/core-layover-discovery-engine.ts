/**
 * Core Layover Discovery Engine - Phase 1 Implementation
 *
 * This is the central engine that identifies, scores, and recommends layover opportunities
 * by orchestrating multiple data sources and applying intelligent algorithms.
 */

import { FlightAggregatorService } from "./flight-aggregator"
import { enhancedViatorService, type EnhancedViatorExperience } from "./enhanced-viator-service"
import { weatherService, type WeatherData } from "./weather-service"
import { transitCalculator, type TransitAnalysis } from "./transit-calculator"
import { redisCache } from "../redis-cache"
import { errorTracker } from "../error-tracking"
import { logger } from "../logger"

export interface LayoverDiscoveryParams {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  passengers: {
    adults: number
    children: number
    infants: number
  }
  preferences?: {
    minLayoverDuration?: number // minutes
    maxLayoverDuration?: number // minutes
    preferredActivities?: string[]
    budgetRange?: [number, number]
    physicalDemand?: "low" | "moderate" | "high"
  }
}

export interface LayoverOpportunity {
  id: string
  airport: string
  city: string
  country: string
  duration: number // minutes
  arrivalTime: string
  departureTime: string

  // Scoring and recommendations
  overallScore: number
  feasibilityScore: number
  experienceScore: number
  weatherScore: number

  // Context data
  weather: WeatherData
  transitAnalysis: TransitAnalysis
  experiences: EnhancedViatorExperience[]

  // Recommendations
  topRecommendations: string[]
  warnings: string[]

  // Flight context
  flightId: string
  totalFlightPrice: number
  airline: string

  coordinates: {
    lat: number
    lng: number
  }
}

export interface DiscoveryResults {
  opportunities: LayoverOpportunity[]
  totalFlights: number
  searchTime: number
  insights: {
    bestOverallOpportunity?: LayoverOpportunity
    weatherFriendlyOptions: LayoverOpportunity[]
    quickExploreOptions: LayoverOpportunity[]
    extendedStayOptions: LayoverOpportunity[]
  }
  marketData: {
    averageLayoverDuration: number
    mostPopularCities: string[]
    priceRange: [number, number]
  }
}

export class CoreLayoverDiscoveryEngine {
  private flightAggregator = new FlightAggregatorService()
  private readonly MIN_LAYOVER_THRESHOLD = 120 // 2 hours minimum
  private readonly MAX_LAYOVER_THRESHOLD = 1440 // 24 hours maximum

  async discoverLayoverOpportunities(params: LayoverDiscoveryParams): Promise<DiscoveryResults> {
    const startTime = Date.now()
    const searchId = this.generateSearchId()

    logger.info("[CoreLayoverDiscovery] Starting opportunity discovery", {
      searchId,
      origin: params.origin,
      destination: params.destination,
      departureDate: params.departureDate,
    })

    try {
      // Step 1: Search for flights with layovers
      const flightResults = await this.findLayoverFlights(params)

      // Step 2: Extract and filter layover opportunities
      const rawOpportunities = await this.extractLayoverOpportunities(flightResults, params)

      // Step 3: Enrich opportunities with context data
      const enrichedOpportunities = await this.enrichOpportunities(rawOpportunities)

      // Step 4: Score and rank opportunities
      const scoredOpportunities = await this.scoreOpportunities(enrichedOpportunities, params)

      // Step 5: Generate insights and recommendations
      const insights = this.generateInsights(scoredOpportunities)
      const marketData = this.calculateMarketData(scoredOpportunities, flightResults)

      const searchTime = Date.now() - startTime

      logger.info("[CoreLayoverDiscovery] Discovery completed", {
        searchId,
        opportunitiesFound: scoredOpportunities.length,
        searchTime,
      })

      return {
        opportunities: scoredOpportunities,
        totalFlights: flightResults.length,
        searchTime,
        insights,
        marketData,
      }
    } catch (error) {
      await errorTracker.trackError(error as Error, {
        service: "core-layover-discovery",
        operation: "discoverLayoverOpportunities",
        metadata: { searchId, params },
      })

      logger.error("[CoreLayoverDiscovery] Discovery failed", { searchId, error })

      return {
        opportunities: [],
        totalFlights: 0,
        searchTime: Date.now() - startTime,
        insights: {
          weatherFriendlyOptions: [],
          quickExploreOptions: [],
          extendedStayOptions: [],
        },
        marketData: {
          averageLayoverDuration: 0,
          mostPopularCities: [],
          priceRange: [0, 0],
        },
      }
    }
  }

  private async findLayoverFlights(params: LayoverDiscoveryParams): Promise<any[]> {
    const cacheKey = `layover_flights_${params.origin}_${params.destination}_${params.departureDate}`

    // Check cache first
    const cached = await redisCache.get(cacheKey, {
      keyPrefix: "layoverhq",
      useLocalFallback: true,
    })

    if (cached && Array.isArray(cached)) {
      logger.info("[CoreLayoverDiscovery] Using cached flight results")
      return cached
    }

    // Search for flights with preference for layovers
    const searchParams = {
      origin: params.origin,
      destination: params.destination,
      departureDate: params.departureDate,
      returnDate: params.returnDate,
      passengers: params.passengers,
      maxConnections: 2, // Allow up to 2 connections for layovers
      preferLayovers: true,
    }

    const results = await this.flightAggregator.searchAllProviders(searchParams)

    // Filter flights with meaningful layovers
    const layoverFlights = results.flights.filter((flight) =>
      this.hasValidLayovers(flight, params.preferences),
    )

    // Cache results for 15 minutes
    await redisCache.set(cacheKey, layoverFlights, {
      ttl: 900000, // 15 minutes
      keyPrefix: "layoverhq",
      useLocalFallback: true,
    })

    return layoverFlights
  }

  private hasValidLayovers(
    flight: any,
    preferences?: LayoverDiscoveryParams["preferences"],
  ): boolean {
    if (!flight.layovers || flight.layovers.length === 0) {
      return false
    }

    const minDuration = preferences?.minLayoverDuration || this.MIN_LAYOVER_THRESHOLD
    const maxDuration = preferences?.maxLayoverDuration || this.MAX_LAYOVER_THRESHOLD

    return flight.layovers.some(
      (layover: any) => layover.duration >= minDuration && layover.duration <= maxDuration,
    )
  }

  private async extractLayoverOpportunities(
    flights: any[],
    params: LayoverDiscoveryParams,
  ): Promise<Partial<LayoverOpportunity>[]> {
    const opportunities: Partial<LayoverOpportunity>[] = []

    for (const flight of flights) {
      for (const layover of flight.layovers || []) {
        if (this.isViableLayover(layover, params.preferences)) {
          opportunities.push({
            id: `${flight.id}_${layover.airport}`,
            flightId: flight.id,
            airport: layover.airport,
            city: layover.city,
            country: layover.country,
            duration: layover.duration,
            arrivalTime: layover.arrival,
            departureTime: layover.departure,
            totalFlightPrice: flight.price?.total || 0,
            airline: flight.airline?.name || "Unknown",
            coordinates: this.getAirportCoordinates(layover.airport),
          })
        }
      }
    }

    // Deduplicate by city and similar duration
    return this.deduplicateOpportunities(opportunities)
  }

  private isViableLayover(
    layover: any,
    preferences?: LayoverDiscoveryParams["preferences"],
  ): boolean {
    const minDuration = preferences?.minLayoverDuration || this.MIN_LAYOVER_THRESHOLD
    const maxDuration = preferences?.maxLayoverDuration || this.MAX_LAYOVER_THRESHOLD

    return (
      layover.duration >= minDuration &&
      layover.duration <= maxDuration &&
      layover.city &&
      layover.airport
    )
  }

  private deduplicateOpportunities(
    opportunities: Partial<LayoverOpportunity>[],
  ): Partial<LayoverOpportunity>[] {
    const seen = new Map<string, Partial<LayoverOpportunity>>()

    for (const opp of opportunities) {
      const key = `${opp.city}_${Math.floor((opp.duration || 0) / 60)}` // Group by city and hour

      if (!seen.has(key) || (opp.duration || 0) > (seen.get(key)?.duration || 0)) {
        seen.set(key, opp)
      }
    }

    return Array.from(seen.values())
  }

  private async enrichOpportunities(
    opportunities: Partial<LayoverOpportunity>[],
  ): Promise<Partial<LayoverOpportunity>[]> {
    return Promise.all(
      opportunities.map(async (opp) => {
        try {
          const [weather, transitAnalysis, experiences] = await Promise.allSettled([
            weatherService.getCurrentWeather(opp.coordinates!.lat, opp.coordinates!.lng),
            transitCalculator.analyzeLayover(opp.airport!, opp.duration!, opp.arrivalTime!),
            enhancedViatorService.searchWeatherAwareExperiences(
              opp.city!,
              opp.duration!,
              opp.airport!,
              opp.arrivalTime!,
              await weatherService.getCurrentWeather(opp.coordinates!.lat, opp.coordinates!.lng),
            ),
          ])

          return {
            ...opp,
            weather: weather.status === "fulfilled" ? weather.value : this.getDefaultWeather(),
            transitAnalysis:
              transitAnalysis.status === "fulfilled"
                ? transitAnalysis.value
                : this.getDefaultTransit(),
            experiences: experiences.status === "fulfilled" ? experiences.value : [],
          }
        } catch (error) {
          logger.warn("[CoreLayoverDiscovery] Failed to enrich opportunity", {
            opportunityId: opp.id,
            error,
          })

          return {
            ...opp,
            weather: this.getDefaultWeather(),
            transitAnalysis: this.getDefaultTransit(),
            experiences: [],
          }
        }
      }),
    )
  }

  private async scoreOpportunities(
    opportunities: Partial<LayoverOpportunity>[],
    params: LayoverDiscoveryParams,
  ): Promise<LayoverOpportunity[]> {
    return opportunities
      .map((opp) => {
        const feasibilityScore = this.calculateFeasibilityScore(opp.transitAnalysis!, opp.duration!)
        const experienceScore = this.calculateExperienceScore(opp.experiences!, params.preferences)
        const weatherScore = this.calculateWeatherScore(opp.weather!, opp.experiences!)

        const overallScore = feasibilityScore * 0.4 + experienceScore * 0.4 + weatherScore * 0.2

        const recommendations = this.generateRecommendations(
          opp,
          feasibilityScore,
          experienceScore,
          weatherScore,
        )
        const warnings = this.generateWarnings(opp)

        return {
          ...opp,
          overallScore,
          feasibilityScore,
          experienceScore,
          weatherScore,
          topRecommendations: recommendations,
          warnings,
        } as LayoverOpportunity
      })
      .sort((a, b) => b.overallScore - a.overallScore)
  }

  private calculateFeasibilityScore(transit: TransitAnalysis, duration: number): number {
    let score = 0.5 // Base score

    if (transit.canLeaveAirport) {
      score += 0.3

      // Bonus for good available time
      const timeRatio = transit.availableTimeInCity / duration
      if (timeRatio >= 0.6) score += 0.2
      else if (timeRatio >= 0.4) score += 0.1
    }

    // Transit quality bonus
    if (transit.transitOptions?.length > 0) {
      const bestOption = transit.transitOptions[0]
      if (bestOption.duration <= 30) score += 0.1
      if (bestOption.mode === "train" || bestOption.mode === "metro") score += 0.05
    }

    return Math.min(score, 1.0)
  }

  private calculateExperienceScore(
    experiences: EnhancedViatorExperience[],
    preferences?: LayoverDiscoveryParams["preferences"],
  ): number {
    if (experiences.length === 0) return 0.3

    let score = 0.5

    // Quality of experiences
    const avgRating =
      experiences.reduce((sum, exp) => sum + (exp.rating?.average || 3.5), 0) / experiences.length
    score += (avgRating - 3.0) * 0.1 // Normalize around 3.0

    // Variety bonus
    const uniqueCategories = new Set(
      experiences.flatMap((exp) => exp.categories.map((cat) => cat.id)),
    )
    score += Math.min(uniqueCategories.size * 0.05, 0.2)

    // Preference matching
    if (preferences?.preferredActivities) {
      const matchingExperiences = experiences.filter((exp) =>
        exp.categories.some((cat) =>
          preferences.preferredActivities!.some((pref) =>
            cat.name.toLowerCase().includes(pref.toLowerCase()),
          ),
        ),
      )
      score += (matchingExperiences.length / experiences.length) * 0.2
    }

    return Math.min(score, 1.0)
  }

  private calculateWeatherScore(
    weather: WeatherData,
    experiences: EnhancedViatorExperience[],
  ): number {
    let score = 0.5

    if (weather.isGoodForOutdoor) {
      score += 0.3

      // Bonus for outdoor experiences in good weather
      const outdoorExperiences = experiences.filter((exp) => exp.activityType === "outdoor")
      score += (outdoorExperiences.length / Math.max(experiences.length, 1)) * 0.2
    } else {
      // Indoor experiences bonus in bad weather
      const indoorExperiences = experiences.filter((exp) => exp.activityType === "indoor")
      score += (indoorExperiences.length / Math.max(experiences.length, 1)) * 0.3
    }

    return Math.min(score, 1.0)
  }

  private generateRecommendations(
    opp: Partial<LayoverOpportunity>,
    feasibility: number,
    experience: number,
    weather: number,
  ): string[] {
    const recommendations: string[] = []

    if (feasibility >= 0.8) {
      recommendations.push(`✅ Excellent opportunity to explore ${opp.city}`)
    } else if (feasibility >= 0.6) {
      recommendations.push(`⚠️ Possible to explore ${opp.city} with careful planning`)
    } else {
      recommendations.push(`🏢 Better to stay at the airport in ${opp.city}`)
    }

    if (weather >= 0.7) {
      recommendations.push("☀️ Great weather for outdoor activities")
    } else if (weather <= 0.4) {
      recommendations.push("🏛️ Perfect weather for indoor experiences")
    }

    if (experience >= 0.7) {
      recommendations.push("🎯 High-quality experiences available")
    }

    return recommendations
  }

  private generateWarnings(opp: Partial<LayoverOpportunity>): string[] {
    const warnings: string[] = []

    if ((opp.duration || 0) < 180) {
      warnings.push("⏰ Short layover - stay close to the airport")
    }

    if (!opp.transitAnalysis?.canLeaveAirport) {
      warnings.push("🚫 Insufficient time to leave the airport safely")
    }

    if (opp.weather && !opp.weather.isGoodForOutdoor) {
      warnings.push("🌧️ Weather may limit outdoor activities")
    }

    return warnings
  }

  private generateInsights(opportunities: LayoverOpportunity[]) {
    const weatherFriendly = opportunities.filter((opp) => opp.weatherScore >= 0.7)
    const quickExplore = opportunities.filter((opp) => opp.duration >= 120 && opp.duration <= 300)
    const extendedStay = opportunities.filter((opp) => opp.duration > 300)

    return {
      bestOverallOpportunity: opportunities[0],
      weatherFriendlyOptions: weatherFriendly.slice(0, 3),
      quickExploreOptions: quickExplore.slice(0, 3),
      extendedStayOptions: extendedStay.slice(0, 3),
    }
  }

  private calculateMarketData(opportunities: LayoverOpportunity[], flights: any[]) {
    const durations = opportunities.map((opp) => opp.duration)
    const prices = opportunities.map((opp) => opp.totalFlightPrice).filter((p) => p > 0)
    const cities = opportunities.map((opp) => opp.city)

    return {
      averageLayoverDuration:
        durations.length > 0
          ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
          : 0,
      mostPopularCities: [...new Set(cities)].slice(0, 5),
      priceRange:
        prices.length > 0
          ? ([Math.min(...prices), Math.max(...prices)] as [number, number])
          : ([0, 0] as [number, number]),
    }
  }

  private getAirportCoordinates(airportCode: string): { lat: number; lng: number } {
    // Major airport coordinates - should be moved to a proper database
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
      BKK: { lat: 13.69, lng: 100.7501 }, // Bangkok
      SYD: { lat: -33.9399, lng: 151.1753 }, // Sydney
      AUH: { lat: 24.433, lng: 54.6511 }, // Abu Dhabi
    }

    return coordinates[airportCode] || { lat: 0, lng: 0 }
  }

  private getDefaultWeather(): WeatherData {
    return {
      temperature: 20,
      feelsLike: 20,
      condition: "unknown",
      description: "Weather data unavailable",
      humidity: 50,
      windSpeed: 0,
      visibility: 10,
      cloudiness: 50,
      precipitation: 0,
      icon: "01d",
      isGoodForOutdoor: true,
      recommendations: [],
    }
  }

  private getDefaultTransit(): TransitAnalysis {
    return {
      canLeaveAirport: false,
      minimumLayoverRequired: 120,
      availableTimeInCity: 0,
      transitOptions: [],
      recommendations: ["Stay at the airport - transit data unavailable"],
      warnings: ["Transit information could not be determined"],
      confidence: 0.0,
    }
  }

  private generateSearchId(): string {
    return `discovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

export const coreLayoverDiscoveryEngine = new CoreLayoverDiscoveryEngine()
