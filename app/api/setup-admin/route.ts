import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Starting admin user setup...")
    console.log("[v0] Environment check - SUPABASE_URL:", !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log(
      "[v0] Environment check - SERVICE_ROLE_KEY:",
      !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    )

    const supabase = createServiceRoleClient()

    console.log("[v0] Testing service role client connection...")
    const { data: testData, error: testError } = await supabase.auth.admin.listUsers()
    if (testError) {
      console.error("[v0] Service role client test failed:", testError)
      return NextResponse.json(
        {
          success: false,
          error: "Service role client connection failed: " + testError.message,
        },
        { status: 500 },
      )
    }
    console.log(
      "[v0] Service role client working, found",
      testData?.users?.length || 0,
      "existing users",
    )

    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const adminExists = existingUsers?.users?.find(
      (user: any) => user.email === "admin@layoverhq.com",
    )
    const managerExists = existingUsers?.users?.find(
      (user: any) => user.email === "manager@layoverhq.com",
    )

    let adminUserId = adminExists?.id
    let managerUserId = managerExists?.id

    if (!adminExists) {
      console.log("[v0] Creating admin user...")
      const { data: adminAuth, error: adminError } = await supabase.auth.admin.createUser({
        email: "admin@layoverhq.com",
        password: "LayoverHQ2024!",
        email_confirm: true,
        user_metadata: {
          role: "admin",
        },
      })

      if (adminError) {
        console.error("[v0] Admin creation error:", adminError)
        return NextResponse.json(
          {
            success: false,
            error: "Failed to create admin user: " + adminError.message,
          },
          { status: 500 },
        )
      } else {
        console.log("[v0] Admin user created successfully:", adminAuth.user?.id)
        adminUserId = adminAuth.user?.id
      }
    } else {
      console.log("[v0] Admin user already exists:", adminExists.id)
    }

    if (!managerExists) {
      console.log("[v0] Creating manager user...")
      const { data: managerAuth, error: managerError } = await supabase.auth.admin.createUser({
        email: "manager@layoverhq.com",
        password: "Manager2024!",
        email_confirm: true,
        user_metadata: {
          role: "manager",
        },
      })

      if (managerError) {
        console.error("[v0] Manager creation error:", managerError)
        return NextResponse.json(
          {
            success: false,
            error: "Failed to create manager user: " + managerError.message,
          },
          { status: 500 },
        )
      } else {
        console.log("[v0] Manager user created successfully:", managerAuth.user?.id)
        managerUserId = managerAuth.user?.id
      }
    } else {
      console.log("[v0] Manager user already exists:", managerExists.id)
    }

    if (adminUserId) {
      console.log("[v0] Creating/updating admin profile...")
      const { error: adminProfileError } = await supabase.from("profiles").upsert(
        {
          id: adminUserId,
          email: "admin@layoverhq.com",
          first_name: "LayoverHQ",
          last_name: "Admin",
          display_name: "LayoverHQ Admin",
          role: "admin",
          department: "Administration",
          is_active: true,
        },
        {
          onConflict: "id",
        },
      )

      if (adminProfileError) {
        console.error("[v0] Admin profile creation error:", adminProfileError)
        return NextResponse.json(
          {
            success: false,
            error: "Failed to create admin profile: " + adminProfileError.message,
          },
          { status: 500 },
        )
      } else {
        console.log("[v0] Admin profile created/updated successfully")
      }
    }

    if (managerUserId) {
      console.log("[v0] Creating/updating manager profile...")
      const { error: managerProfileError } = await supabase.from("profiles").upsert(
        {
          id: managerUserId,
          email: "manager@layoverhq.com",
          first_name: "LayoverHQ",
          last_name: "Manager",
          display_name: "LayoverHQ Manager",
          role: "manager",
          department: "Operations",
          is_active: true,
        },
        {
          onConflict: "id",
        },
      )

      if (managerProfileError) {
        console.error("[v0] Manager profile creation error:", managerProfileError)
        return NextResponse.json(
          {
            success: false,
            error: "Failed to create manager profile: " + managerProfileError.message,
          },
          { status: 500 },
        )
      } else {
        console.log("[v0] Manager profile created/updated successfully")
      }
    }

    console.log("[v0] Admin setup completed successfully")

    return NextResponse.json({
      success: true,
      message: "Admin users created successfully",
      credentials: {
        admin: { email: "admin@layoverhq.com", password: "LayoverHQ2024!" },
        manager: { email: "manager@layoverhq.com", password: "Manager2024!" },
      },
    })
  } catch (error) {
    console.error("[v0] Setup error:", error)
    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to setup admin users: " +
          (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 },
    )
  }
}
