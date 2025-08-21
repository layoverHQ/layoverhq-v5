/**
 * Enhanced Layover Discovery Algorithm - ML-Based Scoring Engine
 *
 * Features:
 * - Weather-aware recommendations using OpenWeatherMap
 * - Transit time calculations with real-time data
 * - Personalization based on user preferences and history
 * - ML-based scoring for experience matching
 * - Real-time availability filtering
 * - Multi-factor optimization (weather, time, cost, user preferences)
 * - Predictive modeling for booking success
 */

import {
  configurableViatorService,
  type RevenueOptimizedExperience,
} from "./configurable-viator-service"
import { weatherService, type WeatherData } from "./weather-service"
import { transitCalculator, type TransitAnalysis } from "./transit-calculator"
import { commissionEngine } from "./commission-engine"
import { getConfigManager } from "./config-manager"
import { createClient } from "@/lib/supabase/server"

// ML and personalization interfaces
export interface UserProfile {
  id: string
  preferences: {
    activityTypes: string[] // ['cultural', 'outdoor', 'food', 'shopping', 'adventure']
    budgetRange: { min: number; max: number }
    physicalCapability: "low" | "moderate" | "high"
    riskTolerance: "conservative" | "moderate" | "adventurous"
    culturalInterest: number // 0-1
    languageComfort: string[] // Preferred languages
    groupSize: number
    mobilityRequirements?: string[]
  }
  history: {
    previousBookings: Array<{
      experienceId: string
      rating: number
      destination: string
      activityType: string
      price: number
      duration: number
      weather: string
      satisfaction: number // 0-1
    }>
    searchPatterns: {
      commonSearchTimes: number[] // Hours of day
      preferredDurations: number[] // Minutes
      seasonalPreferences: number[] // Month preferences (0-11)
    }
  }
  demographics: {
    ageGroup: "young_adult" | "adult" | "middle_aged" | "senior"
    travelExperience: "novice" | "experienced" | "expert"
    loyaltyTier: "bronze" | "silver" | "gold" | "platinum"
  }
}

export interface LayoverContext {
  flightInfo: {
    arrivalTime: string
    departureTime: string
    airportCode: string
    terminal?: string
    airline: string
    flightNumber: string
    isInternational: boolean
  }
  duration: number // minutes
  cityInfo: {
    name: string
    countryCode: string
    timezone: string
    safetyRating: number
    visaRequirement: "none" | "visa_free" | "visa_required" | "evisa"
  }
  transitInfo: {
    timeToCity: number // minutes
    transportOptions: Array<{
      type: "metro" | "bus" | "taxi" | "airport_express"
      duration: number
      cost: number
      reliability: number // 0-1
      frequency: number // per hour
    }>
    airportFacilities: {
      hasLuggageStorage: boolean
      hasShowers: boolean
      hasFastTrack: boolean
      loungeAccess: boolean
    }
  }
}

export interface MLScoringFactors {
  weatherCompatibility: number // 0-1
  personalizedPreference: number // 0-1
  timeOptimization: number // 0-1
  costEfficiency: number // 0-1
  safetyAssurance: number // 0-1
  culturalAlignment: number // 0-1
  physicalDemandMatch: number // 0-1
  seasonalRelevance: number // 0-1
  socialProofStrength: number // 0-1
  bookingProbability: number // 0-1
  revenueOptimization: number // 0-1
}

export interface EnhancedExperienceRecommendation extends RevenueOptimizedExperience {
  mlScore: number
  scoringFactors: MLScoringFactors
  personalizationInsights: {
    whyRecommended: string[]
    potentialConcerns: string[]
    optimizationTips: string[]
  }
  alternativeOptions: Array<{
    condition: string
    alternativeId: string
    reason: string
  }>
  realTimeFactors: {
    currentAvailability: number // 0-1
    demandLevel: "low" | "moderate" | "high"
    weatherTrend: "improving" | "stable" | "deteriorating"
    priceDirection: "increasing" | "stable" | "decreasing"
  }
}

