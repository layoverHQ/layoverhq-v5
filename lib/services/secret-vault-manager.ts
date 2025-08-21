/**
 * Secret Vault Manager
 * Manages secret experiences, vault unlocking, and integration with gamification system
 */

import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { EventBus } from "@/lib/event-system"
import { AdvancedGamificationSystem } from "./advanced-gamification-system"
import { CacheManager } from "../cache-manager"

export type VaultTier = "bronze" | "silver" | "gold" | "platinum" | "diamond"
export type UnlockMethod =
  | "code"
  | "achievement"
  | "score"
  | "referral"
  | "time_window"
  | "streak"
  | "social_share"
  | "mystery"

export interface SecretExperience {
  id: string
  title: string
  description: string
  city: string
  country: string
  price: number
  originalPrice: number
  savingsAmount: number
  savingsPercentage: number
  category: string
  tags: string[]
  rating: number
  reviewCount: number
  spotsAvailable: number
  totalSpots: number
  expiresAt: Date
  createdAt: Date

  // Vault-specific properties
  vaultTier: VaultTier
  unlockMethod: UnlockMethod
  unlockRequirements: UnlockRequirement
  exclusivityLevel: number // 1-10, higher = more exclusive
  viewCount: number
  unlockCount: number

  // Experience details
  duration: number // minutes
  meetingPoint: string
  coordinates: { lat: number; lng: number }
  provider: string
  cancellationPolicy: string
  inclusions: string[]
  exclusions: string[]
  restrictions: string[]

  // Media
  images: string[]
  videoUrl?: string

  // Status
  isActive: boolean
  isHidden: boolean
  isFeatured: boolean
}

export interface UnlockRequirement {
  type: UnlockMethod
  value?: any
  conditions?: {
    minimumScore?: number
    requiredAchievements?: string[]
    secretCode?: string
    referralCount?: number
    timeWindow?: { start: string; end: string }
    streakDays?: number
    socialShares?: number
    mysteryCondition?: string
  }
}

export interface VaultAccess {
  userId: string
  tier: VaultTier
  unlockedExperienceIds: string[]
  totalUnlocks: number
  firstUnlockAt?: Date
  lastUnlockAt?: Date
  vaultScore: number // Separate score for vault activities
  secretsShared: number
  codesDiscovered: string[]
}

export interface VaultStats {
  totalSecrets: number
  unlockedSecrets: number
  tierBreakdown: Record<VaultTier, number>
  categoryBreakdown: Record<string, number>
  averageSavings: number
  totalSavingsUnlocked: number
  exclusiveAccessCount: number
  mysterySecretsFound: number
}

export interface RewardTier {
  name: string
  tier: VaultTier
  requiredUnlocks: number
  rewards: {
    exclusiveAccess: string[]
    discountPercentage: number
    priorityBooking: boolean
    conciergeAccess: boolean
    customBadge: string
    title: string
    perks: string[]
  }
}

export class SecretVaultManager {
  private supabase: any
  private eventSystem: EventBus
  private cacheManager: CacheManager
  private gamificationSystem: AdvancedGamificationSystem

