/**
 * Configurable Viator Service - Phase 2 Revenue Engine
 *
 * Provides admin-configurable scoring algorithms for:
 * - Weather scoring with configurable weights
 * - Experience recommendation scoring
 * - Dynamic availability checking with real-time pricing
 * - Commission tracking and revenue optimization
 */

import {
  enhancedViatorService,
  type ViatorProduct,
  type EnhancedViatorExperience,
  type SearchFilters,
} from "./enhanced-viator-service"
import { weatherService, type WeatherData } from "./weather-service"
import { transitCalculator, type TransitAnalysis } from "./transit-calculator"
import { getConfigManager } from "./config-manager"
import { createClient } from "@/lib/supabase/server"

// Configuration interfaces for admin-configurable parameters
export interface WeatherScoringConfig {
  temperatureWeight: number // 0-1, default 0.3
  precipitationWeight: number // 0-1, default 0.4
  windWeight: number // 0-1, default 0.2
  visibilityWeight: number // 0-1, default 0.1
  temperatureOptimalRange: [number, number] // [min, max] in Celsius
  precipitationThreshold: number // mm/h above which outdoor activities are penalized
  windSpeedThreshold: number // km/h above which outdoor activities are penalized
}

export interface ExperienceScoringConfig {
  weatherMatchWeight: number // 0-1, default 0.25
  transitFeasibilityWeight: number // 0-1, default 0.3
  layoverSuitabilityWeight: number // 0-1, default 0.25
  priceValueWeight: number // 0-1, default 0.1
  ratingWeight: number // 0-1, default 0.1
}

export interface CommissionConfig {
  baseCommissionRate: number // 0.15-0.20 (15-20%), default 0.17
  tierRates: {
    bronze: number // 0.15-0.18
    silver: number // 0.17-0.20
    gold: number // 0.19-0.22
    platinum: number // 0.21-0.25
  }
  dynamicPricingEnabled: boolean
  demandMultiplierMax: number // Maximum multiplier for high-demand periods
  timeUntilDepartureBonus: number // Bonus for last-minute bookings
}

export interface PricingStrategy {
  baseMarkup: number // Default markup percentage
  demandBasedPricing: boolean
  weatherBasedDiscount: boolean
  layoverDurationPricing: boolean
  partnerVolumeDiscount: boolean
}

// Enhanced experience with revenue tracking
export interface RevenueOptimizedExperience extends EnhancedViatorExperience {
  commissionRate: number
  estimatedCommission: number
  dynamicPrice: number
  originalPrice: number
  pricingStrategy: string[]
  revenueScore: number
  bookingProbability: number
}

// Booking analytics interface
export interface BookingAnalytics {
  experienceId: string
  basePrice: number
  finalPrice: number
  commissionEarned: number
  commissionRate: number
  conversionFactors: {
    weather: number
    timeToBooking: number
    layoverDuration: number
    userPreferences: number
  }
  timestamp: Date
}

class ConfigurableViatorService {
  private configManager = getConfigManager()
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  constructor() {
    // Initialize with default configurations
    this.initializeDefaultConfigurations()
  }

  private async initializeDefaultConfigurations(): Promise<void> {
    const defaultConfigs = {
      "viator.weather_scoring.temperature_weight": 0.3,
      "viator.weather_scoring.precipitation_weight": 0.4,
      "viator.weather_scoring.wind_weight": 0.2,
      "viator.weather_scoring.visibility_weight": 0.1,
      "viator.weather_scoring.temperature_optimal_min": 15,
      "viator.weather_scoring.temperature_optimal_max": 28,
      "viator.weather_scoring.precipitation_threshold": 2.0,
      "viator.weather_scoring.wind_speed_threshold": 25,

      "viator.experience_scoring.weather_match_weight": 0.25,
      "viator.experience_scoring.transit_feasibility_weight": 0.3,
      "viator.experience_scoring.layover_suitability_weight": 0.25,
      "viator.experience_scoring.price_value_weight": 0.1,
      "viator.experience_scoring.rating_weight": 0.1,

      "viator.commission.base_rate": 0.17,
      "viator.commission.bronze_rate": 0.15,
      "viator.commission.silver_rate": 0.17,
      "viator.commission.gold_rate": 0.19,
      "viator.commission.platinum_rate": 0.21,
      "viator.commission.dynamic_pricing_enabled": true,
      "viator.commission.demand_multiplier_max": 1.5,
      "viator.commission.time_departure_bonus": 0.05,

      "viator.pricing.base_markup": 0.15,
      "viator.pricing.demand_based_enabled": true,
      "viator.pricing.weather_discount_enabled": true,
      "viator.pricing.layover_duration_pricing": true,
      "viator.pricing.partner_volume_discount": true,

      "viator.cache.experience_ttl": 1800, // 30 minutes
      "viator.cache.pricing_ttl": 300, // 5 minutes
      "viator.cache.availability_ttl": 60, // 1 minute
    }

    // Set default configurations if they don't exist
    for (const [key, value] of Object.entries(defaultConfigs)) {
      const existing = await this.configManager.get(key)
      if (existing === undefined) {
        await this.configManager.set(key, value, "system")
      }
    }
  }

