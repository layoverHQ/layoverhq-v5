import { type NextRequest, NextResponse } from "next/server"
import { IPWhitelistManager } from "@/lib/security/ip-whitelist"
import { AuthGuard } from "@/lib/security/auth-guard"
import { AuditLogger } from "@/lib/security/audit-logger"

export async function GET(request: NextRequest) {
  try {
    const authGuard = new AuthGuard(request)
    const context = await authGuard.validateSession()

    if (!context || !authGuard.hasPermission(context, "security-settings")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const ipManager = new IPWhitelistManager()
    const ips = await ipManager.listIPs()

    return NextResponse.json({ ips })
  } catch (error) {
    console.error("Get IP whitelist error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authGuard = new AuthGuard(request)
    const context = await authGuard.validateSession()

    if (!context || !authGuard.hasPermission(context, "security-settings")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { ipAddress, description } = await request.json()

    if (!ipAddress) {
      return NextResponse.json({ error: "IP address is required" }, { status: 400 })
    }

    const ipManager = new IPWhitelistManager()
    const success = await ipManager.addIP(ipAddress, description || "", context.user.id)

    if (success) {
      await AuditLogger.logAdminAction(context.user.id, "add_ip_whitelist", "security", ipAddress, {
        new: { ipAddress, description },
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Failed to add IP to whitelist" }, { status: 500 })
  } catch (error) {
    console.error("Add IP whitelist error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
