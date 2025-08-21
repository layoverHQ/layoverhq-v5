/**
 * Rewards & Incentives System
 * Comprehensive reward management with dynamic incentives and personalized offers
 */

import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { EventBus } from "@/lib/event-system"
import { CacheManager } from "../cache-manager"
import { AdvancedGamificationSystem } from "./advanced-gamification-system"
import { SecretVaultManager } from "./secret-vault-manager"

export type RewardType =
  | "points"
  | "discount"
  | "free_experience"
  | "upgrade"
  | "exclusive_access"
  | "badge"
  | "title"
  | "perk"
export type IncentiveType =
  | "first_booking"
  | "streak_bonus"
  | "referral"
  | "social_share"
  | "review"
  | "comeback"
  | "seasonal"
export type RewardStatus = "earned" | "pending" | "redeemed" | "expired" | "revoked"

export interface Reward {
  id: string
  userId: string
  type: RewardType
  name: string
  description: string
  value: number | string
  category: string
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond"

  // Reward details
  conditions?: {
    minimumSpend?: number
    validCities?: string[]
    validCategories?: string[]
    validPartners?: string[]
    maxUsage?: number
    stackable?: boolean
  }

  // Timing
  earnedAt: Date
  expiresAt?: Date
  redeemedAt?: Date

  // Status
  status: RewardStatus
  usageCount: number
  transferable: boolean

  // Source
  sourceType: "achievement" | "incentive" | "promotion" | "referral" | "admin"
  sourceId: string

  // Metadata
  metadata?: Record<string, any>
}

export interface Incentive {
  id: string
  name: string
  description: string
  type: IncentiveType
  isActive: boolean
  priority: number

  // Targeting
  targetAudience: {
    userSegments?: string[]
    minBookings?: number
    maxBookings?: number
    cities?: string[]
    registrationDateRange?: { start: Date; end: Date }
    lastActivityDays?: number
    excludeUserIds?: string[]
  }

  // Trigger conditions
  triggerConditions: {
    eventType: string
    requirements: Record<string, any>
    cooldownHours?: number
    maxTriggers?: number
  }

  // Reward configuration
  rewards: {
    type: RewardType
    value: number | string
    tier: string
    conditions?: any
    expiryDays?: number
  }[]

  // Schedule
  startsAt: Date
  endsAt: Date

  // Performance
  stats: {
    triggered: number
    redeemed: number
    conversionRate: number
    totalValue: number
  }
}

export interface PersonalizedOffer {
  id: string
  userId: string
  title: string
  description: string

  // Offer details
  discountPercentage?: number
  fixedDiscount?: number
  freeUpgrade?: string
  exclusiveAccess?: string[]

  // Targeting data
  personalizedFor: {
    preferredCities: string[]
    travelPatterns: any
    spendingBehavior: any
    interests: string[]
  }

  // Validity
  validFrom: Date
  validUntil: Date
  maxRedemptions: number
  currentRedemptions: number

  // Status
  isActive: boolean
  isPriority: boolean
  category: string

  // Performance
  viewCount: number
  clickCount: number
  redeemCount: number
}

export interface RewardPortfolio {
  userId: string
  totalPointsEarned: number
  currentPoints: number
  pointsRedeemed: number

  // Rewards by category
  rewards: {
    active: Reward[]
    pending: Reward[]
    expired: Reward[]
    redeemed: Reward[]
  }

  // Achievements
  tier: string
  badges: string[]
  titles: string[]

  // Statistics
  stats: {
    totalRewardsEarned: number
    totalValueRedeemed: number
    favoriteRewardType: RewardType
    streakDays: number
    referralsCount: number
  }

  // Personalized offers
  activeOffers: PersonalizedOffer[]
  recommendedRewards: Reward[]
}

export interface LoyaltyTier {
  name: string
  level: number
  pointsRequired: number
  color: string
  benefits: {
    pointsMultiplier: number
    exclusiveOffers: boolean
    prioritySupport: boolean
    freeUpgrades: number
    earlyAccess: boolean
    conciergeService: boolean
    customRewards: boolean
  }
  rewards: {
    welcome: Reward[]
    monthly: Reward[]
    annual: Reward[]
  }
}