export interface LayoverDiscoveryResult {
  layoverContext: LayoverContext
  recommendations: EnhancedExperienceRecommendation[]
  summary: {
    totalOptions: number
    averageScore: number
    bestMatchScore: number
    categoryDistribution: Record<string, number>
    priceRange: { min: number; max: number }
    timeUtilization: number // Percentage of layover time used
  }
  insights: {
    layoverQuality: "excellent" | "good" | "fair" | "limited"
    optimizationSuggestions: string[]
    weatherImpact: string
    budgetRecommendations: string[]
  }
  alternatives: {
    airportActivities: Array<{
      name: string
      location: string
      duration: number
      cost: number
      rating: number
    }>
    nearbyAttractions: Array<{
      name: string
      distance: string
      accessTime: number
      freeAccess: boolean
    }>
  }
}

class EnhancedLayoverDiscoveryEngine {
  private configManager = getConfigManager()
  private mlModelCache = new Map<string, { model: any; timestamp: number }>()
  private userProfileCache = new Map<string, { profile: UserProfile; timestamp: number }>()
  private readonly CACHE_TTL = 30 * 60 * 1000 // 30 minutes

  constructor() {
    this.initializeMLModels()
  }

  private async initializeMLModels(): Promise<void> {
    // Initialize ML models for scoring (in production, this would load trained models)
    console.log("Initializing ML models for layover discovery...")

    // Mock model initialization - in production, load actual ML models
    this.mlModelCache.set("preference_scoring", {
      model: this.createMockPreferenceModel(),
      timestamp: Date.now(),
    })

    this.mlModelCache.set("booking_prediction", {
      model: this.createMockBookingPredictionModel(),
      timestamp: Date.now(),
    })

    this.mlModelCache.set("experience_ranking", {
      model: this.createMockRankingModel(),
      timestamp: Date.now(),
    })
  }

  /**
   * Discover optimal layover experiences using ML-powered recommendations
   */
  async discoverLayoverExperiences(
    layoverContext: LayoverContext,
    userProfile: UserProfile,
    preferences?: {
      prioritizeRevenue?: boolean
      includeRiskyOptions?: boolean
      maxBudget?: number
      preferredCategories?: string[]
    },
  ): Promise<LayoverDiscoveryResult> {
    try {
      // Get weather data for the layover period
      const weather = await weatherService.getWeatherForLayover(
        layoverContext.cityInfo.name,
        new Date(layoverContext.flightInfo.arrivalTime),
        layoverContext.duration,
      )

      // Get transit analysis
      const transitAnalysis = await transitCalculator.analyzeLayover(
        layoverContext.flightInfo.airportCode,
        layoverContext.duration,
        layoverContext.flightInfo.arrivalTime,
      )

      // Get base experience recommendations
      const baseExperiences = await configurableViatorService.searchRevenueOptimizedExperiences(
        layoverContext.cityInfo.name,
        layoverContext.duration,
        layoverContext.flightInfo.airportCode,
        layoverContext.flightInfo.arrivalTime,
        weather,
        userProfile.demographics.loyaltyTier,
        this.buildSearchFilters(userProfile, preferences),
      )

      // Apply ML-based scoring and personalization
      const enhancedRecommendations = await Promise.all(
        baseExperiences.map((experience) =>
          this.enhanceWithMLScoring(
            experience,
            userProfile,
            layoverContext,
            weather,
            transitAnalysis,
          ),
        ),
      )

      // Sort by ML score and apply final optimizations
      const optimizedRecommendations = await this.optimizeRecommendations(
        enhancedRecommendations,
        userProfile,
        preferences,
      )

      // Generate insights and alternatives
      const insights = this.generateLayoverInsights(
        layoverContext,
        optimizedRecommendations,
        weather,
        transitAnalysis,
      )

      const alternatives = await this.generateAlternatives(layoverContext, transitAnalysis)

      // Calculate summary metrics
      const summary = this.calculateSummaryMetrics(optimizedRecommendations, layoverContext)

      // Track discovery analytics
      await this.trackDiscoveryAnalytics(layoverContext, userProfile, optimizedRecommendations)

      return {
        layoverContext,
        recommendations: optimizedRecommendations,
        summary,
        insights,
        alternatives,
      }
    } catch (error) {
      console.error("Enhanced layover discovery failed:", error)
      return this.getFallbackDiscoveryResult(layoverContext, userProfile)
    }
  }