  /**
   * Search for revenue-optimized experiences with configurable scoring
   */
  async searchRevenueOptimizedExperiences(
    cityName: string,
    layoverDuration: number,
    airportCode: string,
    arrivalTime: string,
    weather: WeatherData,
    userTier: "bronze" | "silver" | "gold" | "platinum" = "bronze",
    filters?: SearchFilters,
  ): Promise<RevenueOptimizedExperience[]> {
    try {
      // Get admin-configured scoring parameters
      const weatherConfig = await this.getWeatherScoringConfig()
      const experienceConfig = await this.getExperienceScoringConfig()
      const commissionConfig = await this.getCommissionConfig()
      const pricingConfig = await this.getPricingStrategy()

      // Get enhanced experiences from base service
      const enhancedExperiences = await enhancedViatorService.searchWeatherAwareExperiences(
        cityName,
        layoverDuration,
        airportCode,
        arrivalTime,
        weather,
        filters,
      )

      // Apply revenue optimization to each experience
      const revenueOptimizedExperiences = await Promise.all(
        enhancedExperiences.map((experience) =>
          this.optimizeExperienceForRevenue(
            experience,
            weather,
            layoverDuration,
            userTier,
            weatherConfig,
            experienceConfig,
            commissionConfig,
            pricingConfig,
          ),
        ),
      )

      // Sort by revenue score (combination of user value and platform revenue)
      return revenueOptimizedExperiences.sort((a, b) => b.revenueScore - a.revenueScore)
    } catch (error) {
      console.error("ConfigurableViatorService: Revenue optimization failed:", error)
      // Fallback to basic enhanced experiences
      return this.fallbackToBasicExperiences(
        cityName,
        layoverDuration,
        airportCode,
        arrivalTime,
        weather,
        filters,
      )
    }
  }

  /**
   * Optimize individual experience for revenue with configurable parameters
   */
  private async optimizeExperienceForRevenue(
    experience: EnhancedViatorExperience,
    weather: WeatherData,
    layoverDuration: number,
    userTier: "bronze" | "silver" | "gold" | "platinum",
    weatherConfig: WeatherScoringConfig,
    experienceConfig: ExperienceScoringConfig,
    commissionConfig: CommissionConfig,
    pricingConfig: PricingStrategy,
  ): Promise<RevenueOptimizedExperience> {
    // Calculate enhanced weather score using configurable weights
    const enhancedWeatherScore = this.calculateConfigurableWeatherScore(
      experience,
      weather,
      weatherConfig,
    )

    // Calculate commission rate based on user tier
    const commissionRate =
      commissionConfig.tierRates[userTier] || commissionConfig.baseCommissionRate

    // Calculate dynamic pricing
    const pricingResult = await this.calculateDynamicPricing(
      experience,
      weather,
      layoverDuration,
      commissionConfig,
      pricingConfig,
    )

    // Calculate booking probability based on multiple factors
    const bookingProbability = this.calculateBookingProbability(
      experience,
      weather,
      layoverDuration,
      pricingResult.finalPrice,
      experience.price.fromPrice,
    )

    // Calculate overall revenue score
    const revenueScore = this.calculateRevenueScore(
      experience,
      enhancedWeatherScore,
      commissionRate,
      pricingResult.estimatedCommission,
      bookingProbability,
      experienceConfig,
    )

    return {
      ...experience,
      weatherScore: enhancedWeatherScore,
      commissionRate,
      estimatedCommission: pricingResult.estimatedCommission,
      dynamicPrice: pricingResult.finalPrice,
      originalPrice: experience.price.fromPrice,
      pricingStrategy: pricingResult.appliedStrategies,
      revenueScore,
      bookingProbability,
    }
  }

