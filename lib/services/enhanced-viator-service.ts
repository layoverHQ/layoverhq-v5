import { weatherService, type WeatherData, type ActivityWeatherMatch } from "./weather-service"
import { transitCalculator, type TransitAnalysis } from "./transit-calculator"

interface ViatorProduct {
  productCode: string
  title: string
  description: string
  summary: string
  duration: {
    fixedDurationInMinutes?: number
    variableDurationFromMinutes?: number
    variableDurationToMinutes?: number
  }
  price: {
    fromPrice: number
    currency: string
  }
  images: Array<{
    imageUrl: string
    caption?: string
  }>
  categories: Array<{
    id: string
    name: string
  }>
  tags: string[]
  inclusions: string[]
  exclusions: string[]
  highlights: string[]
  itinerary?: Array<{
    title: string
    description: string
    duration?: number
    location?: string
  }>
  meetingPoint?: {
    description: string
    location?: {
      latitude: number
      longitude: number
    }
  }
  bookingRequirements: {
    minAge?: number
    maxAge?: number
    requiresAdult: boolean
    maxTravelers?: number
  }
  cancellationPolicy: {
    type: string
    description: string
  }
  rating?: {
    average: number
    count: number
  }
  weatherDependency: "high" | "medium" | "low" | "none"
  activityType: "outdoor" | "indoor" | "mixed"
  physicalDemand: "low" | "moderate" | "high"
}

interface EnhancedViatorExperience extends ViatorProduct {
  weatherScore: number
  weatherRecommendation: string
  weatherWarnings: string[]
  transitFeasibility: {
    canReach: boolean
    travelTime: number
    totalTimeRequired: number
    reasoning: string
  }
  layoverSuitability: {
    score: number
    minLayoverRequired: number
    ideal: boolean
    reasons: string[]
  }
  adaptations?: {
    badWeatherAlternative?: string
    shortTimeAlternative?: string
    indoorOption?: boolean
  }
}

interface SearchFilters {
  minDuration?: number
  maxDuration?: number
  maxPrice?: number
  categories?: string[]
  weatherAdaptive?: boolean
  transitTime?: number
  activityType?: "outdoor" | "indoor" | "mixed"
  physicalDemand?: "low" | "moderate" | "high"
}

class EnhancedViatorService {
  private apiKey: string
  private baseUrl: string
  private cache = new Map<string, { data: any; timestamp: number }>()
  private cacheTimeout = 30 * 60 * 1000 // 30 minutes

  constructor() {
    this.apiKey = process.env.VIATOR_API_KEY || process.env.NEXT_PUBLIC_VIATOR_API_KEY || ""
    this.baseUrl =
      process.env.VIATOR_ENVIRONMENT === "production"
        ? "https://api.viator.com/partner"
        : "https://api.sandbox.viator.com/partner"

    if (!this.apiKey) {
      console.warn("⚠️ Viator API key not configured - using mock data")
    }
  }

  async searchWeatherAwareExperiences(
    cityName: string,
    layoverDuration: number,
    airportCode: string,
    arrivalTime: string,
    weather: WeatherData,
    filters?: SearchFilters,
  ): Promise<EnhancedViatorExperience[]> {
    try {
      // Get transit analysis
      const transitAnalysis = await transitCalculator.analyzeLayover(
        airportCode,
        layoverDuration,
        arrivalTime,
      )

      // Search for experiences
      const experiences = await this.searchExperiences(cityName, filters)

      // Enhance each experience with weather and transit data
      const enhancedExperiences = await Promise.all(
        experiences.map((experience) =>
          this.enhanceExperience(experience, weather, transitAnalysis, layoverDuration),
        ),
      )

      // Sort by combined score (weather + transit + layover suitability)
      return enhancedExperiences
        .filter((exp) => exp.transitFeasibility.canReach)
        .sort((a, b) => {
          const scoreA = (a.weatherScore + a.layoverSuitability.score) / 2
          const scoreB = (b.weatherScore + b.layoverSuitability.score) / 2
          return scoreB - scoreA
        })
    } catch (error) {
      console.error("Enhanced Viator search error:", error)
      return this.getFallbackExperiences(cityName, weather, layoverDuration)
    }
  }

