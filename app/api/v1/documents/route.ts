import { NextRequest, NextResponse } from 'next/server'
import { TravelDocumentManager } from '@/lib/services/travel-document-manager'
import { Logger } from '@/lib/logger'

const logger = new Logger('documents-api')
const documentManager = new TravelDocumentManager()

export async function POST(request: NextRequest) {
  try {
    // Get user ID from auth (implement your auth logic)
    const userId = request.headers.get('x-user-id') // Replace with actual auth implementation
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const documentData = await request.json()

    // Validate required fields
    if (!documentData.type || !documentData.title) {
      return NextResponse.json(
        { error: 'Document type and title are required' },
        { status: 400 }
      )
    }

    // Set defaults
    const documentToCreate = {
      type: documentData.type,
      title: documentData.title,
      description: documentData.description || '',
      category: documentData.category || 'other',
      documentNumber: documentData.documentNumber,
      issuingCountry: documentData.issuingCountry,
      issuingAuthority: documentData.issuingAuthority,
      issueDate: documentData.issueDate ? new Date(documentData.issueDate) : undefined,
      expiryDate: documentData.expiryDate ? new Date(documentData.expiryDate) : undefined,
      fileUrl: documentData.fileUrl,
      thumbnailUrl: documentData.thumbnailUrl,
      isVerified: false,
      verificationStatus: 'pending' as const,
      tags: documentData.tags || [],
      isSharedWithEmergencyContacts: documentData.isSharedWithEmergencyContacts || false,
      accessPermissions: documentData.accessPermissions || [],
      expiryAlerts: documentData.expiryAlerts || []
    }

    const document = await documentManager.createDocument(userId, documentToCreate)

    logger.info('Document created successfully', { 
      documentId: document.id, 
      type: document.type 
    })

    return NextResponse.json(document, { status: 201 })

  } catch (error) {
    logger.error('Failed to create document', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to create document',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const type = searchParams.get('type')
    const expiringSoon = searchParams.get('expiring_soon') === 'true'

    const filters: any = {}
    if (category) filters.category = category
    if (type) filters.type = type
    if (expiringSoon) filters.expiringSoon = true

    const documents = await documentManager.getDocuments(userId, filters)

    return NextResponse.json({ 
      documents,
      count: documents.length 
    })

  } catch (error) {
    logger.error('Failed to get documents', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve documents',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}