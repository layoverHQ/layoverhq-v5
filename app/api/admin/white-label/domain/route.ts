import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { WhiteLabelManager } from "@/lib/services/white-label-manager"
import { adminAuth } from "@/lib/admin-auth"

export async function POST(request: NextRequest) {
  try {
    // Authenticate admin user
    const user = await adminAuth.getCurrentUser()
    if (!user || !adminAuth.hasPermission(user, "manage-white-label")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { domain } = body

    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 })
    }

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/
    if (!domainRegex.test(domain)) {
      return NextResponse.json({ error: "Invalid domain format" }, { status: 400 })
    }

    const whiteLabelManager = new WhiteLabelManager()

    // Setup custom domain
    const result = await whiteLabelManager.setupCustomDomain(
      user.tenant_id || "default",
      domain,
      user.id,
    )

    return NextResponse.json({
      domain,
      verificationToken: result.verificationToken,
      dnsInstructions: result.dnsInstructions,
      message: "Custom domain setup initiated",
    })
  } catch (error) {
    console.error("Failed to setup custom domain:", error)
    return NextResponse.json({ error: "Failed to setup custom domain" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Authenticate admin user
    const user = await adminAuth.getCurrentUser()
    if (!user || !adminAuth.hasPermission(user, "manage-white-label")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { domain } = body

    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 })
    }

    const whiteLabelManager = new WhiteLabelManager()

    // Verify custom domain
    const isVerified = await whiteLabelManager.verifyCustomDomain(
      user.tenant_id || "default",
      domain,
    )

    return NextResponse.json({
      domain,
      verified: isVerified,
      message: isVerified ? "Domain verified successfully" : "Domain verification failed",
    })
  } catch (error) {
    console.error("Failed to verify custom domain:", error)
    return NextResponse.json({ error: "Failed to verify custom domain" }, { status: 500 })
  }
}
