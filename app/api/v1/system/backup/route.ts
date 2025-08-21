import { type NextRequest, NextResponse } from "next/server"
import { backupSystem } from "@/lib/backup-system"
import { getProductionConfig } from "@/lib/production-config"

export async function POST(request: NextRequest) {
  try {
    const config = getProductionConfig()

    if (config.environment === "production") {
      // In production, verify admin authentication
      const authHeader = request.headers.get("authorization")
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const { action } = await request.json()

    switch (action) {
      case "create":
        const result = await backupSystem.createDatabaseBackup()
        return NextResponse.json(result)

      case "restore":
        const { backupId } = await request.json()
        const restoreResult = await backupSystem.restoreFromBackup(backupId)
        return NextResponse.json(restoreResult)

      case "cleanup":
        await backupSystem.cleanupOldBackups()
        return NextResponse.json({ success: true })

      case "status":
        const backups = await backupSystem.getBackupStatus()
        return NextResponse.json({ backups })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Backup API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const backups = await backupSystem.getBackupStatus()
    return NextResponse.json({ backups })
  } catch (error) {
    console.error("Backup status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