  /**
   * Calculate weather score using configurable weights
   */
  private calculateConfigurableWeatherScore(
    experience: ViatorProduct,
    weather: WeatherData,
    config: WeatherScoringConfig,
  ): number {
    let score = 1.0

    // Temperature scoring with configurable optimal range
    const [minTemp, maxTemp] = config.temperatureOptimalRange
    let tempScore = 1.0
    if (weather.temperature < minTemp) {
      tempScore = Math.max(0, 1 - (minTemp - weather.temperature) / 10)
    } else if (weather.temperature > maxTemp) {
      tempScore = Math.max(0, 1 - (weather.temperature - maxTemp) / 10)
    }
    score *= 1 - config.temperatureWeight + config.temperatureWeight * tempScore

    // Precipitation scoring with configurable threshold
    if (weather.precipitation > config.precipitationThreshold) {
      const precipitationImpact = Math.min(1, weather.precipitation / 10)
      const precipitationScore =
        experience.activityType === "indoor" ? 1.2 : 1 - precipitationImpact
      score *= 1 - config.precipitationWeight + config.precipitationWeight * precipitationScore
    }

    // Wind scoring with configurable threshold
    if (weather.windSpeed > config.windSpeedThreshold) {
      const windImpact = Math.min(1, weather.windSpeed / 50)
      const windScore = experience.activityType === "outdoor" ? 1 - windImpact : 1
      score *= 1 - config.windWeight + config.windWeight * windScore
    }

    // Visibility impact (configurable weight)
    const visibilityScore = Math.min(1, weather.visibility / 10)
    score *= 1 - config.visibilityWeight + config.visibilityWeight * visibilityScore

    return Math.max(0, Math.min(1, score))
  }

  /**
   * Calculate dynamic pricing based on multiple factors
   */
  private async calculateDynamicPricing(
    experience: ViatorProduct,
    weather: WeatherData,
    layoverDuration: number,
    commissionConfig: CommissionConfig,
    pricingConfig: PricingStrategy,
  ): Promise<{
    finalPrice: number
    estimatedCommission: number
    appliedStrategies: string[]
  }> {
    const basePrice = experience.price.fromPrice
    let finalPrice = basePrice * (1 + pricingConfig.baseMarkup)
    const appliedStrategies: string[] = ["base_markup"]

    // Demand-based pricing (simulated based on time and weather)
    if (pricingConfig.demandBasedPricing && commissionConfig.dynamicPricingEnabled) {
      const demandFactor = this.calculateDemandFactor(weather, layoverDuration)
      if (demandFactor > 1) {
        finalPrice *= Math.min(demandFactor, commissionConfig.demandMultiplierMax)
        appliedStrategies.push("high_demand_surge")
      }
    }

    // Weather-based discounts
    if (
      pricingConfig.weatherBasedDiscount &&
      !weather.isGoodForOutdoor &&
      experience.activityType === "outdoor"
    ) {
      finalPrice *= 0.85 // 15% discount for outdoor activities in bad weather
      appliedStrategies.push("weather_discount")
    }

    // Layover duration pricing
    if (pricingConfig.layoverDurationPricing) {
      if (layoverDuration < 240) {
        // Less than 4 hours
        finalPrice *= 1.1 // Premium for rush experiences
        appliedStrategies.push("rush_premium")
      } else if (layoverDuration > 480) {
        // More than 8 hours
        finalPrice *= 0.95 // Slight discount for long layovers
        appliedStrategies.push("extended_layover_discount")
      }
    }

    // Time until departure bonus (last-minute bookings)
    const timeUntilBonus = commissionConfig.timeUntilDepartureBonus
    if (layoverDuration < 180) {
      // Less than 3 hours
      finalPrice *= 1 + timeUntilBonus
      appliedStrategies.push("last_minute_bonus")
    }

    const estimatedCommission = finalPrice * commissionConfig.baseCommissionRate

    return {
      finalPrice: Math.round(finalPrice * 100) / 100, // Round to 2 decimal places
      estimatedCommission: Math.round(estimatedCommission * 100) / 100,
      appliedStrategies,
    }
  }

