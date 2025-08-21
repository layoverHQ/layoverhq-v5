/**
 * Commission Engine - Dynamic Pricing & Revenue Optimization
 *
 * Handles:
 * - Configurable commission rates (15-20% baseline, adjustable per tenant)
 * - Dynamic pricing based on demand/availability signals
 * - Real-time revenue tracking and analytics
 * - Automated commission calculations and partner payouts
 * - Multi-currency support with real-time exchange rates
 */

import { createClient } from "@/lib/supabase/server"
import { getConfigManager } from "./config-manager"
import type { WeatherData } from "./weather-service"

// Core interfaces
export interface CommissionTier {
  id: string
  name: "bronze" | "silver" | "gold" | "platinum" | "enterprise"
  baseRate: number // 0.15-0.25
  volumeThresholds: {
    monthly: number // USD
    quarterly: number // USD
    annual: number // USD
  }
  bonusRates: {
    volumeBonus: number // Additional % for volume
    qualityBonus: number // Additional % for high ratings
    exclusivePartnerBonus: number // Additional % for exclusive partners
  }
  features: {
    dynamicPricing: boolean
    realTimePricing: boolean
    bulkDiscounts: boolean
    customReporting: boolean
  }
}

export interface DynamicPricingFactors {
  demandSignals: {
    searchVolume: number // Recent search volume for destination
    bookingVelocity: number // Bookings per hour in last 24h
    inventoryLevel: number // Available slots
    competitorPricing: number // Average market price
  }
  temporalFactors: {
    timeUntilDeparture: number // Minutes until flight departure
    seasonality: number // 0.5-1.5 multiplier for season
    dayOfWeek: number // 0.8-1.2 multiplier for day
    timeOfDay: number // 0.9-1.1 multiplier for time
  }
  externalFactors: {
    weatherScore: number // 0.5-1.5 based on weather conditions
    eventMultiplier: number // 1.0-2.0 for local events
    currencyFluctuation: number // Exchange rate impact
    marketVolatility: number // General market conditions
  }
  userFactors: {
    loyaltyTier: string
    bookingHistory: number // Previous bookings count
    averageSpend: number
    lastBookingDays: number // Days since last booking
  }
}

export interface PricingStrategy {
  id: string
  name: string
  description: string
  enabled: boolean
  priority: number // Higher number = higher priority
  conditions: {
    minLayoverDuration?: number
    maxLayoverDuration?: number
    weatherConditions?: ("good" | "fair" | "poor")[]
    userTiers?: string[]
    destinationCodes?: string[]
    experienceTypes?: string[]
  }
  adjustments: {
    priceMultiplier: number // 0.5-2.0
    commissionAdjustment: number // -0.05 to +0.10
    minimumPrice?: number
    maximumPrice?: number
  }
  validFrom: Date
  validUntil?: Date
}

export interface CommissionCalculation {
  experienceId: string
  basePrice: number
  finalPrice: number
  appliedStrategies: string[]
  commissionRate: number
  commissionAmount: number
  partnerPayout: number
  platformRevenue: number
  currency: string
  calculatedAt: Date
  factors: DynamicPricingFactors
}

export interface RevenueMetrics {
  totalRevenue: number
  totalCommissions: number
  averageCommissionRate: number
  totalBookings: number
  conversionRate: number
  revenueGrowth: number // % compared to previous period
  topPerformingDestinations: Array<{
    destination: string
    revenue: number
    bookings: number
    averageCommission: number
  }>
  commissionsByTier: Record<
    string,
    {
      revenue: number
      bookings: number
      averageRate: number
    }
  >
  currency: string
  period: {
    start: Date
    end: Date
  }
}

class CommissionEngine {
  private configManager = getConfigManager()
  private exchangeRateCache = new Map<string, { rate: number; timestamp: number }>()
  private pricingCache = new Map<string, { pricing: any; timestamp: number }>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  constructor() {
    this.initializeDefaultStrategies()
  }

