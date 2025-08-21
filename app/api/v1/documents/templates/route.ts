import { NextRequest, NextResponse } from 'next/server'
import { TravelDocumentManager } from '@/lib/services/travel-document-manager'
import { Logger } from '@/lib/logger'

const logger = new Logger('document-templates-api')
const documentManager = new TravelDocumentManager()

export async function GET(request: NextRequest) {
  try {
    const templates = await documentManager.getDocumentTemplates()

    return NextResponse.json({
      templates,
      count: templates.length
    })

  } catch (error) {
    logger.error('Failed to get document templates', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve document templates',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}