  /**
   * Enhance experience with ML-based scoring and personalization
   */
  private async enhanceWithMLScoring(
    experience: RevenueOptimizedExperience,
    userProfile: UserProfile,
    layoverContext: LayoverContext,
    weather: WeatherData,
    transitAnalysis: TransitAnalysis,
  ): Promise<EnhancedExperienceRecommendation> {
    // Calculate ML scoring factors
    const scoringFactors = await this.calculateMLScoringFactors(
      experience,
      userProfile,
      layoverContext,
      weather,
      transitAnalysis,
    )

    // Calculate overall ML score using weighted factors
    const mlScore = await this.calculateMLScore(scoringFactors, userProfile)

    // Generate personalization insights
    const personalizationInsights = this.generatePersonalizationInsights(
      experience,
      userProfile,
      scoringFactors,
    )

    // Find alternative options based on different scenarios
    const alternativeOptions = await this.findAlternativeOptions(
      experience,
      layoverContext,
      weather,
    )

    // Get real-time factors
    const realTimeFactors = await this.getRealTimeFactors(experience, layoverContext.cityInfo.name)

    return {
      ...experience,
      mlScore,
      scoringFactors,
      personalizationInsights,
      alternativeOptions,
      realTimeFactors,
    }
  }

  /**
   * Calculate ML scoring factors for personalization
   */
  private async calculateMLScoringFactors(
    experience: RevenueOptimizedExperience,
    userProfile: UserProfile,
    layoverContext: LayoverContext,
    weather: WeatherData,
    transitAnalysis: TransitAnalysis,
  ): Promise<MLScoringFactors> {
    // Weather compatibility (enhanced with ML)
    const weatherCompatibility = await this.calculateWeatherCompatibility(
      experience,
      weather,
      userProfile.preferences.riskTolerance,
    )

    // Personalized preference scoring based on user history
    const personalizedPreference = this.calculatePersonalizedPreference(experience, userProfile)

    // Time optimization scoring
    const timeOptimization = this.calculateTimeOptimization(
      experience,
      layoverContext,
      transitAnalysis,
    )

    // Cost efficiency relative to user's budget and spending patterns
    const costEfficiency = this.calculateCostEfficiency(experience, userProfile)

    // Safety assurance based on user risk tolerance and local conditions
    const safetyAssurance = this.calculateSafetyAssurance(experience, layoverContext, userProfile)

    // Cultural alignment with user interests
    const culturalAlignment = this.calculateCulturalAlignment(experience, userProfile)

    // Physical demand match with user capabilities
    const physicalDemandMatch = this.calculatePhysicalDemandMatch(experience, userProfile)

    // Seasonal relevance
    const seasonalRelevance = this.calculateSeasonalRelevance(
      experience,
      layoverContext,
      userProfile,
    )

    // Social proof strength (ratings, reviews, popularity)
    const socialProofStrength = this.calculateSocialProofStrength(experience)

    // ML-based booking probability prediction
    const bookingProbability = await this.predictBookingProbability(
      experience,
      userProfile,
      layoverContext,
    )

    // Revenue optimization (platform perspective)
    const revenueOptimization = experience.revenueScore

    return {
      weatherCompatibility,
      personalizedPreference,
      timeOptimization,
      costEfficiency,
      safetyAssurance,
      culturalAlignment,
      physicalDemandMatch,
      seasonalRelevance,
      socialProofStrength,
      bookingProbability,
      revenueOptimization,
    }
  }

  /**
   * Calculate overall ML score using trained model weights
   */
  private async calculateMLScore(
    factors: MLScoringFactors,
    userProfile: UserProfile,
  ): Promise<number> {
    // Get ML model for scoring (in production, this would be a trained model)
    const model = this.mlModelCache.get("experience_ranking")?.model

    if (!model) {
      // Fallback to weighted average if model not available
      return this.calculateFallbackScore(factors, userProfile)
    }

    // Simulate ML model prediction
    const weights = this.getPersonalizedWeights(userProfile)

    let score = 0
    score += factors.weatherCompatibility * weights.weather
    score += factors.personalizedPreference * weights.preference
    score += factors.timeOptimization * weights.time
    score += factors.costEfficiency * weights.cost
    score += factors.safetyAssurance * weights.safety
    score += factors.culturalAlignment * weights.culture
    score += factors.physicalDemandMatch * weights.physical
    score += factors.seasonalRelevance * weights.seasonal
    score += factors.socialProofStrength * weights.social
    score += factors.bookingProbability * weights.booking
    score += factors.revenueOptimization * weights.revenue

    return Math.max(0, Math.min(1, score))
  }

