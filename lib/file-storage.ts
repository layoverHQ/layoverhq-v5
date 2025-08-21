import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export interface FileUploadOptions {
  bucket: string
  path: string
  file: File | Buffer
  contentType?: string
  cacheControl?: string
  upsert?: boolean
  metadata?: Record<string, any>
}

export interface FileMetadata {
  id: string
  name: string
  size: number
  type: string
  bucket: string
  path: string
  url: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export class FileStorageManager {
  private static instance: FileStorageManager
  private buckets = ["avatars", "documents", "images", "videos", "temp"]

  static getInstance(): FileStorageManager {
    if (!FileStorageManager.instance) {
      FileStorageManager.instance = new FileStorageManager()
    }
    return FileStorageManager.instance
  }

  async initializeBuckets(): Promise<void> {
    for (const bucket of this.buckets) {
      const { data, error } = await supabase.storage.getBucket(bucket)
      if (error && error.message.includes("not found")) {
        await supabase.storage.createBucket(bucket, {
          public: bucket === "images" || bucket === "avatars",
          allowedMimeTypes: this.getAllowedMimeTypes(bucket),
          fileSizeLimit: this.getFileSizeLimit(bucket),
        })
      }
    }
  }

  private getAllowedMimeTypes(bucket: string): string[] {
    switch (bucket) {
      case "images":
      case "avatars":
        return ["image/jpeg", "image/png", "image/webp", "image/gif"]
      case "videos":
        return ["video/mp4", "video/webm", "video/quicktime"]
      case "documents":
        return [
          "application/pdf",
          "text/plain",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ]
      default:
        return ["*"]
    }
  }

  private getFileSizeLimit(bucket: string): number {
    switch (bucket) {
      case "avatars":
        return 2 * 1024 * 1024 // 2MB
      case "images":
        return 10 * 1024 * 1024 // 10MB
      case "videos":
        return 100 * 1024 * 1024 // 100MB
      case "documents":
        return 50 * 1024 * 1024 // 50MB
      default:
        return 25 * 1024 * 1024 // 25MB
    }
  }

  async uploadFile(options: FileUploadOptions): Promise<FileMetadata> {
    const {
      bucket,
      path,
      file,
      contentType,
      cacheControl = "3600",
      upsert = false,
      metadata = {},
    } = options

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      contentType,
      cacheControl,
      upsert,
      metadata,
    })

    if (error) {
      throw new Error(`File upload failed: ${error.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)

    // Store metadata in database
    const fileMetadata: FileMetadata = {
      id: crypto.randomUUID(),
      name: path.split("/").pop() || "",
      size: file instanceof File ? file.size : Buffer.byteLength(file),
      type: contentType || "application/octet-stream",
      bucket,
      path,
      url: urlData.publicUrl,
      metadata,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    await this.saveFileMetadata(fileMetadata)
    return fileMetadata
  }

  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await supabase.storage.from(bucket).remove([path])

    if (error) {
      throw new Error(`File deletion failed: ${error.message}`)
    }

    // Remove from metadata
    await supabase.from("file_metadata").delete().eq("bucket", bucket).eq("path", path)
  }

  async getFileUrl(bucket: string, path: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn)

    if (error) {
      throw new Error(`Failed to generate signed URL: ${error.message}`)
    }

    return data.signedUrl
  }

  async listFiles(bucket: string, folder = "", limit = 100): Promise<FileMetadata[]> {
    const { data, error } = await supabase
      .from("file_metadata")
      .select("*")
      .eq("bucket", bucket)
      .ilike("path", `${folder}%`)
      .limit(limit)
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error(`Failed to list files: ${error.message}`)
    }

    return data
  }

  private async saveFileMetadata(metadata: FileMetadata): Promise<void> {
    const { error } = await supabase.from("file_metadata").insert(metadata)

    if (error) {
      console.error("Failed to save file metadata:", error)
    }
  }

  async getStorageStats(): Promise<{
    totalFiles: number
    totalSize: number
    bucketStats: Record<string, { files: number; size: number }>
  }> {
    const { data, error } = await supabase.from("file_metadata").select("bucket, size")

    if (error) {
      throw new Error(`Failed to get storage stats: ${error.message}`)
    }

    const bucketStats: Record<string, { files: number; size: number }> = {}
    let totalFiles = 0
    let totalSize = 0

    data.forEach((file) => {
      if (!bucketStats[file.bucket]) {
        bucketStats[file.bucket] = { files: 0, size: 0 }
      }
      bucketStats[file.bucket].files++
      bucketStats[file.bucket].size += file.size
      totalFiles++
      totalSize += file.size
    })

    return { totalFiles, totalSize, bucketStats }
  }
}

export const fileStorage = FileStorageManager.getInstance()
