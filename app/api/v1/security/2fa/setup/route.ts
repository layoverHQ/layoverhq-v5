import { type NextRequest, NextResponse } from "next/server"
import { TwoFactorAuth } from "@/lib/security/two-factor-auth"
import { AuthGuard } from "@/lib/security/auth-guard"
import { AuditLogger } from "@/lib/security/audit-logger"

export async function POST(request: NextRequest) {
  try {
    const authGuard = new AuthGuard(request)
    const context = await authGuard.validateSession()

    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const twoFA = new TwoFactorAuth()
    const setup = await twoFA.setupTwoFactor(context.user.id)

    await AuditLogger.logUserAction(context.user.id, "2fa_setup_initiated", {
      resourceType: "security",
      metadata: { userId: context.user.id },
    })

    return NextResponse.json({
      secret: setup.secret,
      qrCode: setup.qrCode,
      backupCodes: setup.backupCodes,
    })
  } catch (error) {
    console.error("2FA setup error:", error)
    return NextResponse.json({ error: "Failed to setup 2FA" }, { status: 500 })
  }
}