  /**
   * Generate personalization insights explaining recommendations
   */
  private generatePersonalizationInsights(
    experience: RevenueOptimizedExperience,
    userProfile: UserProfile,
    factors: MLScoringFactors,
  ): {
    whyRecommended: string[]
    potentialConcerns: string[]
    optimizationTips: string[]
  } {
    const whyRecommended: string[] = []
    const potentialConcerns: string[] = []
    const optimizationTips: string[] = []

    // Analyze why this is recommended
    if (factors.personalizedPreference > 0.8) {
      whyRecommended.push("Matches your previous activity preferences perfectly")
    }
    if (factors.weatherCompatibility > 0.8) {
      whyRecommended.push("Perfect weather conditions for this activity")
    }
    if (factors.timeOptimization > 0.8) {
      whyRecommended.push("Optimal timing for your layover duration")
    }
    if (factors.costEfficiency > 0.8) {
      whyRecommended.push("Excellent value within your typical budget range")
    }

    // Identify potential concerns
    if (factors.weatherCompatibility < 0.5) {
      potentialConcerns.push("Weather conditions may affect the experience")
    }
    if (factors.timeOptimization < 0.6) {
      potentialConcerns.push("Might be tight on time - consider booking early slots")
    }
    if (factors.physicalDemandMatch < 0.6) {
      potentialConcerns.push("Physical demands may be higher than your usual preferences")
    }
    if (factors.safetyAssurance < 0.7) {
      potentialConcerns.push("Consider additional safety precautions for this activity")
    }

    // Provide optimization tips
    if (experience.layoverSuitability.score < 0.7) {
      optimizationTips.push("Book the earliest available time slot for maximum flexibility")
    }
    if (factors.costEfficiency < 0.6) {
      optimizationTips.push("Look for group discounts or package deals")
    }
    if (factors.weatherCompatibility < 0.7) {
      optimizationTips.push("Have a backup indoor activity ready")
    }

    return {
      whyRecommended,
      potentialConcerns,
      optimizationTips,
    }
  }

  /**
   * Find alternative options for different scenarios
   */
  private async findAlternativeOptions(
    experience: RevenueOptimizedExperience,
    layoverContext: LayoverContext,
    weather: WeatherData,
  ): Promise<
    Array<{
      condition: string
      alternativeId: string
      reason: string
    }>
  > {
    const alternatives: Array<{
      condition: string
      alternativeId: string
      reason: string
    }> = []

    // Weather-based alternatives
    if (!weather.isGoodForOutdoor && experience.activityType === "outdoor") {
      alternatives.push({
        condition: "if_weather_deteriorates",
        alternativeId: "indoor_museum_tour",
        reason: "Backup indoor option for poor weather",
      })
    }

    // Time-based alternatives
    if (experience.layoverSuitability.score < 0.7) {
      alternatives.push({
        condition: "if_running_late",
        alternativeId: "express_city_highlights",
        reason: "Shorter version focusing on key highlights",
      })
    }

    // Budget alternatives
    if (experience.dynamicPrice > experience.originalPrice * 1.2) {
      alternatives.push({
        condition: "if_price_too_high",
        alternativeId: "free_walking_tour",
        reason: "Budget-friendly alternative with similar cultural experience",
      })
    }

    return alternatives
  }

  /**
   * Get real-time factors affecting the experience
   */
  private async getRealTimeFactors(
    experience: RevenueOptimizedExperience,
    cityName: string,
  ): Promise<{
    currentAvailability: number
    demandLevel: "low" | "moderate" | "high"
    weatherTrend: "improving" | "stable" | "deteriorating"
    priceDirection: "increasing" | "stable" | "decreasing"
  }> {
    try {
      const supabase = await createClient()

      // Get real-time availability data
      const { data: availability } = await supabase
        .from("experience_availability")
        .select("available_slots, total_slots, demand_level")
        .eq("experience_id", experience.productCode)
        .single()

      const currentAvailability = availability
        ? availability.available_slots / availability.total_slots
        : 0.8 // Default assumption

      const demandLevel = availability?.demand_level || "moderate"

      // Get weather trend (simplified)
      const weatherTrend: "improving" | "stable" | "deteriorating" = "stable"

      // Get price direction (simplified)
      const priceDirection: "increasing" | "stable" | "decreasing" =
        experience.dynamicPrice > experience.originalPrice ? "increasing" : "stable"

      return {
        currentAvailability,
        demandLevel,
        weatherTrend,
        priceDirection,
      }
    } catch (error) {
      console.error("Failed to get real-time factors:", error)
      return {
        currentAvailability: 0.8,
        demandLevel: "moderate",
        weatherTrend: "stable",
        priceDirection: "stable",
      }
    }
  }

