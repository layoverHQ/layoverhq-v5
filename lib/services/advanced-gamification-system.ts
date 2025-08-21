/**
 * Advanced Gamification System
 * Implements 52 achievements across 6 categories with real-time tracking
 */

import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { EventBus } from "@/lib/event-system"
import { CacheManager } from "../cache-manager"

// Using imported logger instance

export type AchievementCategory =
  | "milestone"
  | "savings"
  | "speed"
  | "exploration"
  | "secret"
  | "streak"
export type AchievementRarity = "common" | "rare" | "epic" | "legendary" | "mythic"
export type AchievementType =
  | "counter"
  | "boolean"
  | "streak"
  | "threshold"
  | "time_based"
  | "collection"

export interface Achievement {
  id: string
  name: string
  description: string
  category: AchievementCategory
  rarity: AchievementRarity
  type: AchievementType
  icon: string
  points: number
  requirements: {
    target?: number
    comparison?: ">" | ">=" | "<" | "<=" | "="
    timeframe?: number // hours
    conditions?: Record<string, any>
  }
  rewards: {
    points: number
    badge?: string
    title?: string
    perks?: string[]
    secretUnlock?: string
  }
  isSecret: boolean
  isActive: boolean
  order: number
}

export interface UserAchievement {
  userId: string
  achievementId: string
  progress: number
  maxProgress: number
  isUnlocked: boolean
  unlockedAt?: Date
  currentStreak?: number
  bestStreak?: number
  metadata?: Record<string, any>
}

export interface UserStats {
  userId: string
  totalScore: number
  globalRank: number
  currentStreak: number
  bestStreak: number
  totalSavings: number
  citiesVisited: number
  experiencesCompleted: number
  secretsUnlocked: number
  achievements: UserAchievement[]
  level: number
  nextLevelPoints: number
  badges: string[]
  title?: string
}

export interface LeaderboardEntry {
  userId: string
  username: string
  displayName: string
  totalScore: number
  rank: number
  currentStreak: number
  achievementCount: number
  avatar?: string
  title?: string
  badge?: string
}

export interface SocialFeatures {
  userId: string
  following: string[]
  followers: string[]
  recentActivity: Array<{
    type: "achievement_unlocked" | "streak_milestone" | "leaderboard_climb"
    data: any
    timestamp: Date
  }>
  shareableStats: {
    totalScore: number
    rank: number
    recentAchievements: Achievement[]
  }
}

export class AdvancedGamificationSystem {
  private supabase: any
  private eventSystem: EventBus
  private cacheManager: CacheManager
  private achievements: Achievement[]

