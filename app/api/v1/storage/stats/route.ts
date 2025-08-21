import { type NextRequest, NextResponse } from "next/server"
import { fileStorage } from "@/lib/file-storage"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("user_id", user.id)
      .single()

    const isAdmin = profile?.role === "admin" || profile?.role === "super_admin"

    if (!isAdmin) {
      // Return user's own storage stats
      const { data: quota } = await supabase
        .from("storage_quotas")
        .select("*")
        .eq("user_id", user.id)
        .single()

      return NextResponse.json({
        success: true,
        userStats: quota || {
          used_storage_bytes: 0,
          max_storage_bytes: 1073741824,
          used_files: 0,
          max_files: 1000,
        },
      })
    }

    // Admin: return system-wide stats
    const storageStats = await fileStorage.getStorageStats()

    // Get top users by storage usage
    const { data: topUsers } = await supabase
      .from("storage_quotas")
      .select(
        `
        user_id,
        used_storage_bytes,
        used_files,
        user_profiles!inner(email, full_name)
      `,
      )
      .order("used_storage_bytes", { ascending: false })
      .limit(10)

    // Get recent file activity
    const { data: recentActivity } = await supabase
      .from("file_access_logs")
      .select(
        `
        action,
        created_at,
        user_profiles!inner(email, full_name)
      `,
      )
      .order("created_at", { ascending: false })
      .limit(20)

    return NextResponse.json({
      success: true,
      systemStats: storageStats,
      topUsers,
      recentActivity,
    })
  } catch (error) {
    console.error("Storage stats error:", error)
    return NextResponse.json({ error: "Failed to get storage stats" }, { status: 500 })
  }
}