  /**
   * Optimize final recommendations based on multiple criteria
   */
  private async optimizeRecommendations(
    recommendations: EnhancedExperienceRecommendation[],
    userProfile: UserProfile,
    preferences?: any,
  ): Promise<EnhancedExperienceRecommendation[]> {
    // Sort by ML score primarily
    let optimized = recommendations.sort((a, b) => b.mlScore - a.mlScore)

    // Apply diversity to avoid too many similar recommendations
    optimized = this.applyDiversityFiltering(optimized, userProfile)

    // Apply budget filtering if specified
    if (preferences?.maxBudget) {
      optimized = optimized.filter((rec) => rec.dynamicPrice <= preferences.maxBudget)
    }

    // Apply category filtering if specified
    if (preferences?.preferredCategories?.length > 0) {
      optimized = optimized.filter((rec) =>
        rec.categories.some((cat) =>
          preferences.preferredCategories.includes(cat.name.toLowerCase()),
        ),
      )
    }

    // Limit to top recommendations
    return optimized.slice(0, 10)
  }

  /**
   * Apply diversity filtering to avoid repetitive recommendations
   */
  private applyDiversityFiltering(
    recommendations: EnhancedExperienceRecommendation[],
    userProfile: UserProfile,
  ): EnhancedExperienceRecommendation[] {
    const diversified: EnhancedExperienceRecommendation[] = []
    const categoryCount = new Map<string, number>()
    const priceRangeCount = new Map<string, number>()

    for (const rec of recommendations) {
      const primaryCategory = rec.categories[0]?.name || "general"
      const priceRange = this.getPriceRange(rec.dynamicPrice)

      // Limit category repetition (max 3 per category)
      const categoryFreq = categoryCount.get(primaryCategory) || 0
      const priceRangeFreq = priceRangeCount.get(priceRange) || 0

      if (categoryFreq < 3 && priceRangeFreq < 4) {
        diversified.push(rec)
        categoryCount.set(primaryCategory, categoryFreq + 1)
        priceRangeCount.set(priceRange, priceRangeFreq + 1)
      }

      if (diversified.length >= 10) break
    }

    return diversified
  }

  /**
   * Generate layover insights and optimization suggestions
   */
  private generateLayoverInsights(
    layoverContext: LayoverContext,
    recommendations: EnhancedExperienceRecommendation[],
    weather: WeatherData,
    transitAnalysis: TransitAnalysis,
  ): {
    layoverQuality: "excellent" | "good" | "fair" | "limited"
    optimizationSuggestions: string[]
    weatherImpact: string
    budgetRecommendations: string[]
  } {
    const optimizationSuggestions: string[] = []
    const budgetRecommendations: string[] = []

    // Assess layover quality
    let layoverQuality: "excellent" | "good" | "fair" | "limited" = "limited"

    if (layoverContext.duration >= 480 && transitAnalysis.canLeaveAirport) {
      layoverQuality = "excellent"
    } else if (layoverContext.duration >= 240 && transitAnalysis.canLeaveAirport) {
      layoverQuality = "good"
    } else if (layoverContext.duration >= 180) {
      layoverQuality = "fair"
    }

    // Generate optimization suggestions
    if (layoverContext.duration < 240) {
      optimizationSuggestions.push(
        "Focus on experiences close to the airport or within the airport",
      )
    }

    if (!weather.isGoodForOutdoor) {
      optimizationSuggestions.push("Prioritize indoor activities due to weather conditions")
    }

    if (transitAnalysis.transitOptions[0]?.duration > 60) {
      optimizationSuggestions.push("Consider airport hotel for rest instead of city exploration")
    }

    // Budget recommendations
    const avgPrice =
      recommendations.reduce((sum, rec) => sum + rec.dynamicPrice, 0) / recommendations.length

    if (avgPrice > 100) {
      budgetRecommendations.push("Look for free walking tours or self-guided options")
    }

    budgetRecommendations.push(`Budget $${Math.round(avgPrice)} for quality experiences`)

    // Weather impact assessment
    const weatherImpact = weather.isGoodForOutdoor
      ? "Perfect weather enhances outdoor experience options"
      : "Weather limitations favor indoor cultural and dining experiences"

    return {
      layoverQuality,
      optimizationSuggestions,
      weatherImpact,
      budgetRecommendations,
    }
  }