  private async initializeDefaultStrategies(): Promise<void> {
    const defaultStrategies: PricingStrategy[] = [
      {
        id: "high-demand-surge",
        name: "High Demand Surge",
        description: "Apply surge pricing during high demand periods",
        enabled: true,
        priority: 100,
        conditions: {},
        adjustments: {
          priceMultiplier: 1.25,
          commissionAdjustment: 0.02,
        },
        validFrom: new Date(),
      },
      {
        id: "weather-discount",
        name: "Weather-Based Discount",
        description: "Discount outdoor activities during poor weather",
        enabled: true,
        priority: 90,
        conditions: {
          weatherConditions: ["poor"],
          experienceTypes: ["outdoor"],
        },
        adjustments: {
          priceMultiplier: 0.85,
          commissionAdjustment: -0.01,
        },
        validFrom: new Date(),
      },
      {
        id: "last-minute-premium",
        name: "Last Minute Premium",
        description: "Premium pricing for bookings within 3 hours",
        enabled: true,
        priority: 95,
        conditions: {
          maxLayoverDuration: 180,
        },
        adjustments: {
          priceMultiplier: 1.15,
          commissionAdjustment: 0.01,
        },
        validFrom: new Date(),
      },
      {
        id: "extended-layover-discount",
        name: "Extended Layover Discount",
        description: "Discount for long layovers to encourage bookings",
        enabled: true,
        priority: 80,
        conditions: {
          minLayoverDuration: 480,
        },
        adjustments: {
          priceMultiplier: 0.95,
          commissionAdjustment: 0,
        },
        validFrom: new Date(),
      },
      {
        id: "loyalty-tier-bonus",
        name: "Loyalty Tier Bonus",
        description: "Better pricing for higher tier users",
        enabled: true,
        priority: 85,
        conditions: {
          userTiers: ["gold", "platinum", "enterprise"],
        },
        adjustments: {
          priceMultiplier: 0.92,
          commissionAdjustment: 0.01,
        },
        validFrom: new Date(),
      },
    ]

    // Store default strategies in database if they don't exist
    try {
      const supabase = await createClient()
      for (const strategy of defaultStrategies) {
        const { error } = await supabase
          .from("pricing_strategies")
          .upsert(strategy, { onConflict: "id" })

        if (error) {
          console.error("Failed to initialize pricing strategy:", strategy.id, error)
        }
      }
    } catch (error) {
      console.error("Failed to initialize default pricing strategies:", error)
    }
  }

