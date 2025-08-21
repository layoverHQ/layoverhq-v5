import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Create user API called")

    const body = await request.json()
    const { email, password, firstName, lastName, role, department } = body

    console.log("[v0] Creating user with email:", email)

    const supabase = createServiceRoleClient()

    const { data: existingAuthUsers } = await supabase.auth.admin.listUsers()
    const existingAuthUser = existingAuthUsers?.users?.find((user: any) => user.email === email)

    if (existingAuthUser) {
      console.log("[v0] User exists in Auth, checking for profile...")

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", existingAuthUser.id)
        .single()

      if (existingProfile) {
        console.log("[v0] User already has complete profile")
        return NextResponse.json(
          {
            error:
              "A user with this email already exists with a complete profile. Please use a different email address.",
            code: "USER_EXISTS",
          },
          { status: 409 },
        )
      }

      // User exists in Auth but no profile - create profile only
      console.log("[v0] Creating profile for existing Auth user...")
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: existingAuthUser.id,
          email: email,
          first_name: firstName,
          last_name: lastName,
          display_name: `${firstName} ${lastName}`,
          role: role,
          department: department,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (profileError) {
        console.log("[v0] Profile creation error:", profileError.message)
        return NextResponse.json({ error: profileError.message }, { status: 400 })
      }

      console.log("[v0] Profile created for existing Auth user")
      return NextResponse.json({
        success: true,
        user: {
          id: existingAuthUser.id,
          email: existingAuthUser.email,
          ...profileData,
        },
      })
    }

    console.log("[v0] Creating new Auth user...")
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: `${firstName} ${lastName}`,
        role: role,
      },
    })

    if (authError) {
      console.log("[v0] Auth creation error:", authError.message)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    console.log("[v0] User created in Auth, creating profile...")

    // Create profile in profiles table
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: authData.user.id,
        email: email,
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`,
        role: role,
        department: department,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (profileError) {
      console.log("[v0] Profile creation error:", profileError.message)
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    console.log("[v0] User and profile created successfully")

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        ...profileData,
      },
    })
  } catch (error: any) {
    console.log("[v0] Create user API error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