  /**
   * Generate airport and nearby alternatives
   */
  private async generateAlternatives(
    layoverContext: LayoverContext,
    transitAnalysis: TransitAnalysis,
  ): Promise<{
    airportActivities: Array<{
      name: string
      location: string
      duration: number
      cost: number
      rating: number
    }>
    nearbyAttractions: Array<{
      name: string
      distance: string
      accessTime: number
      freeAccess: boolean
    }>
  }> {
    // Mock data - in production, this would query airport facility APIs
    const airportActivities = [
      {
        name: "Airport Spa & Wellness Center",
        location: "Terminal 1, Level 2",
        duration: 60,
        cost: 80,
        rating: 4.2,
      },
      {
        name: "Premium Airport Lounge",
        location: "All Terminals",
        duration: 120,
        cost: 45,
        rating: 4.0,
      },
      {
        name: "Duty-Free Shopping",
        location: "All Terminals",
        duration: 90,
        cost: 0,
        rating: 3.8,
      },
    ]

    const nearbyAttractions = [
      {
        name: "Historic City Center",
        distance: "15 km",
        accessTime: 35,
        freeAccess: true,
      },
      {
        name: "Local Market District",
        distance: "8 km",
        accessTime: 25,
        freeAccess: true,
      },
      {
        name: "Waterfront Promenade",
        distance: "12 km",
        accessTime: 30,
        freeAccess: true,
      },
    ]

    return {
      airportActivities,
      nearbyAttractions,
    }
  }

  /**
   * Calculate summary metrics for the discovery result
   */
  private calculateSummaryMetrics(
    recommendations: EnhancedExperienceRecommendation[],
    layoverContext: LayoverContext,
  ): {
    totalOptions: number
    averageScore: number
    bestMatchScore: number
    categoryDistribution: Record<string, number>
    priceRange: { min: number; max: number }
    timeUtilization: number
  } {
    if (recommendations.length === 0) {
      return {
        totalOptions: 0,
        averageScore: 0,
        bestMatchScore: 0,
        categoryDistribution: {},
        priceRange: { min: 0, max: 0 },
        timeUtilization: 0,
      }
    }

    const totalOptions = recommendations.length
    const averageScore = recommendations.reduce((sum, rec) => sum + rec.mlScore, 0) / totalOptions
    const bestMatchScore = Math.max(...recommendations.map((rec) => rec.mlScore))

    // Category distribution
    const categoryDistribution: Record<string, number> = {}
    recommendations.forEach((rec) => {
      const category = rec.categories[0]?.name || "Other"
      categoryDistribution[category] = (categoryDistribution[category] || 0) + 1
    })

    // Price range
    const prices = recommendations.map((rec) => rec.dynamicPrice)
    const priceRange = {
      min: Math.min(...prices),
      max: Math.max(...prices),
    }

    // Time utilization (average experience duration vs layover duration)
    const avgDuration =
      recommendations.reduce((sum, rec) => {
        const duration = rec.duration.fixedDurationInMinutes || 120
        return sum + duration
      }, 0) / totalOptions

    const timeUtilization = (avgDuration / layoverContext.duration) * 100

    return {
      totalOptions,
      averageScore,
      bestMatchScore,
      categoryDistribution,
      priceRange,
      timeUtilization,
    }
  }

  // Helper methods for ML calculations
  private calculateWeatherCompatibility(
    experience: RevenueOptimizedExperience,
    weather: WeatherData,
    riskTolerance: string,
  ): number {
    let compatibility = experience.weatherScore

    // Adjust based on risk tolerance
    if (riskTolerance === "adventurous" && !weather.isGoodForOutdoor) {
      compatibility *= 0.9 // Less penalty for adventurous users
    } else if (riskTolerance === "conservative" && !weather.isGoodForOutdoor) {
      compatibility *= 0.7 // Higher penalty for conservative users
    }

    return Math.max(0, Math.min(1, compatibility))
  }

