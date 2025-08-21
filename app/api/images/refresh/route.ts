import { NextRequest, NextResponse } from "next/server"
import { dynamicImageService } from "@/lib/images/dynamic-image-service"

/**
 * API endpoint to manually refresh old images
 * Can be called via cron job or admin panel
 */
export async function POST(request: NextRequest) {
  try {
    // Check for API key in headers for security
    const apiKey = request.headers.get("x-api-key")
    const expectedKey = process.env.IMAGE_REFRESH_API_KEY || "your-secret-key"

    if (apiKey !== expectedKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get parameters from request body
    const body = await request.json().catch(() => ({}))
    const { daysOld = 30, cities } = body

    // Get current cache stats before refresh
    const statsBefore = dynamicImageService.getCacheStats()

    if (cities && Array.isArray(cities)) {
      // Refresh specific cities
      await Promise.all(
        cities.map((city) => dynamicImageService.getCityImage(city, { forceRefresh: true })),
      )
    } else {
      // Refresh all old images
      await dynamicImageService.refreshOldImages(daysOld)
    }

    // Get stats after refresh
    const statsAfter = dynamicImageService.getCacheStats()

    return NextResponse.json({
      success: true,
      message: `Images refreshed successfully`,
      stats: {
        before: statsBefore,
        after: statsAfter,
        refreshed: statsAfter.totalImages - statsBefore.expiredCount,
      },
    })
  } catch (error) {
    console.error("Error refreshing images:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to refresh images",
      },
      { status: 500 },
    )
  }
}

/**
 * Get cache statistics
 */
export async function GET(request: NextRequest) {
  try {
    const stats = dynamicImageService.getCacheStats()

    return NextResponse.json({
      success: true,
      stats,
      cacheInfo: {
        totalImages: stats.totalImages,
        expiredImages: stats.expiredCount,
        oldestImageAge: stats.oldestImage
          ? Math.floor((Date.now() - stats.oldestImage) / (1000 * 60 * 60 * 24)) + " days"
          : "N/A",
        averageAge: Math.floor(stats.averageAge / (1000 * 60 * 60 * 24)) + " days",
        recommendedRefresh: stats.expiredCount > 0,
      },
    })
  } catch (error) {
    console.error("Error getting cache stats:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get cache statistics",
      },
      { status: 500 },
    )
  }
}
