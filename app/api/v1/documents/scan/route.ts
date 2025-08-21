import { NextRequest, NextResponse } from 'next/server'
import { TravelDocumentManager } from '@/lib/services/travel-document-manager'
import { Logger } from '@/lib/logger'

const logger = new Logger('document-scan-api')
const documentManager = new TravelDocumentManager()

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and PDF files are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Perform OCR scanning
    const scanResult = await documentManager.scanDocument(buffer, file.type)

    logger.info('Document scanned successfully', { 
      userId,
      fileType: file.type,
      fileSize: file.size,
      confidence: scanResult.confidence,
      detectedType: scanResult.detectedType
    })

    return NextResponse.json({
      success: true,
      ...scanResult
    })

  } catch (error) {
    logger.error('Failed to scan document', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to scan document',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}