export class RewardsIncentivesSystem {
  private supabase: any
  private eventSystem: EventBus
  private cacheManager: CacheManager
  private gamificationSystem: AdvancedGamificationSystem
  private vaultManager: SecretVaultManager

  constructor() {
    this.supabase = null
    this.eventSystem = new EventBus()
    this.cacheManager = new CacheManager()
    this.gamificationSystem = new AdvancedGamificationSystem()
    this.vaultManager = new SecretVaultManager()
  }

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
    return this.supabase
  }

  /**
   * Get user's complete reward portfolio
   */
  async getUserRewardPortfolio(userId: string): Promise<RewardPortfolio> {
    try {
      const supabase = await this.getSupabase()

      // Get all user rewards
      const { data: rewards } = await supabase
        .from("user_rewards")
        .select("*")
        .eq("user_id", userId)
        .order("earned_at", { ascending: false })

      // Categorize rewards by status
      const rewardsByStatus = {
        active:
          rewards?.filter(
            (r) => r.status === "earned" && (!r.expires_at || new Date(r.expires_at) > new Date()),
          ) || [],
        pending: rewards?.filter((r) => r.status === "pending") || [],
        expired:
          rewards?.filter(
            (r) => r.status === "expired" || (r.expires_at && new Date(r.expires_at) <= new Date()),
          ) || [],
        redeemed: rewards?.filter((r) => r.status === "redeemed") || [],
      }

      // Calculate points
      const pointRewards = rewards?.filter((r) => r.type === "points") || []
      const totalPointsEarned = pointRewards.reduce(
        (sum, r) => sum + (typeof r.value === "number" ? r.value : 0),
        0,
      )
      const pointsRedeemed = pointRewards
        .filter((r) => r.status === "redeemed")
        .reduce((sum, r) => sum + (typeof r.value === "number" ? r.value : 0), 0)
      const currentPoints = totalPointsEarned - pointsRedeemed

      // Get user stats
      const userStats = await this.gamificationSystem.getUserStats(userId)

      // Get personalized offers
      const activeOffers = await this.getPersonalizedOffers(userId)

      // Get recommended rewards based on user behavior
      const recommendedRewards = await this.generateRecommendedRewards(userId)

      // Calculate statistics
      const totalRewardsEarned = rewards?.length || 0
      const totalValueRedeemed = rewardsByStatus.redeemed.reduce((sum, r) => {
        if (typeof r.value === "number") return sum + r.value
        return sum
      }, 0)

      const rewardTypeCounts: Record<RewardType, number> = {
        points: 0,
        discount: 0,
        free_experience: 0,
        upgrade: 0,
        exclusive_access: 0,
        badge: 0,
        title: 0,
        perk: 0,
      }

      rewards?.forEach((r) => {
        if (rewardTypeCounts.hasOwnProperty(r.type)) {
          rewardTypeCounts[r.type]++
        }
      })

      const favoriteRewardType =
        (Object.entries(rewardTypeCounts).sort(([, a], [, b]) => b - a)[0]?.[0] as RewardType) ||
        "points"

      const portfolio: RewardPortfolio = {
        userId,
        totalPointsEarned,
        currentPoints,
        pointsRedeemed,
        rewards: rewardsByStatus,
        tier: this.calculateLoyaltyTier(currentPoints, totalRewardsEarned),
        badges: userStats.badges,
        titles: userStats.title ? [userStats.title] : [],
        stats: {
          totalRewardsEarned,
          totalValueRedeemed,
          favoriteRewardType,
          streakDays: userStats.currentStreak,
          referralsCount: 0, // Would integrate with referral system
        },
        activeOffers,
        recommendedRewards,
      }

      logger.info("User reward portfolio retrieved", {
        userId,
        totalRewards: totalRewardsEarned,
        currentPoints,
        tier: portfolio.tier,
      })

      return portfolio
    } catch (error) {
      logger.error("Failed to get user reward portfolio", { userId, error })
      throw new Error("Failed to retrieve reward portfolio")
    }
  }

  /**
   * Award reward to user
   */
  async awardReward(
    userId: string,
    rewardConfig: {
      type: RewardType
      name: string
      description: string
      value: number | string
      category?: string
      tier?: string
      expiryDays?: number
      conditions?: any
      sourceType: "achievement" | "incentive" | "promotion" | "referral" | "admin"
      sourceId: string
    },
  ): Promise<Reward> {
    try {
      const supabase = await this.getSupabase()

      const reward: Reward = {
        id: `reward_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type: rewardConfig.type,
        name: rewardConfig.name,
        description: rewardConfig.description,
        value: rewardConfig.value,
        category: rewardConfig.category || "general",
        tier: (rewardConfig.tier as any) || "bronze",
        conditions: rewardConfig.conditions,
        earnedAt: new Date(),
        expiresAt: rewardConfig.expiryDays
          ? new Date(Date.now() + rewardConfig.expiryDays * 24 * 60 * 60 * 1000)
          : undefined,
        status: "earned",
        usageCount: 0,
        transferable: false,
        sourceType: rewardConfig.sourceType,
        sourceId: rewardConfig.sourceId,
      }

      // Store reward
      await supabase.from("user_rewards").insert({
        id: reward.id,
        user_id: reward.userId,
        type: reward.type,
        name: reward.name,
        description: reward.description,
        value: reward.value,
        category: reward.category,
        tier: reward.tier,
        conditions: reward.conditions,
        earned_at: reward.earnedAt.toISOString(),
        expires_at: reward.expiresAt?.toISOString(),
        status: reward.status,
        usage_count: reward.usageCount,
        transferable: reward.transferable,
        source_type: reward.sourceType,
        source_id: reward.sourceId,
      })

      // Emit reward earned event
      await this.eventSystem.publish({
        type: "reward_earned",
        source: "rewards-system",
        data: {
          userId,
          reward,
          timestamp: new Date(),
        },
        user_id: userId,
      })

      // Check for tier upgrade
      await this.checkTierUpgrade(userId)

      logger.info("Reward awarded to user", {
        userId,
        rewardId: reward.id,
        type: reward.type,
        value: reward.value,
      })

      return reward
    } catch (error) {
      logger.error("Failed to award reward", { userId, rewardConfig, error })
      throw new Error("Failed to award reward")
    }
  }

  /**
   * Redeem a reward
   */
  async redeemReward(
    userId: string,
    rewardId: string,
    redemptionContext?: {
      bookingId?: string
      experienceId?: string
      metadata?: Record<string, any>
    },
  ): Promise<{
    success: boolean
    reward?: Reward
    appliedDiscount?: number
    error?: string
  }> {
    try {
      const supabase = await this.getSupabase()

      // Get the reward
      const { data: reward, error: rewardError } = await supabase
        .from("user_rewards")
        .select("*")
        .eq("id", rewardId)
        .eq("user_id", userId)
        .single()

      if (rewardError || !reward) {
        return { success: false, error: "Reward not found" }
      }

      // Validate reward can be redeemed
      if (reward.status !== "earned") {
        return { success: false, error: "Reward not available for redemption" }
      }

      if (reward.expires_at && new Date(reward.expires_at) <= new Date()) {
        return { success: false, error: "Reward has expired" }
      }

      if (reward.conditions?.maxUsage && reward.usage_count >= reward.conditions.maxUsage) {
        return { success: false, error: "Reward usage limit exceeded" }
      }

      // Apply redemption logic based on reward type
      let appliedDiscount = 0
      const redemptionData: any = {
        redeemed_at: new Date().toISOString(),
        status: "redeemed",
        usage_count: reward.usage_count + 1,
        redemption_context: redemptionContext,
      }

      switch (reward.type) {
        case "points":
          // Points are deducted from user's balance
          redemptionData.status = "redeemed"
          break

        case "discount":
          if (typeof reward.value === "number") {
            appliedDiscount = reward.value
          }
          break

        case "free_experience":
          // Mark reward as used but keep available if it's multi-use
          if (!reward.conditions?.maxUsage || reward.usage_count + 1 < reward.conditions.maxUsage) {
            redemptionData.status = "earned" // Keep available for future use
          }
          break
      }

      // Update reward status
      await supabase.from("user_rewards").update(redemptionData).eq("id", rewardId)

      // Create redemption record
      await supabase.from("reward_redemptions").insert({
        reward_id: rewardId,
        user_id: userId,
        booking_id: redemptionContext?.bookingId,
        experience_id: redemptionContext?.experienceId,
        applied_discount: appliedDiscount,
        redemption_data: redemptionContext?.metadata,
        redeemed_at: new Date().toISOString(),
      })

      // Emit redemption event
      await this.eventSystem.publish({
        type: "reward_redeemed",
        source: "rewards-system",
        data: {
          userId,
          rewardId,
          appliedDiscount,
          redemptionContext,
          timestamp: new Date(),
        },
        user_id: userId,
      })

      logger.info("Reward redeemed successfully", {
        userId,
        rewardId,
        type: reward.type,
        appliedDiscount,
      })

      return {
        success: true,
        reward,
        appliedDiscount,
      }
    } catch (error) {
      logger.error("Failed to redeem reward", { userId, rewardId, error })
      return { success: false, error: "Failed to redeem reward" }
    }
  }

  /**
   * Process incentives based on user actions
   */
  async processIncentives(
    userId: string,
    eventType: string,
    eventData: Record<string, any>,
  ): Promise<Reward[]> {
    try {
      const supabase = await this.getSupabase()

      // Get active incentives for this event type
      const { data: incentives } = await supabase
        .from("incentives")
        .select("*")
        .eq("is_active", true)
        .contains("trigger_conditions", { eventType })
        .lte("starts_at", new Date().toISOString())
        .gte("ends_at", new Date().toISOString())

      const awardedRewards: Reward[] = []

      if (!incentives) return awardedRewards

      // Process each applicable incentive
      for (const incentive of incentives) {
        try {
          // Check if user matches target audience
          const matchesAudience = await this.checkAudienceMatch(userId, incentive.target_audience)
          if (!matchesAudience) continue

          // Check trigger conditions
          const meetsTriggerConditions = this.checkTriggerConditions(
            eventData,
            incentive.trigger_conditions,
          )
          if (!meetsTriggerConditions) continue

          // Check cooldown
          if (incentive.trigger_conditions.cooldownHours) {
            const hasCooldown = await this.checkIncentiveCooldown(
              userId,
              incentive.id,
              incentive.trigger_conditions.cooldownHours,
            )
            if (hasCooldown) continue
          }

          // Award rewards from this incentive
          for (const rewardConfig of incentive.rewards) {
            const reward = await this.awardReward(userId, {
              type: rewardConfig.type,
              name: `${incentive.name} Reward`,
              description: `Earned from: ${incentive.description}`,
              value: rewardConfig.value,
              tier: rewardConfig.tier,
              expiryDays: rewardConfig.expiryDays,
              conditions: rewardConfig.conditions,
              sourceType: "incentive",
              sourceId: incentive.id,
            })

            awardedRewards.push(reward)
          }

          // Update incentive stats
          await supabase
            .from("incentives")
            .update({
              stats: {
                ...incentive.stats,
                triggered: incentive.stats.triggered + 1,
              },
            })
            .eq("id", incentive.id)
        } catch (error) {
          logger.error("Failed to process incentive", { incentiveId: incentive.id, error })
        }
      }

      if (awardedRewards.length > 0) {
        logger.info("Incentives processed", {
          userId,
          eventType,
          rewardsAwarded: awardedRewards.length,
        })
      }

      return awardedRewards
    } catch (error) {
      logger.error("Failed to process incentives", { userId, eventType, error })
      return []
    }
  }

  /**
   * Get available loyalty tiers
   */
  getLoyaltyTiers(): LoyaltyTier[] {
    return [
      {
        name: "Explorer",
        level: 1,
        pointsRequired: 0,
        color: "#CD7F32",
        benefits: {
          pointsMultiplier: 1,
          exclusiveOffers: false,
          prioritySupport: false,
          freeUpgrades: 0,
          earlyAccess: false,
          conciergeService: false,
          customRewards: false,
        },
        rewards: {
          welcome: [],
          monthly: [],
          annual: [],
        },
      },
      {
        name: "Adventurer",
        level: 2,
        pointsRequired: 1000,
        color: "#C0C0C0",
        benefits: {
          pointsMultiplier: 1.25,
          exclusiveOffers: true,
          prioritySupport: false,
          freeUpgrades: 1,
          earlyAccess: false,
          conciergeService: false,
          customRewards: false,
        },
        rewards: {
          welcome: [],
          monthly: [],
          annual: [],
        },
      },
      {
        name: "Navigator",
        level: 3,
        pointsRequired: 5000,
        color: "#FFD700",
        benefits: {
          pointsMultiplier: 1.5,
          exclusiveOffers: true,
          prioritySupport: true,
          freeUpgrades: 2,
          earlyAccess: true,
          conciergeService: false,
          customRewards: true,
        },
        rewards: {
          welcome: [],
          monthly: [],
          annual: [],
        },
      },
      {
        name: "Elite",
        level: 4,
        pointsRequired: 15000,
        color: "#E5E4E2",
        benefits: {
          pointsMultiplier: 2,
          exclusiveOffers: true,
          prioritySupport: true,
          freeUpgrades: 5,
          earlyAccess: true,
          conciergeService: true,
          customRewards: true,
        },
        rewards: {
          welcome: [],
          monthly: [],
          annual: [],
        },
      },
      {
        name: "Legend",
        level: 5,
        pointsRequired: 50000,
        color: "#B9F2FF",
        benefits: {
          pointsMultiplier: 3,
          exclusiveOffers: true,
          prioritySupport: true,
          freeUpgrades: 10,
          earlyAccess: true,
          conciergeService: true,
          customRewards: true,
        },
        rewards: {
          welcome: [],
          monthly: [],
          annual: [],
        },
      },
    ]
  }

  // Private helper methods

  private async getPersonalizedOffers(userId: string): Promise<PersonalizedOffer[]> {
    const supabase = await this.getSupabase()

    const { data: offers } = await supabase
      .from("personalized_offers")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .gte("valid_until", new Date().toISOString())
      .order("is_priority", { ascending: false })
      .order("created_at", { ascending: false })

    return offers || []
  }

  private async generateRecommendedRewards(userId: string): Promise<Reward[]> {
    // This would use ML/AI to recommend rewards based on user behavior
    // For now, returning empty array
    return []
  }

  private calculateLoyaltyTier(points: number, totalRewards: number): string {
    const tiers = this.getLoyaltyTiers()

    for (let i = tiers.length - 1; i >= 0; i--) {
      if (points >= tiers[i].pointsRequired) {
        return tiers[i].name
      }
    }

    return tiers[0].name
  }

  private async checkTierUpgrade(userId: string): Promise<void> {
    const portfolio = await this.getUserRewardPortfolio(userId)
    const currentTierLevel = this.getLoyaltyTiers().findIndex((t) => t.name === portfolio.tier)
    const newTierLevel = this.getLoyaltyTiers().findIndex(
      (t) => portfolio.currentPoints >= t.pointsRequired && t.pointsRequired > 0,
    )

    if (newTierLevel > currentTierLevel) {
      // Emit tier upgrade event
      await this.eventSystem.publish({
        type: "loyalty_tier_upgrade",
        source: "rewards-system",
        data: {
          userId,
          oldTier: portfolio.tier,
          newTier: this.getLoyaltyTiers()[newTierLevel].name,
          timestamp: new Date(),
        },
        user_id: userId,
      })
    }
  }

  private async checkAudienceMatch(userId: string, targetAudience: any): Promise<boolean> {
    // This would check user segments, booking history, etc.
    // For now, returning true
    return true
  }

  private checkTriggerConditions(eventData: Record<string, any>, conditions: any): boolean {
    // Check if event data matches trigger conditions
    for (const [key, value] of Object.entries(conditions.requirements || {})) {
      if (eventData[key] !== value) {
        return false
      }
    }
    return true
  }

  private async checkIncentiveCooldown(
    userId: string,
    incentiveId: string,
    cooldownHours: number,
  ): Promise<boolean> {
    const supabase = await this.getSupabase()

    const cutoff = new Date(Date.now() - cooldownHours * 60 * 60 * 1000)

    const { data: recentRewards } = await supabase
      .from("user_rewards")
      .select("id")
      .eq("user_id", userId)
      .eq("source_id", incentiveId)
      .gte("earned_at", cutoff.toISOString())
      .limit(1)

    return (recentRewards?.length || 0) > 0
  }
}
