import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    // Get all users from Supabase Auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error("Error fetching auth users:", authError)
      return NextResponse.json({ error: "Failed to fetch auth users" }, { status: 500 })
    }

    // Get all existing profiles
    const { data: existingProfiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id")

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError)
      return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 })
    }

    const existingProfileIds = new Set(existingProfiles?.map((p: any) => p.id) || [])
    const usersToSync =
      authUsers?.users?.filter((user: any) => !existingProfileIds.has(user.id)) || []

    console.log(
      `[v0] Found ${authUsers?.users?.length || 0} auth users, ${existingProfiles?.length || 0} profiles, ${usersToSync.length} to sync`,
    )

    if (usersToSync.length === 0) {
      return NextResponse.json({
        message: "All auth users already have profiles",
        synced: 0,
        total: authUsers.users.length,
      })
    }

    // Create profile records for users without them
    const profilesToCreate = usersToSync.map((user) => ({
      id: user.id,
      email: user.email || "",
      first_name: user.user_metadata?.first_name || user.email?.split("@")[0] || "User",
      last_name: user.user_metadata?.last_name || "",
      display_name:
        user.user_metadata?.display_name ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "User",
      role: user.user_metadata?.role || "user",
      department: user.user_metadata?.department || "",
      phone: user.user_metadata?.phone || user.phone || "",
      timezone: "UTC",
      is_active: true,
      last_login_at: user.last_sign_in_at || null,
      created_at: user.created_at,
      updated_at: new Date().toISOString(),
    }))

    const { data: createdProfiles, error: createError } = await supabase
      .from("profiles")
      .insert(profilesToCreate)
      .select()

    if (createError) {
      console.error("Error creating profiles:", createError)
      return NextResponse.json({ error: "Failed to create profiles" }, { status: 500 })
    }

    // Log the sync operation
    await supabase.from("audit_logs").insert({
      user_id: null,
      action: "sync_auth_users",
      resource_type: "user",
      resource_id: "bulk",
      new_values: { synced_count: usersToSync.length },
    })

    console.log(`[v0] Successfully synced ${usersToSync.length} users`)

    return NextResponse.json({
      message: `Successfully synced ${usersToSync.length} users`,
      synced: usersToSync.length,
      total: authUsers.users.length,
      profiles: createdProfiles,
    })
  } catch (error: any) {
    console.error("Sync error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
