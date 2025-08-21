import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { action, userIds } = await request.json()
    const supabase = createServiceRoleClient()

    console.log(`[v0] Bulk ${action} for users:`, userIds)

    switch (action) {
      case "activate":
        await supabase.from("profiles").update({ is_active: true }).in("id", userIds)
        break

      case "deactivate":
        await supabase.from("profiles").update({ is_active: false }).in("id", userIds)
        break

      case "delete":
        // Delete from profiles first, then auth
        await supabase.from("profiles").delete().in("id", userIds)

        for (const userId of userIds) {
          await supabase.auth.admin.deleteUser(userId)
        }
        break
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Bulk operation error:", error)
    return NextResponse.json({ error: "Bulk operation failed" }, { status: 500 })
  }
}
