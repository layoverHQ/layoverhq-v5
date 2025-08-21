import { getAmadeusClient } from "@/lib/amadeus/client"
import { getViatorClient } from "@/lib/viator/client"
import { getMockExperiences } from "@/lib/viator/mock-data"
import { getCityImage } from "@/lib/images/dynamic-image-service"

export interface LayoverRecommendation {
  id: string
  destination: {
    city: string
    country: string
    airportCode: string
    image: string
  }
  flight: {
    price: number
    currency: string
    departureDate: string
    returnDate?: string
    layoverDuration: string
    carrierCode: string
    flightNumber: string
  }
  experiences: Array<{
    title: string
    duration: string
    price: number
    rating: number
    image: string
  }>
  bundle: {
    totalPrice: number
    savings: number
    savingsPercentage: number
  }
  score: number // Recommendation score 0-100
  reasons: string[] // Why we recommend this
  urgency: "high" | "medium" | "low"
  weatherScore: number
  visaRequired: boolean
}

export interface UserPreferences {
  budget: "economy" | "premium" | "luxury"
  interests: string[]
  layoverDuration: {
    min: number // hours
    max: number // hours
  }
  preferredDestinations?: string[]
  avoidDestinations?: string[]
  nationality?: string
}

export class RecommendationEngine {
  private amadeusClient = getAmadeusClient()
  private viatorClient = getViatorClient()

  /**
   * Get personalized layover recommendations
   */
  async getPersonalizedRecommendations(params: {
    origin: string
    departureDate?: string
    returnDate?: string
    preferences: UserPreferences
    limit?: number
  }): Promise<LayoverRecommendation[]> {
    const recommendations: LayoverRecommendation[] = []

    try {
      // 1. Get flight inspiration from Amadeus
      const flightInspiration = await this.getFlightInspirationData(
        params.origin,
        params.preferences,
      )

      // 2. Get trending destinations
      const trendingDestinations = await this.getTrendingDestinations(params.origin)

      // 3. Combine and score destinations
      const destinations = this.combineAndScoreDestinations(
        flightInspiration,
        trendingDestinations,
        params.preferences,
      )

      // If no destinations found from APIs, use mock data
      if (destinations.length === 0) {
        console.log("No destinations from APIs, falling back to mock data")
        return this.getMockRecommendations(params.origin, params.preferences)
      }

      // 4. For each top destination, get experiences and create recommendations
      for (const dest of destinations.slice(0, params.limit || 6)) {
        const recommendation = await this.createRecommendation(
          params.origin,
          dest,
          params.preferences,
          params.departureDate,
        )
        if (recommendation) {
          recommendations.push(recommendation)
        }
      }

      // 5. Sort by score
      recommendations.sort((a, b) => b.score - a.score)

      // If no recommendations were created, fall back to mock data
      if (recommendations.length === 0) {
        console.log("No recommendations created, falling back to mock data")
        return this.getMockRecommendations(params.origin, params.preferences)
      }

      return recommendations
    } catch (error) {
      console.error("Error generating recommendations:", error)
      // Return mock recommendations as fallback
      return this.getMockRecommendations(params.origin, params.preferences)
    }
  }

  /**
   * Get flight inspiration data
   */
  private async getFlightInspirationData(origin: string, preferences: UserPreferences) {
    try {
      const maxPrice = this.getMaxPriceForBudget(preferences.budget)
      return await this.amadeusClient.getFlightInspiration({
        origin,
        maxPrice,
      })
    } catch (error) {
      console.warn("Failed to get flight inspiration:", error)
      return { data: [] }
    }
  }

  /**
   * Get trending destinations
   */
  private async getTrendingDestinations(origin: string) {
    try {
      return await this.amadeusClient.getTrendingDestinations({ origin })
    } catch (error) {
      console.warn("Failed to get trending destinations:", error)
      return { data: [] }
    }
  }

  /**
   * Combine and score destinations based on various factors
   */
  private combineAndScoreDestinations(
    flightData: any,
    trendingData: any,
    preferences: UserPreferences,
  ): any[] {
    const destinations = new Map()

    // Process flight inspiration data
    if (flightData.data) {
      flightData.data.forEach((flight: any) => {
        const key = flight.destination
        if (!destinations.has(key)) {
          destinations.set(key, {
            code: key,
            price: parseFloat(flight.price.total),
            score: 50, // Base score
            trending: false,
          })
        }
      })
    }

    // Boost score for trending destinations
    if (trendingData.data) {
      trendingData.data.forEach((trend: any) => {
        const key = trend.destination
        if (destinations.has(key)) {
          const dest = destinations.get(key)
          dest.score += 20 // Trending boost
          dest.trending = true
        }
      })
    }

    // Apply preference-based scoring
    destinations.forEach((dest, key) => {
      // Budget scoring
      if (preferences.budget === "economy" && dest.price < 500) {
        dest.score += 15
      } else if (preferences.budget === "premium" && dest.price >= 500 && dest.price < 1500) {
        dest.score += 15
      } else if (preferences.budget === "luxury" && dest.price >= 1500) {
        dest.score += 15
      }

      // Preferred destinations boost
      if (preferences.preferredDestinations?.includes(key)) {
        dest.score += 25
      }

      // Avoid destinations penalty
      if (preferences.avoidDestinations?.includes(key)) {
        dest.score -= 50
      }
    })

    return Array.from(destinations.values()).sort((a, b) => b.score - a.score)
  }

