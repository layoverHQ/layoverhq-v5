import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function PUT(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const body = await request.json()
    const { userId } = params

    const supabase = createServiceRoleClient()

    // Update profile with the form data
    const { data: profile, error } = await supabase
      .from("profiles")
      .update({
        first_name: body.firstName,
        last_name: body.lastName,
        display_name: body.displayName,
        role: body.role,
        department: body.department,
        phone: body.phone,
        timezone: body.timezone,
        is_active: body.isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      console.error("Error updating user:", error)
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
    }

    // Log audit trail
    await supabase.from("audit_logs").insert({
      user_id: userId,
      action: "update",
      resource_type: "user",
      resource_id: userId,
      new_values: body,
    })

    return NextResponse.json({
      message: "User updated successfully",
      user: profile,
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const body = await request.json()
    const { userId } = params

    const supabase = createServiceRoleClient()

    // Update profile
    const { data: profile, error } = await supabase
      .from("profiles")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      console.error("Error updating user:", error)
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
    }

    return NextResponse.json({
      message: "User updated successfully",
      user: profile,
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params
    const supabase = createServiceRoleClient()

    // Delete user from auth (this will cascade to profile due to foreign key)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)

    if (authError) {
      console.error("Error deleting user:", authError)
      return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
    }

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