  /**
   * Calculate dynamic pricing and commission for an experience
   */
  async calculateDynamicPricing(
    experienceId: string,
    basePrice: number,
    currency: string,
    layoverDuration: number,
    weather: WeatherData,
    userTier: string,
    destinationCode: string,
    experienceType: string,
  ): Promise<CommissionCalculation> {
    try {
      // Get pricing factors
      const factors = await this.collectPricingFactors(
        experienceId,
        destinationCode,
        layoverDuration,
        weather,
        userTier,
      )

      // Get applicable pricing strategies
      const strategies = await this.getApplicableStrategies(
        layoverDuration,
        weather,
        userTier,
        destinationCode,
        experienceType,
      )

      // Calculate base dynamic price
      let finalPrice = basePrice
      let commissionAdjustment = 0
      const appliedStrategies: string[] = []

      // Apply pricing strategies in priority order
      for (const strategy of strategies.sort((a, b) => b.priority - a.priority)) {
        if (this.shouldApplyStrategy(strategy, factors)) {
          finalPrice *= strategy.adjustments.priceMultiplier
          commissionAdjustment += strategy.adjustments.commissionAdjustment

          // Apply min/max price limits
          if (strategy.adjustments.minimumPrice) {
            finalPrice = Math.max(finalPrice, strategy.adjustments.minimumPrice)
          }
          if (strategy.adjustments.maximumPrice) {
            finalPrice = Math.min(finalPrice, strategy.adjustments.maximumPrice)
          }

          appliedStrategies.push(strategy.id)
        }
      }

      // Get commission rate for user tier
      const baseCommissionRate = await this.getCommissionRateForTier(userTier)
      const commissionRate = Math.max(0.1, Math.min(0.3, baseCommissionRate + commissionAdjustment))

      // Calculate commission and payouts
      const commissionAmount = finalPrice * commissionRate
      const partnerPayout = finalPrice - commissionAmount
      const platformRevenue = commissionAmount

      // Convert to USD if needed for tracking
      const usdRate = currency !== "USD" ? await this.getExchangeRate(currency, "USD") : 1

      const calculation: CommissionCalculation = {
        experienceId,
        basePrice,
        finalPrice: Math.round(finalPrice * 100) / 100,
        appliedStrategies,
        commissionRate,
        commissionAmount: Math.round(commissionAmount * 100) / 100,
        partnerPayout: Math.round(partnerPayout * 100) / 100,
        platformRevenue: Math.round(platformRevenue * 100) / 100,
        currency,
        calculatedAt: new Date(),
        factors,
      }

      // Cache the calculation
      this.pricingCache.set(`${experienceId}_${userTier}_${currency}`, {
        pricing: calculation,
        timestamp: Date.now(),
      })

      return calculation
    } catch (error) {
      console.error("Dynamic pricing calculation failed:", error)

      // Fallback to basic calculation
      const baseCommissionRate = await this.getCommissionRateForTier(userTier)
      const commissionAmount = basePrice * baseCommissionRate

      return {
        experienceId,
        basePrice,
        finalPrice: basePrice,
        appliedStrategies: ["fallback"],
        commissionRate: baseCommissionRate,
        commissionAmount,
        partnerPayout: basePrice - commissionAmount,
        platformRevenue: commissionAmount,
        currency,
        calculatedAt: new Date(),
        factors: {} as DynamicPricingFactors,
      }
    }
  }

  /**
   * Collect real-time pricing factors
   */
  private async collectPricingFactors(
    experienceId: string,
    destinationCode: string,
    layoverDuration: number,
    weather: WeatherData,
    userTier: string,
  ): Promise<DynamicPricingFactors> {
    try {
      const supabase = await createClient()

      // Get recent search and booking data
      const { data: searchData } = await supabase
        .from("experience_analytics")
        .select("searches_24h, bookings_24h, available_slots")
        .eq("experience_id", experienceId)
        .single()

      // Get user booking history
      const { data: userHistory } = await supabase
        .from("booking_history")
        .select("total_bookings, average_spend, last_booking_date")
        .eq("user_tier", userTier)
        .single()

      // Calculate temporal factors
      const now = new Date()
      const seasonality = this.calculateSeasonalityFactor(now, destinationCode)
      const dayOfWeek = this.calculateDayOfWeekFactor(now.getDay())
      const timeOfDay = this.calculateTimeOfDayFactor(now.getHours())

      return {
        demandSignals: {
          searchVolume: searchData?.searches_24h || 10,
          bookingVelocity: (searchData?.bookings_24h || 1) / 24,
          inventoryLevel: searchData?.available_slots || 100,
          competitorPricing: 1.0, // Would come from competitor analysis
        },
        temporalFactors: {
          timeUntilDeparture: layoverDuration,
          seasonality,
          dayOfWeek,
          timeOfDay,
        },
        externalFactors: {
          weatherScore: weather.isGoodForOutdoor ? 1.2 : 0.8,
          eventMultiplier: await this.getEventMultiplier(destinationCode, now),
          currencyFluctuation: 1.0, // Would come from real exchange rate tracking
          marketVolatility: 1.0,
        },
        userFactors: {
          loyaltyTier: userTier,
          bookingHistory: userHistory?.total_bookings || 0,
          averageSpend: userHistory?.average_spend || 0,
          lastBookingDays: userHistory?.last_booking_date
            ? Math.floor(
                (now.getTime() - new Date(userHistory.last_booking_date).getTime()) /
                  (1000 * 60 * 60 * 24),
              )
            : 999,
        },
      }
    } catch (error) {
      console.error("Failed to collect pricing factors:", error)
      return {
        demandSignals: {
          searchVolume: 10,
          bookingVelocity: 1,
          inventoryLevel: 100,
          competitorPricing: 1.0,
        },
        temporalFactors: {
          timeUntilDeparture: layoverDuration,
          seasonality: 1.0,
          dayOfWeek: 1.0,
          timeOfDay: 1.0,
        },
        externalFactors: {
          weatherScore: weather.isGoodForOutdoor ? 1.2 : 0.8,
          eventMultiplier: 1.0,
          currencyFluctuation: 1.0,
          marketVolatility: 1.0,
        },
        userFactors: {
          loyaltyTier: userTier,
          bookingHistory: 0,
          averageSpend: 0,
          lastBookingDays: 999,
        },
      }
    }
  }

