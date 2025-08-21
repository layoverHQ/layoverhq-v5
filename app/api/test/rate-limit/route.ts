import { ratelimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const identifier = request.ip ?? "anonymous"
    const { success, limit, reset, remaining } = await ratelimit.api.limit(identifier)

    logger.info("Rate limit test", {
      identifier,
      success,
      limit,
      reset,
      remaining,
      timestamp: new Date().toISOString(),
    })

    if (!success) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          limit,
          reset,
          remaining: 0,
        },
        { status: 429 },
      )
    }

    return NextResponse.json({
      message: "Rate limit test successful",
      limit,
      reset,
      remaining,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error("Rate limit test failed", { error })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