  /**
   * Create a complete recommendation for a destination
   */
  private async createRecommendation(
    origin: string,
    destination: any,
    preferences: UserPreferences,
    departureDate?: string,
  ): Promise<LayoverRecommendation | null> {
    try {
      // Get experiences for the destination
      const cityName = this.getCityNameFromCode(destination.code)
      const experiences = await this.getExperiencesForCity(
        cityName,
        preferences.layoverDuration.max,
      )

      // Use dynamic image service with Unsplash API
      let cityImage: string
      try {
        cityImage = await getCityImage(cityName, {
          width: 800,
          height: 600,
          quality: 80,
        })
      } catch (error) {
        console.warn(`Failed to get dynamic image for ${cityName}, using fallback`)
        cityImage = this.getDestinationImage(cityName)
      }

      // Calculate bundle pricing
      const experiencePrice = experiences.length > 0 ? experiences[0].price : 0
      const totalPrice = destination.price + experiencePrice
      const savings = totalPrice * 0.15 // 15% bundle discount
      const savingsPercentage = 15

      // Generate recommendation reasons
      const reasons = this.generateRecommendationReasons(destination, experiences, preferences)

      // Calculate urgency
      const urgency = this.calculateUrgency(destination.price, destination.trending)

      return {
        id: `rec_${Date.now()}_${destination.code}`,
        destination: {
          city: cityName,
          country: this.getCountryFromCode(destination.code),
          airportCode: destination.code,
          image: cityImage,
        },
        flight: {
          price: destination.price,
          currency: "USD",
          departureDate: departureDate || this.getDefaultDepartureDate(),
          layoverDuration: "8 hours",
          carrierCode: "QR", // Default to Qatar Airways
          flightNumber: "QR123",
        },
        experiences: experiences.slice(0, 3).map((exp) => ({
          title: exp.title,
          duration: exp.duration,
          price: exp.price.amount,
          rating: exp.rating || 4.5,
          image: exp.images[0]?.url || "/placeholder.jpg",
        })),
        bundle: {
          totalPrice,
          savings,
          savingsPercentage,
        },
        score: destination.score,
        reasons,
        urgency,
        weatherScore: this.getWeatherScore(cityName),
        visaRequired: this.checkVisaRequirement(destination.code),
      }
    } catch (error) {
      console.error(`Failed to create recommendation for ${destination.code}:`, error)
      return null
    }
  }

  /**
   * Get experiences for a city
   */
  private async getExperiencesForCity(city: string, maxHours: number) {
    try {
      // Try Viator API first
      const experiences = await this.viatorClient.searchLayoverExperiences({
        city,
        maxDurationHours: maxHours,
      })
      if (experiences.length > 0) {
        return experiences
      }
    } catch (error) {
      console.warn(`Failed to get Viator experiences for ${city}:`, error)
    }

    // Fallback to mock data
    return getMockExperiences(city, maxHours)
  }

  /**
   * Generate recommendation reasons
   */
  private generateRecommendationReasons(
    destination: any,
    experiences: any[],
    preferences: UserPreferences,
  ): string[] {
    const reasons = []

    if (destination.trending) {
      reasons.push("Trending destination this season")
    }

    if (destination.price < 500) {
      reasons.push("Great value flight deal")
    }

    if (experiences.length > 5) {
      reasons.push("Many layover activities available")
    }

    if (
      preferences.interests.includes("culture") &&
      experiences.some((e) => e.title.includes("Museum") || e.title.includes("Tour"))
    ) {
      reasons.push("Perfect for cultural exploration")
    }

    if (
      preferences.interests.includes("food") &&
      experiences.some((e) => e.title.includes("Food") || e.title.includes("Cuisine"))
    ) {
      reasons.push("Amazing food experiences")
    }

    if (!this.checkVisaRequirement(destination.code)) {
      reasons.push("No visa required for layover")
    }

    return reasons
  }

  /**
   * Calculate urgency level
   */
  private calculateUrgency(price: number, trending: boolean): "high" | "medium" | "low" {
    if (price < 400 || trending) {
      return "high"
    }
    if (price < 800) {
      return "medium"
    }
    return "low"
  }