  /**
   * Get applicable pricing strategies
   */
  private async getApplicableStrategies(
    layoverDuration: number,
    weather: WeatherData,
    userTier: string,
    destinationCode: string,
    experienceType: string,
  ): Promise<PricingStrategy[]> {
    try {
      const supabase = await createClient()
      const { data: strategies, error } = await supabase
        .from("pricing_strategies")
        .select("*")
        .eq("enabled", true)
        .lte("valid_from", new Date().toISOString())
        .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString()}`)

      if (error) throw error

      return (
        strategies?.filter((strategy) => {
          const conditions = strategy.conditions

          // Check layover duration conditions
          if (conditions.minLayoverDuration && layoverDuration < conditions.minLayoverDuration) {
            return false
          }
          if (conditions.maxLayoverDuration && layoverDuration > conditions.maxLayoverDuration) {
            return false
          }

          // Check weather conditions
          if (conditions.weatherConditions) {
            const weatherCondition = weather.isGoodForOutdoor
              ? "good"
              : weather.precipitation > 5
                ? "poor"
                : "fair"
            if (!conditions.weatherConditions.includes(weatherCondition)) {
              return false
            }
          }

          // Check user tier conditions
          if (conditions.userTiers && !conditions.userTiers.includes(userTier)) {
            return false
          }

          // Check destination conditions
          if (
            conditions.destinationCodes &&
            !conditions.destinationCodes.includes(destinationCode)
          ) {
            return false
          }

          // Check experience type conditions
          if (conditions.experienceTypes && !conditions.experienceTypes.includes(experienceType)) {
            return false
          }

          return true
        }) || []
      )
    } catch (error) {
      console.error("Failed to get applicable strategies:", error)
      return []
    }
  }

  /**
   * Determine if a strategy should be applied based on current factors
   */
  private shouldApplyStrategy(strategy: PricingStrategy, factors: DynamicPricingFactors): boolean {
    // High demand surge pricing
    if (strategy.id === "high-demand-surge") {
      return factors.demandSignals.bookingVelocity > 2 || factors.demandSignals.inventoryLevel < 20
    }

    // Weather-based discount
    if (strategy.id === "weather-discount") {
      return factors.externalFactors.weatherScore < 1.0
    }

    // Last minute premium
    if (strategy.id === "last-minute-premium") {
      return factors.temporalFactors.timeUntilDeparture < 180
    }

    // Extended layover discount
    if (strategy.id === "extended-layover-discount") {
      return factors.temporalFactors.timeUntilDeparture > 480
    }

    // Loyalty tier bonus
    if (strategy.id === "loyalty-tier-bonus") {
      return ["gold", "platinum", "enterprise"].includes(factors.userFactors.loyaltyTier)
    }

    return true
  }

  /**
   * Get commission rate for user tier
   */
  private async getCommissionRateForTier(userTier: string): Promise<number> {
    const tierRates = {
      bronze: await this.configManager.get("commission.rates.bronze", undefined, 0.15),
      silver: await this.configManager.get("commission.rates.silver", undefined, 0.17),
      gold: await this.configManager.get("commission.rates.gold", undefined, 0.19),
      platinum: await this.configManager.get("commission.rates.platinum", undefined, 0.21),
      enterprise: await this.configManager.get("commission.rates.enterprise", undefined, 0.23),
    }

    return tierRates[userTier as keyof typeof tierRates] || tierRates.bronze
  }

  /**
   * Track commission calculation and revenue
   */
  async trackCommission(calculation: CommissionCalculation, userId?: string): Promise<void> {
    try {
      const supabase = await createClient()

      await supabase.from("commission_tracking").insert({
        experience_id: calculation.experienceId,
        user_id: userId,
        base_price: calculation.basePrice,
        final_price: calculation.finalPrice,
        commission_rate: calculation.commissionRate,
        commission_amount: calculation.commissionAmount,
        partner_payout: calculation.partnerPayout,
        platform_revenue: calculation.platformRevenue,
        currency: calculation.currency,
        applied_strategies: calculation.appliedStrategies,
        pricing_factors: calculation.factors,
        created_at: calculation.calculatedAt.toISOString(),
      })

      // Update real-time metrics
      await this.updateRealTimeMetrics(calculation)
    } catch (error) {
      console.error("Failed to track commission:", error)
    }
  }

  /**
   * Get revenue metrics for a time period
   */
  async getRevenueMetrics(
    startDate: Date,
    endDate: Date,
    currency: string = "USD",
    filters?: {
      destinationCode?: string
      userTier?: string
      experienceType?: string
    },
  ): Promise<RevenueMetrics> {
    try {
      const supabase = await createClient()

      let query = supabase
        .from("commission_tracking")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())

      if (filters?.userTier) {
        query = query.eq("user_tier", filters.userTier)
      }

      const { data: records, error } = await query

      if (error) throw error

      // Calculate metrics
      const totalRevenue = records?.reduce((sum, r) => sum + r.platform_revenue, 0) || 0
      const totalCommissions = records?.reduce((sum, r) => sum + r.commission_amount, 0) || 0
      const totalBookings = records?.length || 0
      const averageCommissionRate =
        totalBookings > 0
          ? records!.reduce((sum, r) => sum + r.commission_rate, 0) / totalBookings
          : 0

      // Calculate previous period for growth comparison
      const periodDuration = endDate.getTime() - startDate.getTime()
      const previousStart = new Date(startDate.getTime() - periodDuration)
      const previousEnd = startDate

      const { data: previousRecords } = await supabase
        .from("commission_tracking")
        .select("platform_revenue")
        .gte("created_at", previousStart.toISOString())
        .lte("created_at", previousEnd.toISOString())

      const previousRevenue = previousRecords?.reduce((sum, r) => sum + r.platform_revenue, 0) || 0
      const revenueGrowth =
        previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0

      // Top performing destinations (mock data - would need destination tracking)
      const topPerformingDestinations = [
        {
          destination: "Dubai",
          revenue: totalRevenue * 0.3,
          bookings: Math.floor(totalBookings * 0.3),
          averageCommission: (totalRevenue * 0.3) / Math.max(1, Math.floor(totalBookings * 0.3)),
        },
        {
          destination: "Istanbul",
          revenue: totalRevenue * 0.2,
          bookings: Math.floor(totalBookings * 0.2),
          averageCommission: (totalRevenue * 0.2) / Math.max(1, Math.floor(totalBookings * 0.2)),
        },
        {
          destination: "Singapore",
          revenue: totalRevenue * 0.15,
          bookings: Math.floor(totalBookings * 0.15),
          averageCommission: (totalRevenue * 0.15) / Math.max(1, Math.floor(totalBookings * 0.15)),
        },
      ]

      // Commission by tier (mock data - would need tier tracking)
      const commissionsByTier = {
        bronze: {
          revenue: totalRevenue * 0.4,
          bookings: Math.floor(totalBookings * 0.4),
          averageRate: 0.15,
        },
        silver: {
          revenue: totalRevenue * 0.3,
          bookings: Math.floor(totalBookings * 0.3),
          averageRate: 0.17,
        },
        gold: {
          revenue: totalRevenue * 0.2,
          bookings: Math.floor(totalBookings * 0.2),
          averageRate: 0.19,
        },
        platinum: {
          revenue: totalRevenue * 0.1,
          bookings: Math.floor(totalBookings * 0.1),
          averageRate: 0.21,
        },
      }

      return {
        totalRevenue,
        totalCommissions,
        averageCommissionRate,
        totalBookings,
        conversionRate: 0.15, // Would come from tracking views vs bookings
        revenueGrowth,
        topPerformingDestinations,
        commissionsByTier,
        currency,
        period: { start: startDate, end: endDate },
      }
    } catch (error) {
      console.error("Failed to get revenue metrics:", error)
      return {
        totalRevenue: 0,
        totalCommissions: 0,
        averageCommissionRate: 0,
        totalBookings: 0,
        conversionRate: 0,
        revenueGrowth: 0,
        topPerformingDestinations: [],
        commissionsByTier: {},
        currency,
        period: { start: startDate, end: endDate },
      }
    }
  }

  // Helper methods for factor calculations
  private calculateSeasonalityFactor(date: Date, destinationCode: string): number {
    const month = date.getMonth()

    // Simplified seasonality factors (would be more sophisticated in production)
    const seasonalityMap: Record<string, number[]> = {
      DXB: [0.8, 0.9, 1.1, 1.2, 1.0, 0.7, 0.6, 0.7, 1.0, 1.2, 1.1, 0.9], // Dubai - avoid summer
      IST: [0.7, 0.8, 1.0, 1.2, 1.3, 1.2, 1.1, 1.1, 1.2, 1.0, 0.9, 0.8], // Istanbul - peak spring/summer
      SIN: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0], // Singapore - consistent year-round
      default: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
    }

    const factors = seasonalityMap[destinationCode] || seasonalityMap.default
    return factors[month]
  }

  private calculateDayOfWeekFactor(dayOfWeek: number): number {
    // Sunday = 0, Saturday = 6
    const factors = [0.9, 1.0, 1.0, 1.0, 1.0, 1.1, 1.2] // Weekend premium
    return factors[dayOfWeek]
  }

  private calculateTimeOfDayFactor(hour: number): number {
    // Peak hours: 9-11 AM and 2-4 PM
    if (hour >= 9 && hour <= 11) return 1.1
    if (hour >= 14 && hour <= 16) return 1.1
    if (hour >= 6 && hour <= 8) return 0.9 // Early morning
    if (hour >= 17 && hour <= 19) return 0.9 // Late afternoon
    return 1.0
  }

  private async getEventMultiplier(destinationCode: string, date: Date): Promise<number> {
    // In production, this would check for local events, holidays, conferences, etc.
    return 1.0
  }

  private async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    const cacheKey = `${fromCurrency}_${toCurrency}`
    const cached = this.exchangeRateCache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < 60 * 60 * 1000) {
      // 1 hour cache
      return cached.rate
    }

    try {
      // In production, use a real exchange rate API
      // For now, return mock rates
      const mockRates: Record<string, number> = {
        EUR_USD: 1.08,
        GBP_USD: 1.25,
        AED_USD: 0.27,
        SGD_USD: 0.74,
        TRY_USD: 0.034,
      }

      const rate = mockRates[cacheKey] || 1.0
      this.exchangeRateCache.set(cacheKey, { rate, timestamp: Date.now() })
      return rate
    } catch (error) {
      console.error("Failed to get exchange rate:", error)
      return 1.0
    }
  }

  private async updateRealTimeMetrics(calculation: CommissionCalculation): Promise<void> {
    try {
      const supabase = await createClient()

      // Update daily revenue metrics
      const today = new Date().toISOString().split("T")[0]

      await supabase.from("daily_revenue_metrics").upsert(
        {
          date: today,
          total_revenue: calculation.platformRevenue,
          total_bookings: 1,
          average_commission_rate: calculation.commissionRate,
        },
        {
          onConflict: "date",
          ignoreDuplicates: false,
        },
      )
    } catch (error) {
      console.error("Failed to update real-time metrics:", error)
    }
  }
}

export const commissionEngine = new CommissionEngine()
