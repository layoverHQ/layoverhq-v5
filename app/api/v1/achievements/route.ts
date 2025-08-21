/**
 * User Achievements API
 * Provides achievement tracking and gamification features
 */

import { NextRequest, NextResponse } from "next/server"
import { AdvancedGamificationSystem } from "@/lib/services/advanced-gamification-system"
import { logger } from "@/lib/logger"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const category = searchParams.get("category")
    const includeStats = searchParams.get("includeStats") === "true"

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Validate user access
    const supabase = await createClient()
    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found or access denied" }, { status: 404 })
    }

    const gamificationSystem = new AdvancedGamificationSystem()

    // Get user stats and achievements
    const [userStats, socialFeatures] = await Promise.all([
      gamificationSystem.getUserStats(userId),
      includeStats ? gamificationSystem.getUserSocialFeatures(userId) : null,
    ])

    // Filter achievements by category if specified
    let achievements = userStats.achievements
    if (category) {
      const categoryAchievements = await gamificationSystem["achievements"]
        .filter((a) => a.category === category)
        .map((a) => a.id)

      achievements = achievements.filter((ua) => categoryAchievements.includes(ua.achievementId))
    }

    const response = {
      success: true,
      data: {
        user: {
          id: userId,
          totalScore: userStats.totalScore,
          globalRank: userStats.globalRank,
          level: userStats.level,
          nextLevelPoints: userStats.nextLevelPoints,
          currentStreak: userStats.currentStreak,
          badges: userStats.badges,
          title: userStats.title,
        },
        achievements,
        categories: {
          milestone: achievements.filter((a) =>
            gamificationSystem["achievements"].find(
              (ach) => ach.id === a.achievementId && ach.category === "milestone",
            ),
          ).length,
          savings: achievements.filter((a) =>
            gamificationSystem["achievements"].find(
              (ach) => ach.id === a.achievementId && ach.category === "savings",
            ),
          ).length,
          speed: achievements.filter((a) =>
            gamificationSystem["achievements"].find(
              (ach) => ach.id === a.achievementId && ach.category === "speed",
            ),
          ).length,
          exploration: achievements.filter((a) =>
            gamificationSystem["achievements"].find(
              (ach) => ach.id === a.achievementId && ach.category === "exploration",
            ),
          ).length,
          secret: achievements.filter((a) =>
            gamificationSystem["achievements"].find(
              (ach) => ach.id === a.achievementId && ach.category === "secret",
            ),
          ).length,
          streak: achievements.filter((a) =>
            gamificationSystem["achievements"].find(
              (ach) => ach.id === a.achievementId && ach.category === "streak",
            ),
          ).length,
        },
        social: socialFeatures,
        lastUpdated: new Date().toISOString(),
      },
    }

    logger.info("User achievements retrieved", {
      userId,
      totalScore: userStats.totalScore,
      achievementCount: achievements.length,
      category: category || "all",
    })

    return NextResponse.json(response)
  } catch (error) {
    logger.error("Failed to get user achievements", {
      error: error instanceof Error ? error.message : "Unknown error",
    })

    return NextResponse.json(
      {
        error: "Failed to retrieve achievements",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, action, data } = body

    if (!userId || !action) {
      return NextResponse.json({ error: "User ID and action are required" }, { status: 400 })
    }

    // Validate user access
    const supabase = await createClient()
    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found or access denied" }, { status: 404 })
    }

    const gamificationSystem = new AdvancedGamificationSystem()

    // Track user action and update achievements
    const result = await gamificationSystem.trackUserAction(userId, action, data || {})

    const response = {
      success: true,
      data: {
        newAchievements: result.newAchievements,
        updatedAchievements: result.updatedAchievements,
        levelUp: result.levelUp,
        newLevel: result.newLevel,
        message:
          result.newAchievements.length > 0
            ? `Congratulations! You unlocked ${result.newAchievements.length} new achievement${result.newAchievements.length > 1 ? "s" : ""}!`
            : "Progress updated!",
      },
    }

    // Log significant events
    if (result.newAchievements.length > 0) {
      logger.info("New achievements unlocked", {
        userId,
        action,
        achievements: result.newAchievements.map((a) => a.id),
        levelUp: result.levelUp,
      })
    }

    return NextResponse.json(response)
  } catch (error) {
    logger.error("Failed to track user action", {
      error: error instanceof Error ? error.message : "Unknown error",
    })

    return NextResponse.json(
      {
        error: "Failed to track user action",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