  /**
   * Calculate demand factor based on weather and timing
   */
  private calculateDemandFactor(weather: WeatherData, layoverDuration: number): number {
    let demandFactor = 1.0

    // Good weather increases demand for outdoor activities
    if (weather.isGoodForOutdoor) {
      demandFactor += 0.2
    }

    // Peak layover times (4-8 hours) have higher demand
    if (layoverDuration >= 240 && layoverDuration <= 480) {
      demandFactor += 0.15
    }

    // Weekend effect (simulated)
    const isWeekend = new Date().getDay() >= 5
    if (isWeekend) {
      demandFactor += 0.1
    }

    return demandFactor
  }

  /**
   * Calculate booking probability based on multiple factors
   */
  private calculateBookingProbability(
    experience: ViatorProduct,
    weather: WeatherData,
    layoverDuration: number,
    finalPrice: number,
    originalPrice: number,
  ): number {
    let probability = 0.5 // Base 50% probability

    // Weather compatibility
    if (weather.isGoodForOutdoor && experience.activityType === "outdoor") {
      probability += 0.2
    } else if (!weather.isGoodForOutdoor && experience.activityType === "indoor") {
      probability += 0.15
    }

    // Price attractiveness (lower prices increase booking probability)
    const priceRatio = finalPrice / originalPrice
    if (priceRatio < 1.1) {
      probability += 0.1
    } else if (priceRatio > 1.3) {
      probability -= 0.15
    }

    // Duration fit (experiences that fit well within layover time)
    const experienceDuration = experience.duration.fixedDurationInMinutes || 120
    const fitRatio = experienceDuration / layoverDuration
    if (fitRatio >= 0.3 && fitRatio <= 0.6) {
      // Sweet spot
      probability += 0.15
    } else if (fitRatio > 0.8) {
      probability -= 0.2
    }

    // Rating influence
    if (experience.rating && experience.rating.average >= 4.0) {
      probability += 0.1
    }

    return Math.max(0.1, Math.min(0.9, probability))
  }

  /**
   * Calculate overall revenue score
   */
  private calculateRevenueScore(
    experience: ViatorProduct,
    weatherScore: number,
    commissionRate: number,
    estimatedCommission: number,
    bookingProbability: number,
    config: ExperienceScoringConfig,
  ): number {
    // Expected revenue = estimated commission * booking probability
    const expectedRevenue = estimatedCommission * bookingProbability

    // Normalize expected revenue (assuming max commission of $50)
    const revenueScore = Math.min(1, expectedRevenue / 50)

    // User experience score (weighted combination)
    const userExperienceScore =
      weatherScore * config.weatherMatchWeight +
      ((experience.rating?.average || 3) / 5) * config.ratingWeight +
      0.8 * config.layoverSuitabilityWeight // Assuming good layover fit

    // Combined score (70% user experience, 30% revenue optimization)
    return userExperienceScore * 0.7 + revenueScore * 0.3
  }

  /**
   * Track booking analytics for revenue optimization
   */
  /**
   * Check availability for a specific experience
   */
  async checkAvailability(
    experienceId: string,
    date: string,
    travelerCount: number,
  ): Promise<{ available: boolean; price?: number; bookingUrl?: string }> {
    try {
      // Use the enhanced Viator service to check availability
      const availability = await enhancedViatorService.checkAvailability(
        experienceId,
        date,
        travelerCount,
      )

      // Apply dynamic pricing if available
      if (availability.available && availability.pricing) {
        const dynamicPrice = await this.calculateDynamicPricing(
          { price: availability.pricing } as ViatorProduct,
          await weatherService.getCurrentWeather(0, 0), // Would need actual location
          240, // Default layover duration for pricing calculation
          await this.getCommissionConfig(),
          {
            id: "default",
            name: "Default Pricing",
            baseCommission: 0.15,
            surgeMultiplier: 1.0,
          } as any,
        )

        return {
          available: true,
          price: dynamicPrice.finalPrice,
        }
      }

      return availability
    } catch (error) {
      console.error("Error checking availability:", error)
      return { available: false }
    }
  }