  constructor() {
    this.supabase = null // Will be initialized when needed
    this.eventSystem = new EventBus()
    this.cacheManager = new CacheManager()
    this.achievements = this.initializeAchievements()
  }

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
    return this.supabase
  }

  /**
   * Initialize all 52 achievements across 6 categories
   */
  private initializeAchievements(): Achievement[] {
    return [
      // MILESTONE ACHIEVEMENTS (8 achievements)
      {
        id: "first_layover",
        name: "First Steps",
        description: "Complete your first layover experience",
        category: "milestone",
        rarity: "common",
        type: "boolean",
        icon: "MapPin",
        points: 100,
        requirements: { target: 1 },
        rewards: { points: 100, title: "Explorer" },
        isSecret: false,
        isActive: true,
        order: 1,
      },
      {
        id: "tenth_experience",
        name: "Getting Started",
        description: "Complete 10 layover experiences",
        category: "milestone",
        rarity: "common",
        type: "counter",
        icon: "Target",
        points: 200,
        requirements: { target: 10, comparison: ">=" },
        rewards: { points: 200 },
        isSecret: false,
        isActive: true,
        order: 2,
      },
      {
        id: "fiftieth_experience",
        name: "Experienced Traveler",
        description: "Complete 50 layover experiences",
        category: "milestone",
        rarity: "rare",
        type: "counter",
        icon: "Award",
        points: 500,
        requirements: { target: 50, comparison: ">=" },
        rewards: { points: 500, badge: "experienced_traveler" },
        isSecret: false,
        isActive: true,
        order: 3,
      },
      {
        id: "hundredth_experience",
        name: "Layover Legend",
        description: "Complete 100 layover experiences",
        category: "milestone",
        rarity: "epic",
        type: "counter",
        icon: "Crown",
        points: 1000,
        requirements: { target: 100, comparison: ">=" },
        rewards: { points: 1000, title: "Layover Legend", badge: "legend" },
        isSecret: false,
        isActive: true,
        order: 4,
      },
      {
        id: "anniversary",
        name: "One Year Strong",
        description: "Use LayoverHQ for one full year",
        category: "milestone",
        rarity: "rare",
        type: "time_based",
        icon: "Calendar",
        points: 750,
        requirements: { timeframe: 365 * 24 },
        rewards: { points: 750, perks: ["priority_support"] },
        isSecret: false,
        isActive: true,
        order: 5,
      },
      {
        id: "perfect_month",
        name: "Perfect Month",
        description: "Book at least one experience every day for 30 days",
        category: "milestone",
        rarity: "epic",
        type: "streak",
        icon: "Calendar",
        points: 1200,
        requirements: { target: 30, comparison: ">=" },
        rewards: { points: 1200, badge: "perfect_month" },
        isSecret: false,
        isActive: true,
        order: 6,
      },
      {
        id: "early_adopter",
        name: "Early Adopter",
        description: "One of the first 1000 users",
        category: "milestone",
        rarity: "legendary",
        type: "boolean",
        icon: "Rocket",
        points: 2000,
        requirements: { target: 1 },
        rewards: { points: 2000, title: "Pioneer", badge: "early_adopter" },
        isSecret: false,
        isActive: true,
        order: 7,
      },
      {
        id: "beta_tester",
        name: "Beta Warrior",
        description: "Participated in beta testing program",
        category: "milestone",
        rarity: "legendary",
        type: "boolean",
        icon: "Shield",
        points: 1500,
        requirements: { target: 1 },
        rewards: { points: 1500, badge: "beta_tester" },
        isSecret: false,
        isActive: true,
        order: 8,
      },

      // SAVINGS ACHIEVEMENTS (12 achievements)
      {
        id: "first_save",
        name: "Money Saver",
        description: "Save your first $50 using layover hacks",
        category: "savings",
        rarity: "common",
        type: "threshold",
        icon: "DollarSign",
        points: 150,
        requirements: { target: 50, comparison: ">=" },
        rewards: { points: 150 },
        isSecret: false,
        isActive: true,
        order: 9,
      },
      {
        id: "hundred_saver",
        name: "Smart Spender",
        description: "Save $100+ on a single booking",
        category: "savings",
        rarity: "rare",
        type: "threshold",
        icon: "Banknote",
        points: 300,
        requirements: { target: 100, comparison: ">=" },
        rewards: { points: 300 },
        isSecret: false,
        isActive: true,
        order: 10,
      },
      {
        id: "five_hundred_saver",
        name: "Savings Master",
        description: "Save over $500 using layover hacks",
        category: "savings",
        rarity: "epic",
        type: "threshold",
        icon: "TrendingUp",
        points: 750,
        requirements: { target: 500, comparison: ">=" },
        rewards: { points: 750, badge: "savings_master" },
        isSecret: false,
        isActive: true,
        order: 11,
      },
      {
        id: "thousand_saver",
        name: "Budget Hacker",
        description: "Save over $1000 total",
        category: "savings",
        rarity: "legendary",
        type: "threshold",
        icon: "CircleDollarSign",
        points: 1500,
        requirements: { target: 1000, comparison: ">=" },
        rewards: { points: 1500, title: "Budget Hacker" },
        isSecret: false,
        isActive: true,
        order: 12,
      },
      {
        id: "deal_hunter",
        name: "Deal Hunter",
        description: "Book 5 experiences with 40%+ savings",
        category: "savings",
        rarity: "rare",
        type: "counter",
        icon: "Crosshairs",
        points: 400,
        requirements: { target: 5, comparison: ">=" },
        rewards: { points: 400 },
        isSecret: false,
        isActive: true,
        order: 13,
      },
      {
        id: "bargain_finder",
        name: "Bargain Finder",
        description: "Find and book a sub-$20 experience",
        category: "savings",
        rarity: "rare",
        type: "threshold",
        icon: "Search",
        points: 350,
        requirements: { target: 20, comparison: "<" },
        rewards: { points: 350 },
        isSecret: false,
        isActive: true,
        order: 14,
      },
      {
        id: "last_minute_saver",
        name: "Last Minute Saver",
        description: "Book an experience within 2 hours of flight departure",
        category: "savings",
        rarity: "epic",
        type: "time_based",
        icon: "Clock",
        points: 800,
        requirements: { timeframe: 2 },
        rewards: { points: 800, badge: "last_minute" },
        isSecret: false,
        isActive: true,
        order: 15,
      },
      {
        id: "seasonal_saver",
        name: "Seasonal Saver",
        description: "Book experiences in all 4 seasons",
        category: "savings",
        rarity: "epic",
        type: "collection",
        icon: "Calendar",
        points: 600,
        requirements: { target: 4, comparison: "=" },
        rewards: { points: 600 },
        isSecret: false,
        isActive: true,
        order: 16,
      },
      {
        id: "group_discount",
        name: "Group Leader",
        description: "Book group experiences for 4+ people",
        category: "savings",
        rarity: "rare",
        type: "threshold",
        icon: "Users",
        points: 450,
        requirements: { target: 4, comparison: ">=" },
        rewards: { points: 450 },
        isSecret: false,
        isActive: true,
        order: 17,
      },
      {
        id: "weekday_warrior",
        name: "Weekday Warrior",
        description: "Book 10 experiences on weekdays",
        category: "savings",
        rarity: "common",
        type: "counter",
        icon: "Calendar",
        points: 200,
        requirements: { target: 10, comparison: ">=" },
        rewards: { points: 200 },
        isSecret: false,
        isActive: true,
        order: 18,
      },
      {
        id: "early_bird",
        name: "Early Bird",
        description: "Book morning experiences (6-9 AM) 5 times",
        category: "savings",
        rarity: "common",
        type: "counter",
        icon: "Sunrise",
        points: 250,
        requirements: { target: 5, comparison: ">=" },
        rewards: { points: 250 },
        isSecret: false,
        isActive: true,
        order: 19,
      },
      {
        id: "night_owl",
        name: "Night Owl",
        description: "Book evening experiences (7-11 PM) 5 times",
        category: "savings",
        rarity: "common",
        type: "counter",
        icon: "Moon",
        points: 250,
        requirements: { target: 5, comparison: ">=" },
        rewards: { points: 250 },
        isSecret: false,
        isActive: true,
        order: 20,
      },

      // SPEED ACHIEVEMENTS (6 achievements)
      {
        id: "speed_demon",
        name: "Speed Demon",
        description: "Complete a layover experience in under 3 hours",
        category: "speed",
        rarity: "epic",
        type: "time_based",
        icon: "Zap",
        points: 750,
        requirements: { timeframe: 3 },
        rewards: { points: 750, badge: "speed_demon" },
        isSecret: false,
        isActive: true,
        order: 21,
      },
      {
        id: "lightning_fast",
        name: "Lightning Fast",
        description: "Complete an experience in under 1 hour",
        category: "speed",
        rarity: "legendary",
        type: "time_based",
        icon: "Bolt",
        points: 1200,
        requirements: { timeframe: 1 },
        rewards: { points: 1200, title: "Lightning Fast" },
        isSecret: false,
        isActive: true,
        order: 22,
      },
      {
        id: "quick_booker",
        name: "Quick Booker",
        description: "Book an experience within 5 minutes of searching",
        category: "speed",
        rarity: "rare",
        type: "time_based",
        icon: "Timer",
        points: 400,
        requirements: { timeframe: 5 / 60 }, // 5 minutes in hours
        rewards: { points: 400 },
        isSecret: false,
        isActive: true,
        order: 23,
      },
      {
        id: "express_traveler",
        name: "Express Traveler",
        description: "Complete 5 experiences in under 2 hours each",
        category: "speed",
        rarity: "epic",
        type: "counter",
        icon: "FastForward",
        points: 900,
        requirements: { target: 5, comparison: ">=" },
        rewards: { points: 900, badge: "express" },
        isSecret: false,
        isActive: true,
        order: 24,
      },
      {
        id: "airport_sprinter",
        name: "Airport Sprinter",
        description: "Complete airport-to-city-to-airport in record time",
        category: "speed",
        rarity: "legendary",
        type: "time_based",
        icon: "Plane",
        points: 1500,
        requirements: { timeframe: 4 },
        rewards: { points: 1500, title: "Airport Sprinter" },
        isSecret: false,
        isActive: true,
        order: 25,
      },
      {
        id: "efficiency_expert",
        name: "Efficiency Expert",
        description: "Maintain under 2-hour average for 10 experiences",
        category: "speed",
        rarity: "epic",
        type: "counter",
        icon: "Target",
        points: 800,
        requirements: { target: 10, comparison: ">=" },
        rewards: { points: 800, perks: ["express_lane"] },
        isSecret: false,
        isActive: true,
        order: 26,
      },

      // EXPLORATION ACHIEVEMENTS (15 achievements)
      {
        id: "first_city",
        name: "City Explorer",
        description: "Visit your first layover city",
        category: "exploration",
        rarity: "common",
        type: "counter",
        icon: "MapPin",
        points: 100,
        requirements: { target: 1, comparison: ">=" },
        rewards: { points: 100 },
        isSecret: false,
        isActive: true,
        order: 27,
      },
      {
        id: "five_cities",
        name: "Regional Wanderer",
        description: "Visit 5 different layover cities",
        category: "exploration",
        rarity: "common",
        type: "counter",
        icon: "Map",
        points: 250,
        requirements: { target: 5, comparison: ">=" },
        rewards: { points: 250 },
        isSecret: false,
        isActive: true,
        order: 28,
      },
      {
        id: "globe_trotter",
        name: "Globe Trotter",
        description: "Visit 10 different layover cities",
        category: "exploration",
        rarity: "rare",
        type: "counter",
        icon: "Globe",
        points: 500,
        requirements: { target: 10, comparison: ">=" },
        rewards: { points: 500, badge: "globe_trotter" },
        isSecret: false,
        isActive: true,
        order: 29,
      },
      {
        id: "world_traveler",
        name: "World Traveler",
        description: "Visit 25 different layover cities",
        category: "exploration",
        rarity: "epic",
        type: "counter",
        icon: "Earth",
        points: 1000,
        requirements: { target: 25, comparison: ">=" },
        rewards: { points: 1000, title: "World Traveler" },
        isSecret: false,
        isActive: true,
        order: 30,
      },
      {
        id: "continental_collector",
        name: "Continental Collector",
        description: "Visit cities on all 7 continents",
        category: "exploration",
        rarity: "legendary",
        type: "collection",
        icon: "Mountain",
        points: 2000,
        requirements: { target: 7, comparison: "=" },
        rewards: { points: 2000, title: "Continental Collector", badge: "world_explorer" },
        isSecret: false,
        isActive: true,
        order: 31,
      },
      {
        id: "culture_seeker",
        name: "Culture Seeker",
        description: "Book cultural experiences in 5 different countries",
        category: "exploration",
        rarity: "rare",
        type: "counter",
        icon: "Landmark",
        points: 600,
        requirements: { target: 5, comparison: ">=" },
        rewards: { points: 600 },
        isSecret: false,
        isActive: true,
        order: 32,
      },
      {
        id: "foodie_traveler",
        name: "Foodie Traveler",
        description: "Book food experiences in 8 different cities",
        category: "exploration",
        rarity: "rare",
        type: "counter",
        icon: "UtensilsCrossed",
        points: 550,
        requirements: { target: 8, comparison: ">=" },
        rewards: { points: 550, badge: "foodie" },
        isSecret: false,
        isActive: true,
        order: 33,
      },
      {
        id: "adventure_seeker",
        name: "Adventure Seeker",
        description: "Book adventure activities in 6 cities",
        category: "exploration",
        rarity: "epic",
        type: "counter",
        icon: "Mountain",
        points: 750,
        requirements: { target: 6, comparison: ">=" },
        rewards: { points: 750, badge: "adventurer" },
        isSecret: false,
        isActive: true,
        order: 34,
      },
      {
        id: "museum_hopper",
        name: "Museum Hopper",
        description: "Visit museums in 4 different cities",
        category: "exploration",
        rarity: "common",
        type: "counter",
        icon: "Building",
        points: 300,
        requirements: { target: 4, comparison: ">=" },
        rewards: { points: 300 },
        isSecret: false,
        isActive: true,
        order: 35,
      },
      {
        id: "nature_lover",
        name: "Nature Lover",
        description: "Book outdoor experiences in 5 cities",
        category: "exploration",
        rarity: "rare",
        type: "counter",
        icon: "TreePine",
        points: 450,
        requirements: { target: 5, comparison: ">=" },
        rewards: { points: 450 },
        isSecret: false,
        isActive: true,
        order: 36,
      },
      {
        id: "shopping_enthusiast",
        name: "Shopping Enthusiast",
        description: "Book shopping experiences in 6 cities",
        category: "exploration",
        rarity: "common",
        type: "counter",
        icon: "ShoppingBag",
        points: 350,
        requirements: { target: 6, comparison: ">=" },
        rewards: { points: 350 },
        isSecret: false,
        isActive: true,
        order: 37,
      },
      {
        id: "night_life_explorer",
        name: "Nightlife Explorer",
        description: "Experience nightlife in 4 different cities",
        category: "exploration",
        rarity: "rare",
        type: "counter",
        icon: "Moon",
        points: 500,
        requirements: { target: 4, comparison: ">=" },
        rewards: { points: 500 },
        isSecret: false,
        isActive: true,
        order: 38,
      },
      {
        id: "architecture_buff",
        name: "Architecture Buff",
        description: "Visit architectural landmarks in 5 cities",
        category: "exploration",
        rarity: "rare",
        type: "counter",
        icon: "Castle",
        points: 400,
        requirements: { target: 5, comparison: ">=" },
        rewards: { points: 400 },
        isSecret: false,
        isActive: true,
        order: 39,
      },
      {
        id: "local_expert",
        name: "Local Expert",
        description: "Book local guide experiences in 3 cities",
        category: "exploration",
        rarity: "epic",
        type: "counter",
        icon: "Users",
        points: 700,
        requirements: { target: 3, comparison: ">=" },
        rewards: { points: 700, perks: ["local_insights"] },
        isSecret: false,
        isActive: true,
        order: 40,
      },
      {
        id: "hidden_gems",
        name: "Hidden Gems",
        description: "Discover off-the-beaten-path experiences in 4 cities",
        category: "exploration",
        rarity: "epic",
        type: "counter",
        icon: "Gem",
        points: 850,
        requirements: { target: 4, comparison: ">=" },
        rewards: { points: 850, badge: "gem_hunter" },
        isSecret: false,
        isActive: true,
        order: 41,
      },

      // SECRET ACHIEVEMENTS (4 achievements)
      {
        id: "secret_finder",
        name: "Secret Finder",
        description: "Unlock your first secret experience vault",
        category: "secret",
        rarity: "epic",
        type: "boolean",
        icon: "Lock",
        points: 800,
        requirements: { target: 1 },
        rewards: { points: 800, secretUnlock: "vault_access" },
        isSecret: true,
        isActive: true,
        order: 42,
      },
      {
        id: "vault_master",
        name: "Vault Master",
        description: "Unlock all secret experience vaults",
        category: "secret",
        rarity: "mythic",
        type: "counter",
        icon: "Crown",
        points: 3000,
        requirements: { target: 10, comparison: ">=" },
        rewards: { points: 3000, title: "Vault Master", badge: "vault_master" },
        isSecret: true,
        isActive: true,
        order: 43,
      },
      {
        id: "easter_egg_hunter",
        name: "Easter Egg Hunter",
        description: "Find hidden features in the app",
        category: "secret",
        rarity: "legendary",
        type: "collection",
        icon: "Search",
        points: 1500,
        requirements: { target: 5, comparison: ">=" },
        rewards: { points: 1500, badge: "easter_egg" },
        isSecret: true,
        isActive: true,
        order: 44,
      },
      {
        id: "insider_access",
        name: "Insider Access",
        description: "Get invited to exclusive beta features",
        category: "secret",
        rarity: "mythic",
        type: "boolean",
        icon: "Key",
        points: 2500,
        requirements: { target: 1 },
        rewards: { points: 2500, perks: ["beta_access"], title: "Insider" },
        isSecret: true,
        isActive: true,
        order: 45,
      },

      // STREAK ACHIEVEMENTS (7 achievements)
      {
        id: "first_streak",
        name: "Getting Started",
        description: "Maintain a 3-day booking streak",
        category: "streak",
        rarity: "common",
        type: "streak",
        icon: "Flame",
        points: 150,
        requirements: { target: 3, comparison: ">=" },
        rewards: { points: 150 },
        isSecret: false,
        isActive: true,
        order: 46,
      },
      {
        id: "week_streaker",
        name: "Week Streaker",
        description: "Maintain a 7-day booking streak",
        category: "streak",
        rarity: "common",
        type: "streak",
        icon: "CalendarDays",
        points: 300,
        requirements: { target: 7, comparison: ">=" },
        rewards: { points: 300 },
        isSecret: false,
        isActive: true,
        order: 47,
      },
      {
        id: "streak_warrior",
        name: "Streak Warrior",
        description: "Maintain a 14-day booking streak",
        category: "streak",
        rarity: "rare",
        type: "streak",
        icon: "Sword",
        points: 600,
        requirements: { target: 14, comparison: ">=" },
        rewards: { points: 600, badge: "streak_warrior" },
        isSecret: false,
        isActive: true,
        order: 48,
      },
      {
        id: "streak_champion",
        name: "Streak Champion",
        description: "Maintain a 30-day booking streak",
        category: "streak",
        rarity: "epic",
        type: "streak",
        icon: "Trophy",
        points: 1200,
        requirements: { target: 30, comparison: ">=" },
        rewards: { points: 1200, title: "Streak Champion" },
        isSecret: false,
        isActive: true,
        order: 49,
      },
      {
        id: "streak_legend",
        name: "Streak Legend",
        description: "Maintain a 60-day booking streak",
        category: "streak",
        rarity: "legendary",
        type: "streak",
        icon: "Crown",
        points: 2000,
        requirements: { target: 60, comparison: ">=" },
        rewards: { points: 2000, title: "Streak Legend", badge: "legend" },
        isSecret: false,
        isActive: true,
        order: 50,
      },
      {
        id: "streak_immortal",
        name: "Streak Immortal",
        description: "Maintain a 100-day booking streak",
        category: "streak",
        rarity: "mythic",
        type: "streak",
        icon: "Infinity",
        points: 5000,
        requirements: { target: 100, comparison: ">=" },
        rewards: { points: 5000, title: "Immortal Streaker", badge: "immortal" },
        isSecret: false,
        isActive: true,
        order: 51,
      },
      {
        id: "comeback_kid",
        name: "Comeback Kid",
        description: "Rebuild a streak after losing one of 20+ days",
        category: "streak",
        rarity: "rare",
        type: "boolean",
        icon: "RotateCcw",
        points: 750,
        requirements: { target: 1 },
        rewards: { points: 750, badge: "comeback" },
        isSecret: false,
        isActive: true,
        order: 52,
      },
    ]
  }

  /**
   * Track user action and update achievements
   */
  async trackUserAction(
    userId: string,
    action: string,
    data: Record<string, any>,
  ): Promise<{
    newAchievements: Achievement[]
    updatedAchievements: UserAchievement[]
    levelUp?: boolean
    newLevel?: number
  }> {
    try {
      const relevantAchievements = this.achievements.filter((a) => this.isActionRelevant(action, a))

      const newAchievements: Achievement[] = []
      const updatedAchievements: UserAchievement[] = []
      let levelUp = false
      let newLevel = 0

      // Get current user achievements
      const { data: currentAchievements } = await this.supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", userId)

      const achievementMap = new Map(currentAchievements?.map((a) => [a.achievement_id, a]) || [])

      // Process each relevant achievement
      for (const achievement of relevantAchievements) {
        const userAchievement = achievementMap.get(achievement.id) || {
          user_id: userId,
          achievement_id: achievement.id,
          progress: 0,
          max_progress: achievement.requirements.target || 1,
          is_unlocked: false,
          current_streak: 0,
          best_streak: 0,
          metadata: {},
        }

        const updatedProgress = this.calculateProgress(achievement, userAchievement, action, data)

        if (updatedProgress.hasChanged) {
          // Check if achievement is now unlocked
          if (
            !(userAchievement as any).is_unlocked &&
            this.isAchievementUnlocked(achievement, updatedProgress)
          ) {
            updatedProgress.is_unlocked = true
            updatedProgress.unlocked_at = new Date()
            newAchievements.push(achievement)

            // Emit achievement unlocked event
            await this.eventSystem.publish({
              type: "achievement_unlocked",
              source: "gamification-system",
              data: {
                userId,
                achievementId: achievement.id,
                achievement,
              },
              user_id: userId,
            })
          }

          // Update or insert achievement
          await this.upsertUserAchievement(userId, updatedProgress)
          updatedAchievements.push(updatedProgress as UserAchievement)
        }
      }

      // Check for level up
      const newStats = await this.calculateUserStats(userId)
      const oldLevel = Math.floor(newStats.totalScore / 1000) // Simple leveling: 1000 points per level
      newLevel = Math.floor(newStats.totalScore / 1000)

      if (newLevel > oldLevel) {
        levelUp = true
        await this.eventSystem.publish({
          type: "level_up",
          source: "gamification-system",
          data: {
            userId,
            oldLevel,
            newLevel,
            totalScore: newStats.totalScore,
          },
          user_id: userId,
        })
      }

      logger.info("User achievements tracked", {
        userId,
        action,
        newAchievements: newAchievements.length,
        updatedAchievements: updatedAchievements.length,
        levelUp,
        newLevel,
      })

      return {
        newAchievements,
        updatedAchievements,
        levelUp,
        newLevel: levelUp ? newLevel : undefined,
      }
    } catch (error) {
      logger.error("Failed to track user achievements", { userId, action, error })
      throw new Error("Failed to track achievements")
    }
  }

  /**
   * Get user's current stats and progress
   */
  async getUserStats(userId: string): Promise<UserStats> {
    try {
      return await this.calculateUserStats(userId)
    } catch (error) {
      logger.error("Failed to get user stats", { userId, error })
      throw new Error("Failed to retrieve user stats")
    }
  }

  /**
   * Get global leaderboard
   */
  async getGlobalLeaderboard(limit: number = 100, offset: number = 0): Promise<LeaderboardEntry[]> {
    try {
      const { data: leaderboardData } = await this.supabase.rpc("get_leaderboard", {
        limit_count: limit,
        offset_count: offset,
      })

      return leaderboardData || []
    } catch (error) {
      logger.error("Failed to get leaderboard", { error })
      throw new Error("Failed to retrieve leaderboard")
    }
  }

  /**
   * Get user's social features and activity
   */
  async getUserSocialFeatures(userId: string): Promise<SocialFeatures> {
    try {
      const [userStats, recentActivity] = await Promise.all([
        this.getUserStats(userId),
        this.getUserRecentActivity(userId),
      ])

      return {
        userId,
        following: [], // Implement following system
        followers: [], // Implement followers system
        recentActivity,
        shareableStats: {
          totalScore: userStats.totalScore,
          rank: userStats.globalRank,
          recentAchievements: userStats.achievements
            .filter(
              (a) =>
                a.isUnlocked &&
                a.unlockedAt &&
                new Date().getTime() - a.unlockedAt.getTime() < 7 * 24 * 60 * 60 * 1000,
            )
            .map((ua) => this.achievements.find((a) => a.id === ua.achievementId)!)
            .filter(Boolean),
        },
      }
    } catch (error) {
      logger.error("Failed to get user social features", { userId, error })
      throw new Error("Failed to retrieve social features")
    }
  }

  // Private helper methods

  private isActionRelevant(action: string, achievement: Achievement): boolean {
    const actionMappings: Record<string, string[]> = {
      booking_created: ["milestone", "savings", "exploration", "streak"],
      experience_completed: ["milestone", "speed", "exploration"],
      city_visited: ["exploration"],
      streak_updated: ["streak"],
      secret_unlocked: ["secret"],
      savings_achieved: ["savings"],
    }

    return actionMappings[action]?.includes(achievement.category) || false
  }

  private calculateProgress(
    achievement: Achievement,
    userAchievement: any,
    action: string,
    data: Record<string, any>,
  ): any & { hasChanged: boolean } {
    let hasChanged = false
    const result = { ...userAchievement, hasChanged }

    switch (achievement.type) {
      case "counter":
        if (action === "booking_created" && achievement.category === "milestone") {
          result.progress = (result.progress || 0) + 1
          hasChanged = true
        }
        break

      case "threshold":
        if (action === "savings_achieved" && achievement.category === "savings") {
          const savingsAmount = data.savingsAmount || 0
          if (savingsAmount >= achievement.requirements.target!) {
            result.progress = achievement.requirements.target!
            hasChanged = true
          }
        }
        break

      case "streak":
        if (action === "streak_updated" && achievement.category === "streak") {
          const streakDays = data.streakDays || 0
          result.current_streak = streakDays
          result.best_streak = Math.max(result.best_streak || 0, streakDays)
          result.progress = streakDays
          hasChanged = true
        }
        break

      case "boolean":
        if (!result.is_unlocked && this.checkBooleanCondition(achievement, data)) {
          result.progress = 1
          hasChanged = true
        }
        break
    }

    result.hasChanged = hasChanged
    return result
  }

  private checkBooleanCondition(achievement: Achievement, data: Record<string, any>): boolean {
    // Implement specific boolean conditions based on achievement ID
    switch (achievement.id) {
      case "first_layover":
        return data.experienceCompleted === true
      case "secret_finder":
        return data.secretUnlocked === true
      default:
        return false
    }
  }

  private isAchievementUnlocked(achievement: Achievement, userAchievement: any): boolean {
    switch (achievement.type) {
      case "counter":
      case "threshold":
        return userAchievement.progress >= achievement.requirements.target!
      case "streak":
        return userAchievement.current_streak >= achievement.requirements.target!
      case "boolean":
        return userAchievement.progress >= 1
      default:
        return false
    }
  }

  private async upsertUserAchievement(userId: string, achievement: any): Promise<void> {
    const { error } = await this.supabase.from("user_achievements").upsert({
      user_id: userId,
      achievement_id: achievement.achievement_id,
      progress: achievement.progress,
      max_progress: achievement.max_progress,
      is_unlocked: achievement.is_unlocked,
      unlocked_at: achievement.unlocked_at?.toISOString(),
      current_streak: achievement.current_streak,
      best_streak: achievement.best_streak,
      metadata: achievement.metadata,
    })

    if (error) throw error
  }

  private async calculateUserStats(userId: string): Promise<UserStats> {
    // Get user achievements
    const { data: achievements } = await this.supabase
      .from("user_achievements")
      .select("*")
      .eq("user_id", userId)

    const totalScore =
      achievements?.reduce((sum, a) => {
        if (a.is_unlocked) {
          const achievement = this.achievements.find((ach) => ach.id === a.achievement_id)
          return sum + (achievement?.points || 0)
        }
        return sum
      }, 0) || 0

    // Calculate global rank (simplified)
    const { count: betterUsers } = await this.supabase
      .from("user_achievements")
      .select("user_id", { count: "exact" })
      .neq("user_id", userId)
    // Add logic to compare total scores

    const level = Math.floor(totalScore / 1000)
    const nextLevelPoints = (level + 1) * 1000 - totalScore

    return {
      userId,
      totalScore,
      globalRank: (betterUsers || 0) + 1,
      currentStreak: 0, // Calculate from streak achievements
      bestStreak: 0, // Calculate from streak achievements
      totalSavings: 0, // Calculate from booking data
      citiesVisited: 0, // Calculate from exploration achievements
      experiencesCompleted: 0, // Calculate from milestone achievements
      secretsUnlocked:
        achievements?.filter(
          (a) =>
            a.is_unlocked &&
            this.achievements.find((ach) => ach.id === a.achievement_id)?.category === "secret",
        ).length || 0,
      achievements:
        achievements?.map((a) => ({
          ...a,
          userId: a.user_id,
          achievementId: a.achievement_id,
          isUnlocked: a.is_unlocked,
          unlockedAt: a.unlocked_at ? new Date(a.unlocked_at) : undefined,
          currentStreak: a.current_streak,
          bestStreak: a.best_streak,
        })) || [],
      level,
      nextLevelPoints,
      badges:
        achievements
          ?.filter((a) => a.is_unlocked)
          .map((a) => this.achievements.find((ach) => ach.id === a.achievement_id)?.rewards.badge)
          .filter(Boolean) || [],
      title: undefined, // Determine from highest title achievement
    }
  }

  private async getUserRecentActivity(userId: string): Promise<SocialFeatures["recentActivity"]> {
    // Get recent achievement unlocks and other activities
    const { data: recentAchievements } = await this.supabase
      .from("user_achievements")
      .select("achievement_id, unlocked_at")
      .eq("user_id", userId)
      .not("unlocked_at", "is", null)
      .gte("unlocked_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("unlocked_at", { ascending: false })

    return (
      recentAchievements?.map((a) => ({
        type: "achievement_unlocked" as const,
        data: {
          achievementId: a.achievement_id,
          achievement: this.achievements.find((ach) => ach.id === a.achievement_id),
        },
        timestamp: new Date(a.unlocked_at),
      })) || []
    )
  }
}
