import { type NextRequest, NextResponse } from "next/server"
import { fileStorage } from "@/lib/file-storage"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(
  request: NextRequest,
  { params }: { params: { bucket: string; path: string[] } },
) {
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

    const { bucket } = params
    const filePath = params.path.join("/")

    // Get signed URL for file access
    const signedUrl = await fileStorage.getFileUrl(bucket, filePath, 3600)

    // Log file access
    await supabase.from("file_access_logs").insert({
      user_id: user.id,
      action: "download",
      ip_address: request.ip,
      user_agent: request.headers.get("user-agent"),
    })

    return NextResponse.json({
      success: true,
      url: signedUrl,
    })
  } catch (error) {
    console.error("File access error:", error)
    return NextResponse.json({ error: "File access failed" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { bucket: string; path: string[] } },
) {
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

    const { bucket } = params
    const filePath = params.path.join("/")

    // Check if user owns the file or is admin
    const { data: fileData, error: fileError } = await supabase
      .from("file_metadata")
      .select("created_by")
      .eq("bucket", bucket)
      .eq("path", filePath)
      .single()

    if (fileError || !fileData) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("user_id", user.id)
      .single()

    const isAdmin = profile?.role === "admin" || profile?.role === "super_admin"
    const isOwner = fileData.created_by === user.id

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete file
    await fileStorage.deleteFile(bucket, filePath)

    // Log file access
    await supabase.from("file_access_logs").insert({
      user_id: user.id,
      action: "delete",
      ip_address: request.ip,
      user_agent: request.headers.get("user-agent"),
    })

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    })
  } catch (error) {
    console.error("File deletion error:", error)
    return NextResponse.json({ error: "File deletion failed" }, { status: 500 })
  }
}