  /**
   * Get mock recommendations as fallback
   */
  private getMockRecommendations(
    origin: string,
    preferences: UserPreferences,
  ): LayoverRecommendation[] {
    const mockDestinations = [
      { city: "Dubai", code: "DXB", country: "UAE", price: 650 },
      { city: "Istanbul", code: "IST", country: "Turkey", price: 550 },
      { city: "Singapore", code: "SIN", country: "Singapore", price: 750 },
      { city: "Doha", code: "DOH", country: "Qatar", price: 600 },
      { city: "Amsterdam", code: "AMS", country: "Netherlands", price: 480 },
      { city: "Reykjavik", code: "KEF", country: "Iceland", price: 420 },
    ]

    return mockDestinations.map((dest, index) => {
      const experiences = getMockExperiences(dest.city, preferences.layoverDuration.max)
      const experiencePrice = experiences[0]?.price?.amount || 50
      const totalPrice = dest.price + experiencePrice

      return {
        id: `mock_${index}`,
        destination: {
          city: dest.city,
          country: dest.country,
          airportCode: dest.code,
          image: this.getDestinationImage(dest.city),
        },
        flight: {
          price: dest.price,
          currency: "USD",
          departureDate: this.getDefaultDepartureDate(),
          layoverDuration: "8 hours",
          carrierCode: "QR",
          flightNumber: `QR${100 + index}`,
        },
        experiences: experiences.slice(0, 3).map((exp) => ({
          title: exp.title,
          duration: exp.duration,
          price: exp.price.amount,
          rating: exp.rating || 4.5,
          image: exp.images[0]?.url || "/placeholder.jpg",
        })),
        bundle: {
          totalPrice,
          savings: totalPrice * 0.15,
          savingsPercentage: 15,
        },
        score: 80 - index * 5,
        reasons: [
          "Popular layover destination",
          "Great experiences available",
          index % 2 === 0 ? "Trending this month" : "Limited time offer",
        ],
        urgency: index === 0 ? "high" : index < 3 ? "medium" : "low",
        weatherScore: 85 - index * 5,
        visaRequired: dest.city === "Dubai" || dest.city === "Doha",
      }
    })
  }

  // Utility functions
  private getMaxPriceForBudget(budget: string): number {
    switch (budget) {
      case "economy":
        return 800
      case "premium":
        return 2000
      case "luxury":
        return 10000
      default:
        return 1500
    }
  }

  private getCityNameFromCode(code: string): string {
    const cityMap: Record<string, string> = {
      DXB: "Dubai",
      IST: "Istanbul",
      SIN: "Singapore",
      DOH: "Doha",
      AMS: "Amsterdam",
      KEF: "Reykjavik",
      CDG: "Paris",
      LHR: "London",
      JFK: "New York",
      NRT: "Tokyo",
      SYD: "Sydney",
    }
    return cityMap[code] || code
  }

  private getCountryFromCode(code: string): string {
    const countryMap: Record<string, string> = {
      DXB: "United Arab Emirates",
      IST: "Turkey",
      SIN: "Singapore",
      DOH: "Qatar",
      AMS: "Netherlands",
      KEF: "Iceland",
      CDG: "France",
      LHR: "United Kingdom",
      JFK: "United States",
      NRT: "Japan",
      SYD: "Australia",
    }
    return countryMap[code] || "Unknown"
  }

  private getDestinationImage(city: string): string {
    // Using Unsplash for dynamic, high-quality destination images
    // These are optimized queries for each destination
    const imageMap: Record<string, string> = {
      Dubai: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80", // Dubai skyline
      Istanbul: "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800&q=80", // Blue Mosque
      Singapore: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80", // Gardens by the Bay
      Doha: "https://images.unsplash.com/photo-1572252821143-035a024857ac?w=800&q=80", // Doha skyline
      Amsterdam: "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=800&q=80", // Amsterdam canals
      Reykjavik: "https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=800&q=80", // Hallgrímskirkja
      Paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80", // Eiffel Tower
      London: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80", // Tower Bridge
      "New York": "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80", // NYC skyline
      Tokyo: "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800&q=80", // Tokyo temple
      Sydney: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&q=80", // Sydney Opera House
    }
    return (
      imageMap[city] || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80"
    ) // Generic travel image
  }

  private getDefaultDepartureDate(): string {
    const date = new Date()
    date.setDate(date.getDate() + 30) // 30 days from now
    return date.toISOString().split("T")[0]
  }

  private getWeatherScore(city: string): number {
    // Mock weather scores - in production, integrate with weather API
    const scores: Record<string, number> = {
      Dubai: 85,
      Istanbul: 80,
      Singapore: 75,
      Doha: 82,
      Amsterdam: 70,
      Reykjavik: 65,
    }
    return scores[city] || 75
  }

  private checkVisaRequirement(code: string): boolean {
    // Simplified visa check - in production, use nationality-based API
    const visaFree = ["IST", "AMS", "KEF", "SIN"]
    return !visaFree.includes(code)
  }
}

// Singleton instance
let recommendationEngine: RecommendationEngine | null = null

export function getRecommendationEngine(): RecommendationEngine {
  if (!recommendationEngine) {
    recommendationEngine = new RecommendationEngine()
  }
  return recommendationEngine
}
