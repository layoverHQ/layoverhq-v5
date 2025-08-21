import { Supabase } from '@/lib/supabase/service-role'
import { Logger } from '@/lib/logger'

const logger = new Logger('travel-document-manager')

export interface TravelDocument {
  id: string
  userId: string
  type: DocumentType
  title: string
  description?: string
  
  // Document details
  documentNumber?: string
  issuingCountry?: string
  issuingAuthority?: string
  issueDate?: Date
  expiryDate?: Date
  
  // Digital storage
  fileUrl?: string
  thumbnailUrl?: string
  encryptedData?: string // For secure storage of sensitive info
  
  // Metadata
  isVerified: boolean
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'expired'
  tags: string[]
  category: DocumentCategory
  
  // Sharing and access
  isSharedWithEmergencyContacts: boolean
  accessPermissions: AccessPermission[]
  
  // Alerts and reminders
  expiryAlerts: ExpiryAlert[]
  
  createdAt: Date
  updatedAt: Date
}

export type DocumentType = 
  | 'passport'
  | 'visa'
  | 'driver_license'
  | 'national_id'
  | 'travel_insurance'
  | 'vaccination_certificate'
  | 'boarding_pass'
  | 'hotel_reservation'
  | 'rental_car_confirmation'
  | 'emergency_contact'
  | 'medical_record'
  | 'credit_card'
  | 'custom'

export type DocumentCategory = 
  | 'identification'
  | 'travel_permits'
  | 'reservations'
  | 'insurance'
  | 'medical'
  | 'financial'
  | 'emergency'
  | 'other'

export interface AccessPermission {
  type: 'emergency_contact' | 'family_member' | 'travel_companion' | 'service_provider'
  contactId: string
  permissions: ('view' | 'download' | 'share')[]
  expiresAt?: Date
}

export interface ExpiryAlert {
  id: string
  daysBeforeExpiry: number
  alertType: 'email' | 'push' | 'sms'
  isActive: boolean
  lastSent?: Date
}

export interface DocumentTemplate {
  type: DocumentType
  title: string
  fields: DocumentField[]
  category: DocumentCategory
  icon: string
  color: string
  expiryRequired: boolean
  verificationRequired: boolean
}

export interface DocumentField {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'country' | 'file'
  required: boolean
  sensitive: boolean // Whether to encrypt this field
  validationPattern?: string
}

export interface DocumentScanResult {
  extractedData: Record<string, any>
  confidence: number
  suggestions: string[]
  detectedType?: DocumentType
}

export interface DocumentVerificationResult {
  isValid: boolean
  verificationScore: number
  issues: string[]
  verifiedFields: string[]
  recommendedActions: string[]
}

export class TravelDocumentManager {
  private supabase = Supabase()

