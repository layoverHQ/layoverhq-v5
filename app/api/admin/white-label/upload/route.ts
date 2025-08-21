import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { adminAuth } from "@/lib/admin-auth"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    // Authenticate admin user
    const user = await adminAuth.getCurrentUser()
    if (!user || !adminAuth.hasPermission(user, "manage-white-label")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const type = formData.get("type") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!type || !["logo", "favicon"].includes(type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = {
      logo: ["image/png", "image/jpeg", "image/svg+xml", "image/webp"],
      favicon: ["image/png", "image/x-icon", "image/vnd.microsoft.icon"],
    }

    if (!allowedTypes[type as keyof typeof allowedTypes].includes(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file format for ${type}`,
        },
        { status: 400 },
      )
    }

    const supabase = createServiceRoleClient()
    const fileExtension = file.name.split(".").pop()
    const fileName = `${type}-${uuidv4()}.${fileExtension}`
    const filePath = `white-label/${user.tenant_id || "default"}/${fileName}`

    // Convert file to ArrayBuffer
    const fileArrayBuffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(fileArrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("assets")
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      throw uploadError
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("assets").getPublicUrl(filePath)

    return NextResponse.json({
      url: urlData.publicUrl,
      fileName,
      type,
      size: file.size,
      message: `${type} uploaded successfully`,
    })
  } catch (error) {
    console.error("File upload failed:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