  private calculatePersonalizedPreference(
    experience: RevenueOptimizedExperience,
    userProfile: UserProfile,
  ): number {
    let score = 0.5 // Base score

    // Activity type preference
    const experienceCategory = experience.categories[0]?.name.toLowerCase() || ""
    if (userProfile.preferences.activityTypes.includes(experienceCategory)) {
      score += 0.3
    }

    // Historical preference based on previous bookings
    const similarBookings = userProfile.history.previousBookings.filter(
      (booking) => booking.activityType === experienceCategory,
    )

    if (similarBookings.length > 0) {
      const avgSatisfaction =
        similarBookings.reduce((sum, booking) => sum + booking.satisfaction, 0) /
        similarBookings.length
      score += avgSatisfaction * 0.2
    }

    // Price preference alignment
    const priceInRange =
      experience.dynamicPrice >= userProfile.preferences.budgetRange.min &&
      experience.dynamicPrice <= userProfile.preferences.budgetRange.max
    if (priceInRange) {
      score += 0.2
    }

    return Math.max(0, Math.min(1, score))
  }

  private calculateTimeOptimization(
    experience: RevenueOptimizedExperience,
    layoverContext: LayoverContext,
    transitAnalysis: TransitAnalysis,
  ): number {
    return experience.layoverSuitability.score
  }

  private calculateCostEfficiency(
    experience: RevenueOptimizedExperience,
    userProfile: UserProfile,
  ): number {
    const userBudgetMid =
      (userProfile.preferences.budgetRange.min + userProfile.preferences.budgetRange.max) / 2
    const priceRatio = experience.dynamicPrice / userBudgetMid

    if (priceRatio <= 0.8) return 1.0 // Great value
    if (priceRatio <= 1.0) return 0.8 // Good value
    if (priceRatio <= 1.2) return 0.6 // Fair value
    return 0.4 // Expensive
  }

  private calculateSafetyAssurance(
    experience: RevenueOptimizedExperience,
    layoverContext: LayoverContext,
    userProfile: UserProfile,
  ): number {
    let safetyScore = layoverContext.cityInfo.safetyRating / 5

    // Adjust based on experience type and user risk tolerance
    if (
      experience.physicalDemand === "high" &&
      userProfile.preferences.riskTolerance === "conservative"
    ) {
      safetyScore *= 0.8
    }

    return safetyScore
  }

  private calculateCulturalAlignment(
    experience: RevenueOptimizedExperience,
    userProfile: UserProfile,
  ): number {
    const hasCulturalElements = experience.categories.some((cat) =>
      ["cultural", "historical", "museum", "heritage"].includes(cat.name.toLowerCase()),
    )

    if (hasCulturalElements) {
      return userProfile.preferences.culturalInterest
    }

    return 0.5 // Neutral for non-cultural activities
  }

  private calculatePhysicalDemandMatch(
    experience: RevenueOptimizedExperience,
    userProfile: UserProfile,
  ): number {
    const demandMap = { low: 1, moderate: 2, high: 3 }
    const userCapability = demandMap[userProfile.preferences.physicalCapability]
    const experienceDemand = demandMap[experience.physicalDemand]

    if (experienceDemand <= userCapability) {
      return 1.0 // Perfect match or easier
    } else if (experienceDemand === userCapability + 1) {
      return 0.7 // Slight challenge
    } else {
      return 0.4 // Significant challenge
    }
  }

  private calculateSeasonalRelevance(
    experience: RevenueOptimizedExperience,
    layoverContext: LayoverContext,
    userProfile: UserProfile,
  ): number {
    const month = new Date(layoverContext.flightInfo.arrivalTime).getMonth()
    const userSeasonalPrefs = userProfile.history.searchPatterns.seasonalPreferences

    if (userSeasonalPrefs.includes(month)) {
      return 1.0
    }

    // Default seasonal relevance based on activity type
    if (experience.activityType === "outdoor") {
      // Summer and spring months are generally better for outdoor activities
      return [2, 3, 4, 5, 6, 7, 8, 9].includes(month) ? 0.8 : 0.6
    }

    return 0.7 // Indoor activities are generally season-neutral
  }

  private calculateSocialProofStrength(experience: RevenueOptimizedExperience): number {
    if (!experience.rating) return 0.5

    const ratingScore = experience.rating.average / 5
    const reviewCount = Math.min(experience.rating.count, 1000) / 1000 // Cap at 1000 for scoring

    return ratingScore * 0.7 + reviewCount * 0.3
  }

  private async predictBookingProbability(
    experience: RevenueOptimizedExperience,
    userProfile: UserProfile,
    layoverContext: LayoverContext,
  ): Promise<number> {
    // Use the existing booking probability from revenue optimization
    // In production, this would use a more sophisticated ML model
    return experience.bookingProbability
  }