  async createDocument(
    userId: string, 
    documentData: Omit<TravelDocument, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<TravelDocument> {
    try {
      logger.info('Creating travel document', { userId, type: documentData.type })

      // Encrypt sensitive data before storage
      const encryptedData = await this.encryptSensitiveData(documentData)

      const { data, error } = await this.supabase
        .from('travel_documents')
        .insert({
          user_id: userId,
          type: documentData.type,
          title: documentData.title,
          description: documentData.description,
          document_number: documentData.documentNumber,
          issuing_country: documentData.issuingCountry,
          issuing_authority: documentData.issuingAuthority,
          issue_date: documentData.issueDate?.toISOString(),
          expiry_date: documentData.expiryDate?.toISOString(),
          file_url: documentData.fileUrl,
          thumbnail_url: documentData.thumbnailUrl,
          encrypted_data: encryptedData,
          is_verified: documentData.isVerified,
          verification_status: documentData.verificationStatus,
          tags: documentData.tags,
          category: documentData.category,
          is_shared_with_emergency_contacts: documentData.isSharedWithEmergencyContacts,
          access_permissions: documentData.accessPermissions,
          expiry_alerts: documentData.expiryAlerts
        })
        .select()
        .single()

      if (error) throw error

      // Set up expiry alerts if document has expiry date
      if (documentData.expiryDate) {
        await this.setupExpiryAlerts(data.id, documentData.expiryDate, documentData.expiryAlerts)
      }

      logger.info('Travel document created successfully', { documentId: data.id })
      return this.transformDatabaseDocument(data)

    } catch (error) {
      logger.error('Failed to create travel document', error)
      throw error
    }
  }

  async getDocuments(userId: string, filters?: {
    category?: DocumentCategory
    type?: DocumentType
    expiringSoon?: boolean
  }): Promise<TravelDocument[]> {
    try {
      let query = this.supabase
        .from('travel_documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (filters?.category) {
        query = query.eq('category', filters.category)
      }

      if (filters?.type) {
        query = query.eq('type', filters.type)
      }

      if (filters?.expiringSoon) {
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
        query = query.lte('expiry_date', thirtyDaysFromNow.toISOString())
      }

      const { data, error } = await query

      if (error) throw error

      return (data || []).map(doc => this.transformDatabaseDocument(doc))

    } catch (error) {
      logger.error('Failed to get travel documents', error)
      throw error
    }
  }

  async updateDocument(documentId: string, updates: Partial<TravelDocument>): Promise<TravelDocument> {
    try {
      // Encrypt sensitive data if present
      const encryptedData = updates.documentNumber || updates.issuingAuthority 
        ? await this.encryptSensitiveData(updates)
        : undefined

      const updateData: any = {
        ...(updates.title && { title: updates.title }),
        ...(updates.description && { description: updates.description }),
        ...(updates.documentNumber && { document_number: updates.documentNumber }),
        ...(updates.issuingCountry && { issuing_country: updates.issuingCountry }),
        ...(updates.issuingAuthority && { issuing_authority: updates.issuingAuthority }),
        ...(updates.issueDate && { issue_date: updates.issueDate.toISOString() }),
        ...(updates.expiryDate && { expiry_date: updates.expiryDate.toISOString() }),
        ...(updates.fileUrl && { file_url: updates.fileUrl }),
        ...(updates.thumbnailUrl && { thumbnail_url: updates.thumbnailUrl }),
        ...(encryptedData && { encrypted_data: encryptedData }),
        ...(updates.isVerified !== undefined && { is_verified: updates.isVerified }),
        ...(updates.verificationStatus && { verification_status: updates.verificationStatus }),
        ...(updates.tags && { tags: updates.tags }),
        ...(updates.isSharedWithEmergencyContacts !== undefined && { 
          is_shared_with_emergency_contacts: updates.isSharedWithEmergencyContacts 
        }),
        ...(updates.accessPermissions && { access_permissions: updates.accessPermissions }),
        ...(updates.expiryAlerts && { expiry_alerts: updates.expiryAlerts }),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await this.supabase
        .from('travel_documents')
        .update(updateData)
        .eq('id', documentId)
        .select()
        .single()

      if (error) throw error

      return this.transformDatabaseDocument(data)

    } catch (error) {
      logger.error('Failed to update travel document', error)
      throw error
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    try {
      // Also delete associated files from storage
      const document = await this.getDocumentById(documentId)
      if (document.fileUrl) {
        await this.deleteDocumentFile(document.fileUrl)
      }

      const { error } = await this.supabase
        .from('travel_documents')
        .delete()
        .eq('id', documentId)

      if (error) throw error

      logger.info('Travel document deleted successfully', { documentId })

    } catch (error) {
      logger.error('Failed to delete travel document', error)
      throw error
    }
  }

  async scanDocument(fileBuffer: Buffer, mimeType: string): Promise<DocumentScanResult> {
    try {
      logger.info('Scanning document with OCR')

      // Simulate OCR processing (in real implementation, use services like AWS Textract, Google Vision API)
      // This would extract text and structured data from the document image

      const mockResult: DocumentScanResult = {
        extractedData: {
          documentNumber: 'P123456789',
          fullName: 'John Doe',
          nationality: 'US',
          issueDate: '2020-01-15',
          expiryDate: '2030-01-15'
        },
        confidence: 0.95,
        suggestions: [
          'Verify document number manually',
          'Check expiry date clarity'
        ],
        detectedType: 'passport'
      }

      return mockResult

    } catch (error) {
      logger.error('Failed to scan document', error)
      throw error
    }
  }

  async verifyDocument(documentId: string): Promise<DocumentVerificationResult> {
    try {
      const document = await this.getDocumentById(documentId)

      logger.info('Verifying document authenticity', { documentId, type: document.type })

      // Simulate document verification (in real implementation, use government APIs or third-party services)
      const verificationResult: DocumentVerificationResult = {
        isValid: true,
        verificationScore: 0.92,
        issues: [],
        verifiedFields: ['documentNumber', 'expiryDate', 'issuingCountry'],
        recommendedActions: []
      }

      // Update document verification status
      await this.updateDocument(documentId, {
        verificationStatus: verificationResult.isValid ? 'verified' : 'rejected',
        isVerified: verificationResult.isValid
      })

      return verificationResult

    } catch (error) {
      logger.error('Failed to verify document', error)
      throw error
    }
  }

  async shareDocument(
    documentId: string, 
    shareWith: AccessPermission[]
  ): Promise<{ shareUrl: string; expiresAt: Date }> {
    try {
      logger.info('Sharing document', { documentId, shareWithCount: shareWith.length })

      // Generate secure share link
      const shareToken = this.generateSecureToken()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

      // Store share configuration
      const { error } = await this.supabase
        .from('document_shares')
        .insert({
          document_id: documentId,
          share_token: shareToken,
          access_permissions: shareWith,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        })

      if (error) throw error

      const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/shared-document/${shareToken}`

      return { shareUrl, expiresAt }

    } catch (error) {
      logger.error('Failed to share document', error)
      throw error
    }
  }

  async getExpiringDocuments(userId: string, days: number = 30): Promise<TravelDocument[]> {
    try {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + days)

      const { data, error } = await this.supabase
        .from('travel_documents')
        .select('*')
        .eq('user_id', userId)
        .not('expiry_date', 'is', null)
        .lte('expiry_date', futureDate.toISOString())
        .gte('expiry_date', new Date().toISOString()) // Not already expired
        .order('expiry_date', { ascending: true })

      if (error) throw error

      return (data || []).map(doc => this.transformDatabaseDocument(doc))

    } catch (error) {
      logger.error('Failed to get expiring documents', error)
      throw error
    }
  }

  async getDocumentTemplates(): Promise<DocumentTemplate[]> {
    return [
      {
        type: 'passport',
        title: 'Passport',
        category: 'identification',
        icon: 'passport',
        color: '#3B82F6',
        expiryRequired: true,
        verificationRequired: true,
        fields: [
          { name: 'documentNumber', label: 'Passport Number', type: 'text', required: true, sensitive: true },
          { name: 'fullName', label: 'Full Name', type: 'text', required: true, sensitive: false },
          { name: 'nationality', label: 'Nationality', type: 'country', required: true, sensitive: false },
          { name: 'issueDate', label: 'Issue Date', type: 'date', required: true, sensitive: false },
          { name: 'expiryDate', label: 'Expiry Date', type: 'date', required: true, sensitive: false },
          { name: 'issuingAuthority', label: 'Issuing Authority', type: 'text', required: false, sensitive: false }
        ]
      },
      {
        type: 'visa',
        title: 'Visa',
        category: 'travel_permits',
        icon: 'document',
        color: '#10B981',
        expiryRequired: true,
        verificationRequired: true,
        fields: [
          { name: 'visaNumber', label: 'Visa Number', type: 'text', required: true, sensitive: true },
          { name: 'visaType', label: 'Visa Type', type: 'text', required: true, sensitive: false },
          { name: 'issuingCountry', label: 'Issuing Country', type: 'country', required: true, sensitive: false },
          { name: 'validFrom', label: 'Valid From', type: 'date', required: true, sensitive: false },
          { name: 'validUntil', label: 'Valid Until', type: 'date', required: true, sensitive: false }
        ]
      },
      {
        type: 'travel_insurance',
        title: 'Travel Insurance',
        category: 'insurance',
        icon: 'shield',
        color: '#8B5CF6',
        expiryRequired: true,
        verificationRequired: false,
        fields: [
          { name: 'policyNumber', label: 'Policy Number', type: 'text', required: true, sensitive: true },
          { name: 'provider', label: 'Insurance Provider', type: 'text', required: true, sensitive: false },
          { name: 'coverage', label: 'Coverage Amount', type: 'text', required: false, sensitive: false },
          { name: 'emergencyContact', label: 'Emergency Contact', type: 'text', required: true, sensitive: false }
        ]
      }
    ]
  }

  private async getDocumentById(documentId: string): Promise<TravelDocument> {
    const { data, error } = await this.supabase
      .from('travel_documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (error) throw error
    return this.transformDatabaseDocument(data)
  }

  private transformDatabaseDocument(dbDoc: any): TravelDocument {
    return {
      id: dbDoc.id,
      userId: dbDoc.user_id,
      type: dbDoc.type,
      title: dbDoc.title,
      description: dbDoc.description,
      documentNumber: dbDoc.document_number,
      issuingCountry: dbDoc.issuing_country,
      issuingAuthority: dbDoc.issuing_authority,
      issueDate: dbDoc.issue_date ? new Date(dbDoc.issue_date) : undefined,
      expiryDate: dbDoc.expiry_date ? new Date(dbDoc.expiry_date) : undefined,
      fileUrl: dbDoc.file_url,
      thumbnailUrl: dbDoc.thumbnail_url,
      encryptedData: dbDoc.encrypted_data,
      isVerified: dbDoc.is_verified,
      verificationStatus: dbDoc.verification_status,
      tags: dbDoc.tags || [],
      category: dbDoc.category,
      isSharedWithEmergencyContacts: dbDoc.is_shared_with_emergency_contacts,
      accessPermissions: dbDoc.access_permissions || [],
      expiryAlerts: dbDoc.expiry_alerts || [],
      createdAt: new Date(dbDoc.created_at),
      updatedAt: new Date(dbDoc.updated_at)
    }
  }

  private async encryptSensitiveData(data: any): Promise<string> {
    // In a real implementation, use proper encryption like AES-256
    // This is a placeholder for the encryption logic
    const sensitiveFields = ['documentNumber', 'issuingAuthority']
    const dataToEncrypt: any = {}
    
    sensitiveFields.forEach(field => {
      if (data[field]) {
        dataToEncrypt[field] = data[field]
      }
    })

    return JSON.stringify(dataToEncrypt) // This should be encrypted in real implementation
  }

  private async setupExpiryAlerts(documentId: string, expiryDate: Date, alerts: ExpiryAlert[]): Promise<void> {
    // Set up automated alerts for document expiry
    // This would integrate with a notification service
    logger.info('Setting up expiry alerts', { documentId, expiryDate, alertCount: alerts.length })
  }

  private async deleteDocumentFile(fileUrl: string): Promise<void> {
    // Delete file from storage (S3, Supabase Storage, etc.)
    logger.info('Deleting document file', { fileUrl })
  }

  private generateSecureToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }
}