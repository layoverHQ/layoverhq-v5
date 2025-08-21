import { type NextRequest, NextResponse } from "next/server"
import { fileStorage } from "@/lib/file-storage"
import { ImageProcessor } from "@/lib/image-processor"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
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

    const formData = await request.formData()
    const file = formData.get("file") as File
    const bucket = (formData.get("bucket") as string) || "documents"
    const folder = (formData.get("folder") as string) || ""
    const processImage = formData.get("processImage") === "true"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Generate unique file path
    const timestamp = Date.now()
    const fileName = `${timestamp}-${file.name}`
    const filePath = folder ? `${folder}/${fileName}` : fileName

    let fileBuffer = Buffer.from(await file.arrayBuffer()) as Buffer

    // Process image if requested and file is an image
    if (processImage && file.type.startsWith("image/")) {
      fileBuffer = await ImageProcessor.optimizeForWeb(fileBuffer as Buffer)
    }

    // Upload file
    const fileMetadata = await fileStorage.uploadFile({
      bucket,
      path: filePath,
      file: fileBuffer,
      contentType: file.type,
      metadata: {
        originalName: file.name,
        uploadedBy: user.id,
        processed: processImage,
      },
    })

    // Log file access
    await supabase.from("file_access_logs").insert({
      file_id: fileMetadata.id,
      user_id: user.id,
      action: "upload",
      ip_address: request.ip,
      user_agent: request.headers.get("user-agent"),
    })

    return NextResponse.json({
      success: true,
      file: fileMetadata,
    })
  } catch (error) {
    console.error("File upload error:", error)
    return NextResponse.json({ error: "File upload failed" }, { status: 500 })
  }
}
