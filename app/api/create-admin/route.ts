import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = await createClient()

    const { data: adminUser, error: adminError } = await (supabase as any).auth.admin.createUser({
      email: "admin@layoverhq.com",
      password: "LayoverHQ2024!",
      email_confirm: true,
    })

    if (adminError) {
      console.error("Admin creation error:", adminError)
      return NextResponse.json({ error: adminError.message }, { status: 400 })
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: adminUser.user.id,
      email: "admin@layoverhq.com",
      first_name: "Admin",
      last_name: "User",
      display_name: "Admin User",
      role: "admin",
      department: "IT",
      is_active: true,
    })

    if (profileError) {
      console.error("Profile creation error:", profileError)
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Admin user created successfully",
      credentials: {
        email: "admin@layoverhq.com",
        password: "LayoverHQ2024!",
      },
    })
  } catch (error) {
    console.error("Setup error:", error)
    return NextResponse.json({ error: "Failed to create admin user" }, { status: 500 })
  }
}