  private getPersonalizedWeights(userProfile: UserProfile): Record<string, number> {
    const baseWeights = {
      weather: 0.15,
      preference: 0.2,
      time: 0.15,
      cost: 0.1,
      safety: 0.1,
      culture: 0.05,
      physical: 0.05,
      seasonal: 0.05,
      social: 0.05,
      booking: 0.05,
      revenue: 0.05,
    }

    // Adjust weights based on user profile
    if (userProfile.preferences.riskTolerance === "conservative") {
      baseWeights.safety += 0.05
      baseWeights.weather += 0.03
    }

    if (userProfile.preferences.culturalInterest > 0.7) {
      baseWeights.culture += 0.05
    }

    if (userProfile.demographics.travelExperience === "novice") {
      baseWeights.safety += 0.03
      baseWeights.social += 0.02 // More weight on popular activities
    }

    return baseWeights
  }

  private calculateFallbackScore(factors: MLScoringFactors, userProfile: UserProfile): number {
    const weights = this.getPersonalizedWeights(userProfile)

    return (
      factors.weatherCompatibility * weights.weather +
      factors.personalizedPreference * weights.preference +
      factors.timeOptimization * weights.time +
      factors.costEfficiency * weights.cost +
      factors.safetyAssurance * weights.safety +
      factors.culturalAlignment * weights.culture +
      factors.physicalDemandMatch * weights.physical +
      factors.seasonalRelevance * weights.seasonal +
      factors.socialProofStrength * weights.social +
      factors.bookingProbability * weights.booking +
      factors.revenueOptimization * weights.revenue
    )
  }

  private buildSearchFilters(userProfile: UserProfile, preferences?: any): any {
    return {
      maxPrice: preferences?.maxBudget || userProfile.preferences.budgetRange.max,
      categories: preferences?.preferredCategories || userProfile.preferences.activityTypes,
      physicalDemand: userProfile.preferences.physicalCapability,
      weatherAdaptive: userProfile.preferences.riskTolerance !== "adventurous",
    }
  }

  private getPriceRange(price: number): string {
    if (price < 25) return "budget"
    if (price < 75) return "moderate"
    if (price < 150) return "premium"
    return "luxury"
  }

  private async trackDiscoveryAnalytics(
    layoverContext: LayoverContext,
    userProfile: UserProfile,
    recommendations: EnhancedExperienceRecommendation[],
  ): Promise<void> {
    try {
      const supabase = await createClient()

      await supabase.from("layover_discovery_analytics").insert({
        user_id: userProfile.id,
        layover_duration: layoverContext.duration,
        destination: layoverContext.cityInfo.name,
        airport_code: layoverContext.flightInfo.airportCode,
        recommendations_count: recommendations.length,
        average_ml_score:
          recommendations.reduce((sum, r) => sum + r.mlScore, 0) / recommendations.length,
        user_tier: userProfile.demographics.loyaltyTier,
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Failed to track discovery analytics:", error)
    }
  }

  private async getFallbackDiscoveryResult(
    layoverContext: LayoverContext,
    userProfile: UserProfile,
  ): Promise<LayoverDiscoveryResult> {
    // Minimal fallback result in case of errors
    return {
      layoverContext,
      recommendations: [],
      summary: {
        totalOptions: 0,
        averageScore: 0,
        bestMatchScore: 0,
        categoryDistribution: {},
        priceRange: { min: 0, max: 0 },
        timeUtilization: 0,
      },
      insights: {
        layoverQuality: "limited",
        optimizationSuggestions: ["Stay at the airport for this layover"],
        weatherImpact: "Weather data unavailable",
        budgetRecommendations: ["Consider airport amenities"],
      },
      alternatives: {
        airportActivities: [],
        nearbyAttractions: [],
      },
    }
  }

  // Mock ML model creators (in production, these would be actual trained models)
  private createMockPreferenceModel(): any {
    return {
      predict: (features: any) => Math.random() * 0.3 + 0.7, // Mock high preference score
    }
  }

  private createMockBookingPredictionModel(): any {
    return {
      predict: (features: any) => Math.random() * 0.4 + 0.3, // Mock booking probability
    }
  }

  private createMockRankingModel(): any {
    return {
      predict: (features: any) => Math.random() * 0.3 + 0.6, // Mock ranking score
    }
  }
}

export const enhancedLayoverDiscoveryEngine = new EnhancedLayoverDiscoveryEngine()
