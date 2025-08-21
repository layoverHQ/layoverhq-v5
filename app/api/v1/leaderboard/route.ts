/**
 * Global Leaderboard API
 * Provides ranking and social features for gamification
 */

import { NextRequest, NextResponse } from "next/server"
import { AdvancedGamificationSystem } from "@/lib/services/advanced-gamification-system"
import { logger } from "@/lib/logger"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")
    const type = searchParams.get("type") || "global" // global, weekly, friends
    const userId = searchParams.get("userId")

    if (limit > 100) {
      return NextResponse.json({ error: "Limit cannot exceed 100" }, { status: 400 })
    }

    const gamificationSystem = new AdvancedGamificationSystem()
    const supabase = await createClient()

    let leaderboard
    let userRank = null
    let userStats = null

    switch (type) {
      case "global":
        leaderboard = await gamificationSystem.getGlobalLeaderboard(limit, offset)
        break

      case "weekly":
        // Get weekly leaderboard (achievements unlocked this week)
        const weekStart = new Date()
        weekStart.setDate(weekStart.getDate() - 7)

        const { data: weeklyData } = await supabase.rpc("get_weekly_leaderboard", {
          week_start: weekStart.toISOString(),
          limit_count: limit,
          offset_count: offset,
        })

        leaderboard = weeklyData || []
        break

      case "friends":
        if (!userId) {
          return NextResponse.json(
            { error: "User ID required for friends leaderboard" },
            { status: 400 },
          )
        }

        // Get friends leaderboard (implement friends system)
        const { data: friendsData } = await supabase.rpc("get_friends_leaderboard", {
          user_id: userId,
          limit_count: limit,
          offset_count: offset,
        })

        leaderboard = friendsData || []
        break

      default:
        return NextResponse.json({ error: "Invalid leaderboard type" }, { status: 400 })
    }

    // Get user's position if userId provided
    if (userId) {
      try {
        userStats = await gamificationSystem.getUserStats(userId)
        userRank = userStats.globalRank

        // If user is not in current page, get their position
        const userInResults = leaderboard.find((entry) => entry.userId === userId)
        if (!userInResults && userRank > offset + limit) {
          // Get user's entry separately
          const { data: userEntry } = await supabase
            .from("profiles")
            .select(
              `
              id,
              display_name,
              username,
              avatar_url
            `,
            )
            .eq("id", userId)
            .single()

          if (userEntry) {
            const userLeaderboardEntry = {
              userId: userEntry.id,
              username: userEntry.username || userEntry.display_name || "Anonymous",
              displayName: userEntry.display_name || userEntry.username || "Anonymous",
              totalScore: userStats.totalScore,
              rank: userRank,
              currentStreak: userStats.currentStreak,
              achievementCount: userStats.achievements.filter((a) => a.isUnlocked).length,
              avatar: userEntry.avatar_url,
              title: userStats.title,
              badge: userStats.badges[0], // Show primary badge
            }

            // Add user entry at the end if they're not in top results
            leaderboard = [...leaderboard, userLeaderboardEntry]
          }
        }
      } catch (error) {
        logger.warn("Could not get user stats for leaderboard", { userId, error })
      }
    }

    // Get leaderboard statistics
    const { data: totalUsers } = await supabase
      .from("user_achievements")
      .select("user_id", { count: "exact", head: true })

    const { data: topScores } = await supabase.rpc("get_leaderboard_stats")

    const response = {
      success: true,
      data: {
        leaderboard,
        pagination: {
          limit,
          offset,
          total: totalUsers?.length || 0,
          hasMore: offset + limit < (totalUsers?.length || 0),
        },
        stats: {
          totalUsers: totalUsers?.length || 0,
          averageScore: topScores?.avg_score || 0,
          topScore: topScores?.max_score || 0,
          type,
        },
        user: userId
          ? {
              rank: userRank,
              stats: userStats
                ? {
                    totalScore: userStats.totalScore,
                    level: userStats.level,
                    achievementCount: userStats.achievements.filter((a) => a.isUnlocked).length,
                    currentStreak: userStats.currentStreak,
                  }
                : null,
            }
          : null,
        lastUpdated: new Date().toISOString(),
      },
    }

    logger.info("Leaderboard retrieved", {
      type,
      limit,
      offset,
      resultsCount: leaderboard.length,
      userId: userId || "anonymous",
    })

    // Set cache headers
    const cacheResponse = NextResponse.json(response)
    cacheResponse.headers.set("Cache-Control", "public, max-age=300") // 5 minutes cache

    return cacheResponse
  } catch (error) {
    logger.error("Failed to get leaderboard", {
      error: error instanceof Error ? error.message : "Unknown error",
    })

    return NextResponse.json(
      {
        error: "Failed to retrieve leaderboard",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
