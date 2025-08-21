import { createServiceRoleClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    console.log("[v0] Starting admin role fix...")

    const supabase = createServiceRoleClient()

    // Update admin user profile
    const { data: adminUpdate, error: adminError } = await supabase
      .from("profiles")
      .update({
        role: "admin",
        first_name: "Admin",
        last_name: "User",
        display_name: "Admin User",
        department: "Administration",
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("email", "admin@layoverhq.com")
      .select()

    if (adminError) {
      console.error("[v0] Admin update error:", adminError)
      return NextResponse.json(
        { error: "Failed to update admin profile", details: adminError },
        { status: 500 },
      )
    }

    console.log("[v0] Admin profile updated:", adminUpdate)

    // Update manager user profile
    const { data: managerUpdate, error: managerError } = await supabase
      .from("profiles")
      .update({
        role: "manager",
        first_name: "Manager",
        last_name: "User",
        display_name: "Manager User",
        department: "Management",
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("email", "manager@layoverhq.com")
      .select()

    if (managerError) {
      console.error("[v0] Manager update error:", managerError)
      return NextResponse.json(
        { error: "Failed to update manager profile", details: managerError },
        { status: 500 },
      )
    }

    console.log("[v0] Manager profile updated:", managerUpdate)

    // Verify the updates
    const { data: profiles, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .in("email", ["admin@layoverhq.com", "manager@layoverhq.com"])

    if (fetchError) {
      console.error("[v0] Fetch error:", fetchError)
      return NextResponse.json(
        { error: "Failed to verify updates", details: fetchError },
        { status: 500 },
      )
    }

    console.log("[v0] Updated profiles:", profiles)

    return NextResponse.json({
      success: true,
      message: "Admin roles updated successfully",
      profiles: profiles,
    })
  } catch (error) {
    console.error("[v0] Fix admin roles error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
