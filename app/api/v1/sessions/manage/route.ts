import { type NextRequest, NextResponse } from "next/server"
import { ApiGateway } from "@/lib/api-gateway"
import { sessionManager } from "@/lib/session-manager"

const gateway = new ApiGateway({
  requireAuth: true,
  requiredRoles: ["admin", "manager"],
  rateLimit: { windowMs: 60000, maxRequests: 50 },
})

export async function GET(request: NextRequest) {
  return gateway.middleware(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url)
      const userId = searchParams.get("userId")
      const action = searchParams.get("action")

      if (action === "stats") {
        const stats = await sessionManager.getSessionStats()
        return NextResponse.json({
          success: true,
          data: stats,
        })
      }

      if (userId) {
        const sessions = await sessionManager.getUserSessions(userId)
        return NextResponse.json({
          success: true,
          data: sessions,
        })
      }

      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    } catch (error) {
      console.error("Session management error:", error)
      return NextResponse.json({ error: "Failed to manage sessions" }, { status: 500 })
    }
  })
}

export async function DELETE(request: NextRequest) {
  return gateway.middleware(request, async (req) => {
    try {
      const { sessionId, userId, action } = await req.json()

      if (action === "cleanup") {
        const cleaned = await sessionManager.cleanupExpiredSessions()
        return NextResponse.json({
          success: true,
          data: { cleanedSessions: cleaned },
        })
      }

      if (sessionId) {
        const success = await sessionManager.destroySession(sessionId)
        return NextResponse.json({
          success,
          message: success ? "Session destroyed" : "Failed to destroy session",
        })
      }

      if (userId) {
        const success = await sessionManager.destroyUserSessions(userId)
        return NextResponse.json({
          success,
          message: success ? "All user sessions destroyed" : "Failed to destroy user sessions",
        })
      }

      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    } catch (error) {
      console.error("Session destruction error:", error)
      return NextResponse.json({ error: "Failed to destroy sessions" }, { status: 500 })
    }
  })
}