  async trackBookingAnalytics(
    experienceId: string,
    basePrice: number,
    finalPrice: number,
    commissionEarned: number,
    commissionRate: number,
    conversionFactors: BookingAnalytics["conversionFactors"],
  ): Promise<void> {
    try {
      const supabase = await createClient()

      await supabase.from("viator_booking_analytics").insert({
        experience_id: experienceId,
        base_price: basePrice,
        final_price: finalPrice,
        commission_earned: commissionEarned,
        commission_rate: commissionRate,
        conversion_factors: conversionFactors,
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Failed to track booking analytics:", error)
    }
  }

  /**
   * Get revenue analytics for dashboard
   */
  async getRevenueAnalytics(
    startDate: Date,
    endDate: Date,
    filters?: {
      cityName?: string
      experienceType?: string
      userTier?: string
    },
  ): Promise<{
    totalRevenue: number
    totalCommissions: number
    averageCommissionRate: number
    totalBookings: number
    conversionRate: number
    topPerformingExperiences: any[]
    revenueByDay: Array<{ date: string; revenue: number; bookings: number }>
  }> {
    try {
      const supabase = await createClient()

      const query = supabase
        .from("viator_booking_analytics")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())

      if (filters?.cityName) {
        // Add city name filter when available in analytics
      }

      const { data: analytics, error } = await query

      if (error) throw error

      // Calculate analytics
      const totalRevenue = analytics?.reduce((sum, record) => sum + record.final_price, 0) || 0
      const totalCommissions =
        analytics?.reduce((sum, record) => sum + record.commission_earned, 0) || 0
      const totalBookings = analytics?.length || 0
      const averageCommissionRate =
        totalBookings > 0
          ? analytics!.reduce((sum, record) => sum + record.commission_rate, 0) / totalBookings
          : 0

      // Group by experience for top performers
      const experienceGroups = new Map<string, { revenue: number; bookings: number }>()
      analytics?.forEach((record) => {
        const existing = experienceGroups.get(record.experience_id) || { revenue: 0, bookings: 0 }
        experienceGroups.set(record.experience_id, {
          revenue: existing.revenue + record.commission_earned,
          bookings: existing.bookings + 1,
        })
      })

      const topPerformingExperiences = Array.from(experienceGroups.entries())
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 10)
        .map(([id, stats]) => ({ experienceId: id, ...stats }))

      // Revenue by day
      const dailyRevenue = new Map<string, { revenue: number; bookings: number }>()
      analytics?.forEach((record) => {
        const date = new Date(record.created_at).toISOString().split("T")[0]
        const existing = dailyRevenue.get(date) || { revenue: 0, bookings: 0 }
        dailyRevenue.set(date, {
          revenue: existing.revenue + record.commission_earned,
          bookings: existing.bookings + 1,
        })
      })

      const revenueByDay = Array.from(dailyRevenue.entries())
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => a.date.localeCompare(b.date))

      return {
        totalRevenue,
        totalCommissions,
        averageCommissionRate,
        totalBookings,
        conversionRate: 0.15, // This would come from tracking views vs bookings
        topPerformingExperiences,
        revenueByDay,
      }
    } catch (error) {
      console.error("Failed to get revenue analytics:", error)
      return {
        totalRevenue: 0,
        totalCommissions: 0,
        averageCommissionRate: 0,
        totalBookings: 0,
        conversionRate: 0,
        topPerformingExperiences: [],
        revenueByDay: [],
      }
    }
  }

  // Configuration getters with caching
  private async getWeatherScoringConfig(): Promise<WeatherScoringConfig> {
    return {
      temperatureWeight: await this.configManager.get(
        "viator.weather_scoring.temperature_weight",
        undefined,
        0.3,
      ),
      precipitationWeight: await this.configManager.get(
        "viator.weather_scoring.precipitation_weight",
        undefined,
        0.4,
      ),
      windWeight: await this.configManager.get(
        "viator.weather_scoring.wind_weight",
        undefined,
        0.2,
      ),
      visibilityWeight: await this.configManager.get(
        "viator.weather_scoring.visibility_weight",
        undefined,
        0.1,
      ),
      temperatureOptimalRange: [
        await this.configManager.get(
          "viator.weather_scoring.temperature_optimal_min",
          undefined,
          15,
        ),
        await this.configManager.get(
          "viator.weather_scoring.temperature_optimal_max",
          undefined,
          28,
        ),
      ],
      precipitationThreshold: await this.configManager.get(
        "viator.weather_scoring.precipitation_threshold",
        undefined,
        2.0,
      ),
      windSpeedThreshold: await this.configManager.get(
        "viator.weather_scoring.wind_speed_threshold",
        undefined,
        25,
      ),
    }
  }

  private async getExperienceScoringConfig(): Promise<ExperienceScoringConfig> {
    return {
      weatherMatchWeight: await this.configManager.get(
        "viator.experience_scoring.weather_match_weight",
        undefined,
        0.25,
      ),
      transitFeasibilityWeight: await this.configManager.get(
        "viator.experience_scoring.transit_feasibility_weight",
        undefined,
        0.3,
      ),
      layoverSuitabilityWeight: await this.configManager.get(
        "viator.experience_scoring.layover_suitability_weight",
        undefined,
        0.25,
      ),
      priceValueWeight: await this.configManager.get(
        "viator.experience_scoring.price_value_weight",
        undefined,
        0.1,
      ),
      ratingWeight: await this.configManager.get(
        "viator.experience_scoring.rating_weight",
        undefined,
        0.1,
      ),
    }
  }

  private async getCommissionConfig(): Promise<CommissionConfig> {
    return {
      baseCommissionRate: await this.configManager.get(
        "viator.commission.base_rate",
        undefined,
        0.17,
      ),
      tierRates: {
        bronze: await this.configManager.get("viator.commission.bronze_rate", undefined, 0.15),
        silver: await this.configManager.get("viator.commission.silver_rate", undefined, 0.17),
        gold: await this.configManager.get("viator.commission.gold_rate", undefined, 0.19),
        platinum: await this.configManager.get("viator.commission.platinum_rate", undefined, 0.21),
      },
      dynamicPricingEnabled: await this.configManager.get(
        "viator.commission.dynamic_pricing_enabled",
        undefined,
        true,
      ),
      demandMultiplierMax: await this.configManager.get(
        "viator.commission.demand_multiplier_max",
        undefined,
        1.5,
      ),
      timeUntilDepartureBonus: await this.configManager.get(
        "viator.commission.time_departure_bonus",
        undefined,
        0.05,
      ),
    }
  }

  private async getPricingStrategy(): Promise<PricingStrategy> {
    return {
      baseMarkup: await this.configManager.get("viator.pricing.base_markup", undefined, 0.15),
      demandBasedPricing: await this.configManager.get(
        "viator.pricing.demand_based_enabled",
        undefined,
        true,
      ),
      weatherBasedDiscount: await this.configManager.get(
        "viator.pricing.weather_discount_enabled",
        undefined,
        true,
      ),
      layoverDurationPricing: await this.configManager.get(
        "viator.pricing.layover_duration_pricing",
        undefined,
        true,
      ),
      partnerVolumeDiscount: await this.configManager.get(
        "viator.pricing.partner_volume_discount",
        undefined,
        true,
      ),
    }
  }

  /**
   * Fallback to basic experiences if revenue optimization fails
   */
  private async fallbackToBasicExperiences(
    cityName: string,
    layoverDuration: number,
    airportCode: string,
    arrivalTime: string,
    weather: WeatherData,
    filters?: SearchFilters,
  ): Promise<RevenueOptimizedExperience[]> {
    const basicExperiences = await enhancedViatorService.searchWeatherAwareExperiences(
      cityName,
      layoverDuration,
      airportCode,
      arrivalTime,
      weather,
      filters,
    )

    // Convert to revenue-optimized format with default values
    return basicExperiences.map((experience) => ({
      ...experience,
      commissionRate: 0.17,
      estimatedCommission: experience.price.fromPrice * 0.17,
      dynamicPrice: experience.price.fromPrice,
      originalPrice: experience.price.fromPrice,
      pricingStrategy: ["base_pricing"],
      revenueScore: experience.layoverSuitability.score * 0.7 + 0.3,
      bookingProbability: 0.5,
    }))
  }

  /**
   * Cache management with configurable TTL
   */
  private async getCachedOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    cacheType: "experience" | "pricing" | "availability" = "experience",
  ): Promise<T> {
    const cached = this.cache.get(key)
    const ttlKey = `viator.cache.${cacheType}_ttl`
    const defaultTtl = cacheType === "experience" ? 1800 : cacheType === "pricing" ? 300 : 60
    const ttl = (await this.configManager.get(ttlKey, undefined, defaultTtl)) * 1000 // Convert to ms

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data
    }

    const data = await fetcher()
    this.cache.set(key, { data, timestamp: Date.now(), ttl })
    return data
  }
}

export const configurableViatorService = new ConfigurableViatorService()