  private async searchExperiences(
    cityName: string,
    filters?: SearchFilters,
  ): Promise<ViatorProduct[]> {
    const cacheKey = `viator_search_${cityName}_${JSON.stringify(filters)}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    if (!this.apiKey) {
      console.warn("No Viator API key, returning mock data")
      return this.getMockExperiences(cityName)
    }

    try {
      // Search for products in the destination
      const searchResponse = await fetch(`${this.baseUrl}/products/search`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "exp-api-key": this.apiKey,
        },
        body: JSON.stringify({
          filtering: {
            destination: cityName,
            durationFrom: filters?.minDuration,
            durationTo: filters?.maxDuration,
            priceFrom: 0,
            priceTo: filters?.maxPrice,
            categoryIds: filters?.categories,
          },
          sorting: {
            sort: "PRICE_FROM_LOW_TO_HIGH",
            order: "ASC",
          },
          pagination: {
            start: 1,
            count: 20,
          },
        }),
      })

      if (!searchResponse.ok) {
        throw new Error(`Viator API error: ${searchResponse.status}`)
      }

      const searchData = await searchResponse.json()
      const productCodes = searchData.products?.map((p: any) => p.productCode) || []

      if (productCodes.length === 0) {
        return this.getMockExperiences(cityName)
      }

      // Get detailed product information
      const detailsResponse = await fetch(`${this.baseUrl}/products`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "exp-api-key": this.apiKey,
        },
        body: JSON.stringify({
          productCodes: productCodes.slice(0, 10), // Limit to 10 products
        }),
      })

      if (!detailsResponse.ok) {
        throw new Error(`Viator details API error: ${detailsResponse.status}`)
      }

      const detailsData = await detailsResponse.json()
      const experiences = this.parseViatorProducts(detailsData.products || [])

      this.setCache(cacheKey, experiences)
      return experiences
    } catch (error) {
      console.error("Viator API error:", error)
      return this.getMockExperiences(cityName)
    }
  }

  private async enhanceExperience(
    experience: ViatorProduct,
    weather: WeatherData,
    transitAnalysis: TransitAnalysis,
    layoverDuration: number,
  ): Promise<EnhancedViatorExperience> {
    // Calculate weather compatibility
    const weatherMatch = this.calculateWeatherMatch(experience, weather)

    // Calculate transit feasibility
    const transitFeasibility = this.calculateTransitFeasibility(experience, transitAnalysis)

    // Calculate layover suitability
    const layoverSuitability = this.calculateLayoverSuitability(
      experience,
      layoverDuration,
      transitFeasibility.totalTimeRequired,
    )

    // Generate adaptations for different conditions
    const adaptations = this.generateAdaptations(experience, weather, layoverDuration)

    return {
      ...experience,
      weatherScore: weatherMatch.score,
      weatherRecommendation: weatherMatch.recommendation,
      weatherWarnings: weatherMatch.warnings,
      transitFeasibility,
      layoverSuitability,
      adaptations,
    }
  }

  private calculateWeatherMatch(
    experience: ViatorProduct,
    weather: WeatherData,
  ): { score: number; recommendation: string; warnings: string[] } {
    let score = 1.0
    const warnings: string[] = []
    let recommendation = ""

    // Weather dependency impact
    if (experience.weatherDependency === "high" && !weather.isGoodForOutdoor) {
      score *= 0.2
      warnings.push("⛈️ High weather dependency - current conditions not ideal")
    } else if (experience.weatherDependency === "medium" && !weather.isGoodForOutdoor) {
      score *= 0.6
      warnings.push("🌧️ Weather may affect experience quality")
    }

    // Activity type vs weather
    if (experience.activityType === "outdoor") {
      if (weather.precipitation > 0) {
        score *= 0.4
        warnings.push("☔ Rain expected - outdoor activity may be cancelled")
      }
      if (weather.temperature < 5 || weather.temperature > 35) {
        score *= 0.5
        warnings.push("🌡️ Extreme temperatures for outdoor activity")
      }
      if (weather.windSpeed > 15) {
        score *= 0.7
        warnings.push("💨 Strong winds may affect outdoor experience")
      }
    } else if (experience.activityType === "indoor") {
      // Indoor activities get bonus in bad weather
      if (!weather.isGoodForOutdoor) {
        score *= 1.3
        recommendation = "✅ Perfect indoor option for current weather"
      }
    }

    // Temperature-specific recommendations
    if (weather.temperature > 30 && experience.activityType === "outdoor") {
      warnings.push("🥵 Very hot - ensure hydration and sun protection")
    } else if (weather.temperature < 10 && experience.activityType === "outdoor") {
      warnings.push("🥶 Cold weather - dress warmly")
    }

    if (!recommendation) {
      if (score >= 0.8) {
        recommendation = "✨ Excellent weather match for this activity"
      } else if (score >= 0.6) {
        recommendation = "👍 Good weather conditions"
      } else if (score >= 0.4) {
        recommendation = "⚠️ Weather may impact experience - check conditions"
      } else {
        recommendation = "❌ Poor weather match - consider alternatives"
      }
    }

    return { score, recommendation, warnings }
  }

  private calculateTransitFeasibility(
    experience: ViatorProduct,
    transitAnalysis: TransitAnalysis,
  ): {
    canReach: boolean
    travelTime: number
    totalTimeRequired: number
    reasoning: string
  } {
    if (!transitAnalysis.canLeaveAirport) {
      return {
        canReach: false,
        travelTime: 0,
        totalTimeRequired: 0,
        reasoning: "Insufficient layover time to leave airport",
      }
    }

    const experienceDuration =
      experience.duration.fixedDurationInMinutes ||
      experience.duration.variableDurationFromMinutes ||
      120 // Default 2 hours

    const transitTime = transitAnalysis.transitOptions[0]?.duration || 30
    const totalTimeRequired = experienceDuration + transitTime * 2 + 30 // Buffer

    const canReach = totalTimeRequired <= transitAnalysis.availableTimeInCity

    return {
      canReach,
      travelTime: transitTime,
      totalTimeRequired,
      reasoning: canReach
        ? `Reachable with ${transitAnalysis.availableTimeInCity - totalTimeRequired} minutes to spare`
        : `Requires ${totalTimeRequired} minutes but only ${transitAnalysis.availableTimeInCity} available`,
    }
  }

  private calculateLayoverSuitability(
    experience: ViatorProduct,
    layoverDuration: number,
    totalTimeRequired: number,
  ): {
    score: number
    minLayoverRequired: number
    ideal: boolean
    reasons: string[]
  } {
    const minLayoverRequired = totalTimeRequired + 60 // Extra buffer
    const ideal = layoverDuration >= minLayoverRequired + 60 // Comfortable margin
    const reasons: string[] = []

    let score = 1.0

    // Time fit scoring
    if (layoverDuration < minLayoverRequired) {
      score = 0
      reasons.push("Insufficient time for this experience")
    } else if (layoverDuration < minLayoverRequired + 30) {
      score *= 0.6
      reasons.push("Tight schedule - minimal buffer time")
    } else if (layoverDuration < minLayoverRequired + 60) {
      score *= 0.8
      reasons.push("Adequate time but limited flexibility")
    } else {
      score *= 1.0
      reasons.push("Comfortable time allocation")
    }

    // Experience duration appropriateness
    const experienceDuration = experience.duration.fixedDurationInMinutes || 120
    if (experienceDuration > layoverDuration * 0.6) {
      score *= 0.7
      reasons.push("Experience takes significant portion of layover")
    }

    // Physical demand consideration for rushed travelers
    if (experience.physicalDemand === "high" && layoverDuration < 300) {
      score *= 0.8
      reasons.push("High physical demand may be tiring for rushed schedule")
    }

    return {
      score,
      minLayoverRequired,
      ideal,
      reasons,
    }
  }

  private generateAdaptations(
    experience: ViatorProduct,
    weather: WeatherData,
    layoverDuration: number,
  ): {
    badWeatherAlternative?: string
    shortTimeAlternative?: string
    indoorOption?: boolean
  } {
    const adaptations: any = {}

    // Bad weather alternatives
    if (!weather.isGoodForOutdoor && experience.activityType === "outdoor") {
      if (experience.categories.some((cat) => cat.name.includes("Museum"))) {
        adaptations.badWeatherAlternative = "Consider museum or gallery instead"
        adaptations.indoorOption = true
      } else if (experience.categories.some((cat) => cat.name.includes("Food"))) {
        adaptations.badWeatherAlternative = "Perfect weather for indoor dining experience"
        adaptations.indoorOption = true
      } else {
        adaptations.badWeatherAlternative = "Look for covered or indoor alternatives"
      }
    }

    // Short time alternatives
    const experienceDuration = experience.duration.fixedDurationInMinutes || 120
    if (experienceDuration > layoverDuration * 0.5) {
      adaptations.shortTimeAlternative = "Consider a shorter version or key highlights only"
    }

    return adaptations
  }

  private parseViatorProducts(products: any[]): ViatorProduct[] {
    return products.map((product) => ({
      productCode: product.productCode,
      title: product.title,
      description: product.description || "",
      summary: product.summary || "",
      duration: {
        fixedDurationInMinutes: product.duration?.fixedDurationInMinutes,
        variableDurationFromMinutes: product.duration?.variableDurationFromMinutes,
        variableDurationToMinutes: product.duration?.variableDurationToMinutes,
      },
      price: {
        fromPrice: parseFloat(product.pricing?.summary?.fromPrice || "0"),
        currency: product.pricing?.summary?.currency || "USD",
      },
      images: product.images || [],
      categories: product.categories || [],
      tags: product.tags || [],
      inclusions: product.inclusions || [],
      exclusions: product.exclusions || [],
      highlights: product.highlights || [],
      itinerary: product.itinerary,
      meetingPoint: product.logistics?.meetingPoint,
      bookingRequirements: {
        minAge: product.bookingRequirements?.minAge,
        maxAge: product.bookingRequirements?.maxAge,
        requiresAdult: product.bookingRequirements?.requiresAdultForBooking || false,
        maxTravelers: product.bookingRequirements?.maxTravelersPerBooking,
      },
      cancellationPolicy: {
        type: product.cancellationPolicy?.type || "standard",
        description: product.cancellationPolicy?.description || "",
      },
      rating: product.reviews
        ? {
            average: product.reviews.combinedAverageRating,
            count: product.reviews.totalReviews,
          }
        : undefined,
      weatherDependency: this.inferWeatherDependency(product),
      activityType: this.inferActivityType(product),
      physicalDemand: this.inferPhysicalDemand(product),
    }))
  }

  private inferWeatherDependency(product: any): "high" | "medium" | "low" | "none" {
    const title = product.title?.toLowerCase() || ""
    const description = product.description?.toLowerCase() || ""
    const categories = product.categories?.map((c: any) => c.name.toLowerCase()) || []

    if (
      title.includes("outdoor") ||
      title.includes("beach") ||
      title.includes("hiking") ||
      categories.some((c) => c.includes("outdoor") || c.includes("nature"))
    ) {
      return "high"
    }
    if (title.includes("walking") || title.includes("tour") || title.includes("sightseeing")) {
      return "medium"
    }
    if (
      title.includes("museum") ||
      title.includes("indoor") ||
      categories.some((c) => c.includes("museum") || c.includes("cultural"))
    ) {
      return "none"
    }
    return "low"
  }

  private inferActivityType(product: any): "outdoor" | "indoor" | "mixed" {
    const title = product.title?.toLowerCase() || ""
    const categories = product.categories?.map((c: any) => c.name.toLowerCase()) || []

    if (
      title.includes("museum") ||
      title.includes("gallery") ||
      title.includes("restaurant") ||
      categories.some((c) => c.includes("museum") || c.includes("cultural") || c.includes("food"))
    ) {
      return "indoor"
    }
    if (
      title.includes("outdoor") ||
      title.includes("beach") ||
      title.includes("park") ||
      categories.some((c) => c.includes("outdoor") || c.includes("nature"))
    ) {
      return "outdoor"
    }
    return "mixed"
  }

  private inferPhysicalDemand(product: any): "low" | "moderate" | "high" {
    const title = product.title?.toLowerCase() || ""
    const description = product.description?.toLowerCase() || ""

    if (title.includes("hiking") || title.includes("adventure") || title.includes("climbing")) {
      return "high"
    }
    if (title.includes("walking") || title.includes("cycling") || title.includes("tour")) {
      return "moderate"
    }
    return "low"
  }

  private getMockExperiences(cityName: string): ViatorProduct[] {
    const mockData: { [key: string]: ViatorProduct[] } = {
      Dubai: [
        {
          productCode: "MOCK_DUBAI_001",
          title: "Dubai Marina and JBR Beach Walk",
          description: "Relaxing walk along Dubai Marina with optional beach time",
          summary: "Perfect layover activity combining urban and beach vibes",
          duration: { fixedDurationInMinutes: 120 },
          price: { fromPrice: 0, currency: "USD" },
          images: [],
          categories: [{ id: "outdoor", name: "Outdoor Activities" }],
          tags: ["walking", "beach", "free"],
          inclusions: ["Free access to Marina Walk"],
          exclusions: ["Transportation", "Food"],
          highlights: ["Stunning Marina views", "Beach access", "Shopping options"],
          bookingRequirements: { requiresAdult: false },
          cancellationPolicy: { type: "free", description: "Free cancellation" },
          weatherDependency: "high",
          activityType: "outdoor",
          physicalDemand: "low",
        },
      ],
      Istanbul: [
        {
          productCode: "MOCK_IST_001",
          title: "Hagia Sophia and Blue Mosque Tour",
          description: "Quick tour of Istanbul's most iconic landmarks",
          summary: "Essential Istanbul experience perfect for layovers",
          duration: { fixedDurationInMinutes: 180 },
          price: { fromPrice: 25, currency: "USD" },
          images: [],
          categories: [{ id: "cultural", name: "Cultural Tours" }],
          tags: ["history", "architecture", "guided"],
          inclusions: ["Guide", "Entry fees"],
          exclusions: ["Transportation", "Meals"],
          highlights: ["Hagia Sophia", "Blue Mosque", "Historical insights"],
          bookingRequirements: { requiresAdult: false },
          cancellationPolicy: { type: "24h", description: "24h free cancellation" },
          weatherDependency: "low",
          activityType: "mixed",
          physicalDemand: "moderate",
        },
      ],
    }

    return mockData[cityName] || []
  }

  private getFallbackExperiences(
    cityName: string,
    weather: WeatherData,
    layoverDuration: number,
  ): EnhancedViatorExperience[] {
    const mockExperiences = this.getMockExperiences(cityName)

    return mockExperiences.map((exp) => ({
      ...exp,
      weatherScore: weather.isGoodForOutdoor ? 0.8 : 0.6,
      weatherRecommendation: weather.isGoodForOutdoor
        ? "Good weather for this activity"
        : "Weather may affect experience",
      weatherWarnings: weather.isGoodForOutdoor ? [] : ["Check weather before departure"],
      transitFeasibility: {
        canReach: layoverDuration > 180,
        travelTime: 30,
        totalTimeRequired: 240,
        reasoning:
          layoverDuration > 180
            ? "Estimated as reachable with basic transit"
            : "May not have enough time",
      },
      layoverSuitability: {
        score: layoverDuration > 240 ? 0.8 : 0.4,
        minLayoverRequired: 240,
        ideal: layoverDuration > 300,
        reasons: ["Estimated timing based on typical layover constraints"],
      },
    }))
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }
    return null
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  // Real-time booking capabilities
  async checkAvailability(
    productCode: string,
    date: string,
    travelers: number = 1,
  ): Promise<{
    available: boolean
    availableTimes?: string[]
    pricing?: any
    restrictions?: string[]
  }> {
    if (!this.apiKey) {
      return {
        available: true,
        availableTimes: ["09:00", "14:00"],
        pricing: { totalPrice: 50, currency: "USD" },
        restrictions: [],
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/availability/check`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "exp-api-key": this.apiKey,
        },
        body: JSON.stringify({
          productCode,
          travelDate: date,
          travelers: Array(travelers).fill({
            bandId: "ADULT",
          }),
        }),
      })

      if (!response.ok) {
        throw new Error(`Availability check failed: ${response.status}`)
      }

      const data = await response.json()

      return {
        available: data.available || false,
        availableTimes: data.availableTimes || [],
        pricing: data.pricing,
        restrictions: data.restrictions || [],
      }
    } catch (error) {
      console.error("Viator availability check failed:", error)
      return {
        available: false,
        restrictions: ["Unable to check availability at this time"],
      }
    }
  }

  async createBooking(
    productCode: string,
    date: string,
    time: string,
    travelers: Array<{
      title: string
      firstName: string
      lastName: string
      email?: string
      phone?: string
    }>,
    bookingOptions?: {
      currency?: string
      language?: string
      pickupLocation?: string
    },
  ): Promise<{
    success: boolean
    bookingReference?: string
    confirmationNumber?: string
    totalPrice?: number
    status?: string
    error?: string
  }> {
    if (!this.apiKey) {
      // Mock booking for development
      return {
        success: true,
        bookingReference: `MOCK_${Date.now()}`,
        confirmationNumber: `LHQ${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        totalPrice: 50,
        status: "CONFIRMED",
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/bookings`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "exp-api-key": this.apiKey,
        },
        body: JSON.stringify({
          productCode,
          travelDate: date,
          startTime: time,
          travelers: travelers.map((traveler) => ({
            title: traveler.title,
            firstName: traveler.firstName,
            lastName: traveler.lastName,
            email: traveler.email,
            phone: traveler.phone,
            bandId: "ADULT",
          })),
          currency: bookingOptions?.currency || "USD",
          language: bookingOptions?.language || "en",
          pickupLocation: bookingOptions?.pickupLocation,
        }),
      })

      if (!response.ok) {
        throw new Error(`Booking failed: ${response.status}`)
      }

      const data = await response.json()

      return {
        success: true,
        bookingReference: data.bookingReference,
        confirmationNumber: data.confirmationNumber,
        totalPrice: data.totalPrice,
        status: data.status,
      }
    } catch (error) {
      console.error("Viator booking failed:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Booking failed",
      }
    }
  }

  async getBookingStatus(bookingReference: string): Promise<{
    status: string
    confirmationNumber?: string
    voucher?: {
      downloadUrl: string
      instructions: string[]
    }
    cancellationPolicy?: any
  }> {
    if (!this.apiKey) {
      return {
        status: "CONFIRMED",
        confirmationNumber: `LHQ${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        voucher: {
          downloadUrl: "/mock-voucher.pdf",
          instructions: ["Present this voucher at the meeting point", "Arrive 15 minutes early"],
        },
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/bookings/${bookingReference}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "exp-api-key": this.apiKey,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to get booking status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Failed to get booking status:", error)
      return {
        status: "UNKNOWN",
      }
    }
  }

  async cancelBooking(
    bookingReference: string,
    reason?: string,
  ): Promise<{
    success: boolean
    refundAmount?: number
    cancellationFee?: number
    error?: string
  }> {
    if (!this.apiKey) {
      return {
        success: true,
        refundAmount: 45,
        cancellationFee: 5,
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/bookings/${bookingReference}/cancel`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "exp-api-key": this.apiKey,
        },
        body: JSON.stringify({
          reason: reason || "Customer requested cancellation",
        }),
      })

      if (!response.ok) {
        throw new Error(`Cancellation failed: ${response.status}`)
      }

      const data = await response.json()
      return {
        success: true,
        refundAmount: data.refundAmount,
        cancellationFee: data.cancellationFee,
      }
    } catch (error) {
      console.error("Viator cancellation failed:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Cancellation failed",
      }
    }
  }

  // Enhanced experience search with real-time availability
  async searchWithRealTimeAvailability(
    cityName: string,
    date: string,
    filters?: SearchFilters,
  ): Promise<
    Array<
      ViatorProduct & {
        realTimeAvailability: boolean
        nextAvailableDate?: string
        pricing?: any
      }
    >
  > {
    const experiences = await this.searchExperiences(cityName, filters)

    // Check availability for each experience
    const enhancedExperiences = await Promise.all(
      experiences.map(async (experience) => {
        const availability = await this.checkAvailability(experience.productCode, date)

        return {
          ...experience,
          realTimeAvailability: availability.available,
          nextAvailableDate: availability.available ? date : undefined,
          pricing: availability.pricing,
        }
      }),
    )

    return enhancedExperiences
  }
}

export const enhancedViatorService = new EnhancedViatorService()
export type { ViatorProduct, EnhancedViatorExperience, SearchFilters }
