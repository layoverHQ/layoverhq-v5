import { NextRequest, NextResponse } from 'next/server'
import { TravelDocumentManager } from '@/lib/services/travel-document-manager'
import { Logger } from '@/lib/logger'

const logger = new Logger('document-api')
const documentManager = new TravelDocumentManager()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user's documents and filter by ID (ensures user owns the document)
    const documents = await documentManager.getDocuments(userId)
    const document = documents.find(doc => doc.id === params.id)

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(document)

  } catch (error) {
    logger.error('Failed to get document', error)
    return NextResponse.json(
      { error: 'Failed to retrieve document' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const updates = await request.json()

    // Verify user owns the document before updating
    const documents = await documentManager.getDocuments(userId)
    const existingDocument = documents.find(doc => doc.id === params.id)

    if (!existingDocument) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Process date fields
    if (updates.issueDate) {
      updates.issueDate = new Date(updates.issueDate)
    }
    if (updates.expiryDate) {
      updates.expiryDate = new Date(updates.expiryDate)
    }

    const updatedDocument = await documentManager.updateDocument(params.id, updates)

    logger.info('Document updated successfully', { documentId: params.id })

    return NextResponse.json(updatedDocument)

  } catch (error) {
    logger.error('Failed to update document', error)
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify user owns the document before deleting
    const documents = await documentManager.getDocuments(userId)
    const existingDocument = documents.find(doc => doc.id === params.id)

    if (!existingDocument) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    await documentManager.deleteDocument(params.id)

    logger.info('Document deleted successfully', { documentId: params.id })

    return NextResponse.json({ success: true })

  } catch (error) {
    logger.error('Failed to delete document', error)
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}