  constructor() {
    this.supabase = null
    this.eventSystem = new EventBus()
    this.cacheManager = new CacheManager()
    this.gamificationSystem = new AdvancedGamificationSystem()
  }

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
    return this.supabase
  }

  /**
   * Get all secret experiences available to a user
   */
  async getSecretExperiences(
    userId: string,
    filters?: {
      tier?: VaultTier
      city?: string
      category?: string
      unlocked?: boolean
      available?: boolean
    },
  ): Promise<{
    experiences: SecretExperience[]
    userAccess: VaultAccess
    vaultStats: VaultStats
  }> {
    try {
      const supabase = await this.getSupabase()

      // Get user's vault access
      const userAccess = await this.getUserVaultAccess(userId)

      // Build query for secret experiences
      let query = supabase.from("secret_experiences").select("*")

      if (filters?.tier) {
        query = query.eq("vault_tier", filters.tier)
      }

      if (filters?.city) {
        query = query.eq("city", filters.city)
      }

      if (filters?.category) {
        query = query.eq("category", filters.category)
      }

      if (filters?.available !== false) {
        query = query
          .eq("is_active", true)
          .gt("spots_available", 0)
          .gt("expires_at", new Date().toISOString())
      }

      const { data: experiences, error } = await query.order("exclusivity_level", {
        ascending: false,
      })

      if (error) throw error

      // Filter experiences based on user's access level and unlock status
      const filteredExperiences =
        experiences?.filter((exp) => {
          const canSee = this.canUserSeeExperience(exp, userAccess)
          const isUnlocked = userAccess.unlockedExperienceIds.includes(exp.id)

          if (filters?.unlocked === true && !isUnlocked) return false
          if (filters?.unlocked === false && isUnlocked) return false

          return canSee
        }) || []

      // Get vault statistics
      const vaultStats = await this.calculateVaultStats(userId, userAccess)

      logger.info("Secret experiences retrieved", {
        userId,
        totalExperiences: filteredExperiences.length,
        userTier: userAccess.tier,
        filters,
      })

      return {
        experiences: filteredExperiences,
        userAccess,
        vaultStats,
      }
    } catch (error) {
      logger.error("Failed to get secret experiences", { userId, error })
      throw new Error("Failed to retrieve secret experiences")
    }
  }

  /**
   * Attempt to unlock a secret experience
   */
  async unlockSecretExperience(
    userId: string,
    experienceId: string,
    unlockData?: {
      code?: string
      achievementId?: string
      socialProof?: any
    },
  ): Promise<{
    success: boolean
    experience?: SecretExperience
    newTier?: VaultTier
    achievements?: any[]
    error?: string
  }> {
    try {
      const supabase = await this.getSupabase()

      // Get the experience
      const { data: experience, error: expError } = await supabase
        .from("secret_experiences")
        .select("*")
        .eq("id", experienceId)
        .single()

      if (expError || !experience) {
        return { success: false, error: "Experience not found" }
      }

      // Get user's current vault access
      const userAccess = await this.getUserVaultAccess(userId)

      // Check if already unlocked
      if (userAccess.unlockedExperienceIds.includes(experienceId)) {
        return { success: false, error: "Experience already unlocked" }
      }

      // Validate unlock requirements
      const canUnlock = await this.validateUnlockRequirements(userId, experience, unlockData)

      if (!canUnlock.valid) {
        return { success: false, error: canUnlock.reason }
      }

      // Perform the unlock
      await supabase.from("vault_unlocks").insert({
        user_id: userId,
        experience_id: experienceId,
        unlock_method: experience.unlock_method,
        unlock_data: unlockData,
        unlocked_at: new Date().toISOString(),
      })

      // Update user's vault access
      const newUnlockedIds = [...userAccess.unlockedExperienceIds, experienceId]
      const newVaultScore = userAccess.vaultScore + this.calculateVaultScore(experience)

      await supabase.from("vault_access").upsert({
        user_id: userId,
        unlocked_experience_ids: newUnlockedIds,
        total_unlocks: newUnlockedIds.length,
        vault_score: newVaultScore,
        last_unlock_at: new Date().toISOString(),
      })

      // Check for tier upgrade
      const newTier = this.calculateUserTier(newUnlockedIds.length, newVaultScore)
      let tierUpgrade = null

      if (newTier !== userAccess.tier) {
        await supabase.from("vault_access").update({ tier: newTier }).eq("user_id", userId)

        tierUpgrade = newTier

        // Emit tier upgrade event
        await this.eventSystem.publish({
          type: "vault_tier_upgrade",
          source: "secret-vault-manager",
          data: {
            userId,
            oldTier: userAccess.tier,
            newTier,
            timestamp: new Date(),
          },
        })
      }

      // Track achievement progress
      const achievementResults = await this.gamificationSystem.trackUserAction(
        userId,
        "secret_unlocked",
        {
          experienceId,
          tier: experience.vault_tier,
          unlockMethod: experience.unlock_method,
          vaultScore: newVaultScore,
        },
      )

      // Emit unlock event
      await this.eventSystem.publish({
        type: "secret_experience_unlocked",
        source: "secret-vault-manager",
        data: {
          userId,
          experienceId,
          experience,
          unlockMethod: experience.unlock_method,
          newTier: tierUpgrade,
          timestamp: new Date(),
        },
      })

      logger.info("Secret experience unlocked", {
        userId,
        experienceId,
        unlockMethod: experience.unlock_method,
        newTier: tierUpgrade,
      })

      return {
        success: true,
        experience,
        newTier: tierUpgrade,
        achievements: achievementResults.newAchievements,
      }
    } catch (error) {
      logger.error("Failed to unlock secret experience", { userId, experienceId, error })
      return { success: false, error: "Failed to unlock experience" }
    }
  }

  /**
   * Get available vault tiers and their requirements
   */
  getVaultTiers(): RewardTier[] {
    return [
      {
        name: "Bronze Explorer",
        tier: "bronze",
        requiredUnlocks: 1,
        rewards: {
          exclusiveAccess: ["weekend_specials"],
          discountPercentage: 5,
          priorityBooking: false,
          conciergeAccess: false,
          customBadge: "bronze_explorer",
          title: "Secret Explorer",
          perks: ["Basic vault access", "Community forums"],
        },
      },
      {
        name: "Silver Adventurer",
        tier: "silver",
        requiredUnlocks: 5,
        rewards: {
          exclusiveAccess: ["premium_experiences", "early_access"],
          discountPercentage: 10,
          priorityBooking: false,
          conciergeAccess: false,
          customBadge: "silver_adventurer",
          title: "Vault Adventurer",
          perks: ["Enhanced discounts", "Secret community access", "Monthly exclusive offers"],
        },
      },
      {
        name: "Gold Curator",
        tier: "gold",
        requiredUnlocks: 15,
        rewards: {
          exclusiveAccess: ["luxury_tier", "curator_picks", "limited_edition"],
          discountPercentage: 15,
          priorityBooking: true,
          conciergeAccess: false,
          customBadge: "gold_curator",
          title: "Vault Curator",
          perks: ["Priority booking", "Personal recommendations", "VIP support"],
        },
      },
      {
        name: "Platinum Insider",
        tier: "platinum",
        requiredUnlocks: 30,
        rewards: {
          exclusiveAccess: ["insider_only", "platinum_tier", "ultra_rare"],
          discountPercentage: 20,
          priorityBooking: true,
          conciergeAccess: true,
          customBadge: "platinum_insider",
          title: "Vault Insider",
          perks: ["Concierge access", "Custom experiences", "Partner perks", "24/7 support"],
        },
      },
      {
        name: "Diamond Legend",
        tier: "diamond",
        requiredUnlocks: 50,
        rewards: {
          exclusiveAccess: ["legendary_tier", "one_of_a_kind", "invitation_only"],
          discountPercentage: 25,
          priorityBooking: true,
          conciergeAccess: true,
          customBadge: "diamond_legend",
          title: "Vault Legend",
          perks: [
            "Legendary status",
            "Unlimited access",
            "Personal concierge",
            "Custom itineraries",
          ],
        },
      },
    ]
  }

  /**
   * Generate mystery unlock codes
   */
  async generateMysteryCode(
    experienceId: string,
    type: "riddle" | "puzzle" | "social",
  ): Promise<{
    code: string
    hint: string
    solution: string
    validUntil: Date
  }> {
    const codes = {
      riddle: [
        {
          code: "LAYERS_OF_TIME",
          hint: "What has layers but is not a cake, saves time but is not a clock?",
          solution: "Layovers save time by creating efficient routing",
        },
        {
          code: "HIDDEN_PATHS",
          hint: "The shortest distance between two points is not always a straight line in air travel",
          solution: "Connecting flights can be cheaper than direct flights",
        },
      ],
      puzzle: [
        {
          code: "SKIP_THE_LINE",
          hint: "KIPS EHT ENIL spelled backwards",
          solution: "Skip the line backwards is the solution",
        },
      ],
      social: [
        {
          code: "SHARE_THE_SECRET",
          hint: "Share this experience on 3 social platforms to unlock",
          solution: "Social sharing unlocks community experiences",
        },
      ],
    }

    const selectedCodes = codes[type]
    const randomCode = selectedCodes[Math.floor(Math.random() * selectedCodes.length)]

    // Store the code with expiration
    const supabase = await this.getSupabase()
    await supabase.from("mystery_codes").insert({
      experience_id: experienceId,
      code: randomCode.code,
      type,
      hint: randomCode.hint,
      solution: randomCode.solution,
      valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      created_at: new Date().toISOString(),
    })

    return {
      code: randomCode.code,
      hint: randomCode.hint,
      solution: randomCode.solution,
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
    }
  }

  // Private helper methods

  private async getUserVaultAccess(userId: string): Promise<VaultAccess> {
    const supabase = await this.getSupabase()

    const { data: access, error } = await supabase
      .from("vault_access")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    return (
      access || {
        userId,
        tier: "bronze",
        unlockedExperienceIds: [],
        totalUnlocks: 0,
        vaultScore: 0,
        secretsShared: 0,
        codesDiscovered: [],
      }
    )
  }

  private canUserSeeExperience(experience: any, userAccess: VaultAccess): boolean {
    // Users can see experiences up to their tier level
    const tierLevels = {
      bronze: 1,
      silver: 2,
      gold: 3,
      platinum: 4,
      diamond: 5,
    }

    const userTierLevel = tierLevels[userAccess.tier]
    const experienceTierLevel = tierLevels[experience.vault_tier]

    return experienceTierLevel <= userTierLevel
  }

  private async validateUnlockRequirements(
    userId: string,
    experience: any,
    unlockData?: any,
  ): Promise<{ valid: boolean; reason?: string }> {
    const requirements = experience.unlock_requirements

    switch (experience.unlock_method) {
      case "code":
        if (!unlockData?.code || unlockData.code !== requirements.conditions?.secretCode) {
          return { valid: false, reason: "Invalid or missing secret code" }
        }
        break

      case "score":
        const userStats = await this.gamificationSystem.getUserStats(userId)
        if (userStats.totalScore < (requirements.conditions?.minimumScore || 0)) {
          return { valid: false, reason: "Insufficient hacker score" }
        }
        break

      case "achievement":
        const requiredAchievements = requirements.conditions?.requiredAchievements || []
        const userAchievements = await this.gamificationSystem.getUserStats(userId)
        const hasRequiredAchievements = requiredAchievements.every((reqId) =>
          userAchievements.achievements.some((a) => a.achievementId === reqId && a.isUnlocked),
        )
        if (!hasRequiredAchievements) {
          return { valid: false, reason: "Required achievements not unlocked" }
        }
        break

      case "time_window":
        const now = new Date()
        const currentTime = now.getHours() + now.getMinutes() / 60
        const start = parseInt(requirements.conditions?.timeWindow?.start || "0")
        const end = parseInt(requirements.conditions?.timeWindow?.end || "24")

        if (currentTime < start || currentTime > end) {
          return { valid: false, reason: "Not available during current time window" }
        }
        break

      case "referral":
        // Check referral count (would integrate with referral system)
        const requiredReferrals = requirements.conditions?.referralCount || 0
        // This would be implemented with actual referral tracking
        break

      case "social_share":
        if (!unlockData?.socialProof) {
          return { valid: false, reason: "Social sharing proof required" }
        }
        break
    }

    return { valid: true }
  }

  private calculateVaultScore(experience: any): number {
    const baseScore = 10
    const tierMultipliers = {
      bronze: 1,
      silver: 2,
      gold: 3,
      platinum: 5,
      diamond: 8,
    }

    return baseScore * (tierMultipliers[experience.vault_tier] || 1) * experience.exclusivity_level
  }

  private calculateUserTier(totalUnlocks: number, vaultScore: number): VaultTier {
    if (totalUnlocks >= 50 && vaultScore >= 2000) return "diamond"
    if (totalUnlocks >= 30 && vaultScore >= 1000) return "platinum"
    if (totalUnlocks >= 15 && vaultScore >= 500) return "gold"
    if (totalUnlocks >= 5 && vaultScore >= 100) return "silver"
    return "bronze"
  }

  private async calculateVaultStats(userId: string, userAccess: VaultAccess): Promise<VaultStats> {
    const supabase = await this.getSupabase()

    // Get all experiences user can see
    const { data: experiences } = await supabase
      .from("secret_experiences")
      .select("*")
      .eq("is_active", true)

    const visibleExperiences =
      experiences?.filter((exp) => this.canUserSeeExperience(exp, userAccess)) || []

    const unlockedExperiences = visibleExperiences.filter((exp) =>
      userAccess.unlockedExperienceIds.includes(exp.id),
    )

    // Calculate tier breakdown
    const tierBreakdown: Record<VaultTier, number> = {
      bronze: 0,
      silver: 0,
      gold: 0,
      platinum: 0,
      diamond: 0,
    }

    // Calculate category breakdown
    const categoryBreakdown: Record<string, number> = {}

    visibleExperiences.forEach((exp) => {
      tierBreakdown[exp.vault_tier]++
      categoryBreakdown[exp.category] = (categoryBreakdown[exp.category] || 0) + 1
    })

    const totalSavingsUnlocked = unlockedExperiences.reduce(
      (sum, exp) => sum + exp.savings_amount,
      0,
    )

    const averageSavings =
      unlockedExperiences.length > 0 ? totalSavingsUnlocked / unlockedExperiences.length : 0

    return {
      totalSecrets: visibleExperiences.length,
      unlockedSecrets: unlockedExperiences.length,
      tierBreakdown,
      categoryBreakdown,
      averageSavings,
      totalSavingsUnlocked,
      exclusiveAccessCount: unlockedExperiences.filter((exp) => exp.exclusivity_level >= 7).length,
      mysterySecretsFound: userAccess.codesDiscovered.length,
    }
  }
}
