-- Travel Document Management System Schema
-- Secure storage and management of travel documents

-- Create enum types
CREATE TYPE document_type AS ENUM (
    'passport',
    'visa', 
    'driver_license',
    'national_id',
    'travel_insurance',
    'vaccination_certificate',
    'boarding_pass',
    'hotel_reservation',
    'rental_car_confirmation',
    'emergency_contact',
    'medical_record',
    'credit_card',
    'custom'
);

CREATE TYPE document_category AS ENUM (
    'identification',
    'travel_permits',
    'reservations',
    'insurance',
    'medical',
    'financial',
    'emergency',
    'other'
);

CREATE TYPE verification_status AS ENUM (
    'pending',
    'verified',
    'rejected',
    'expired'
);

-- Main travel documents table
CREATE TABLE IF NOT EXISTS travel_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Document identification
    type document_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category document_category NOT NULL,
    
    -- Document details
    document_number VARCHAR(100), -- Encrypted in app layer
    issuing_country VARCHAR(3), -- ISO 3166-1 alpha-3
    issuing_authority VARCHAR(255), -- Encrypted in app layer
    issue_date DATE,
    expiry_date DATE,
    
    -- Digital storage
    file_url TEXT, -- URL to stored document file
    thumbnail_url TEXT, -- URL to thumbnail image
    encrypted_data TEXT, -- Encrypted sensitive data
    file_size INTEGER, -- File size in bytes
    file_type VARCHAR(50), -- MIME type
    
    -- Verification and security
    is_verified BOOLEAN DEFAULT false,
    verification_status verification_status DEFAULT 'pending',
    verification_date TIMESTAMP WITH TIME ZONE,
    verification_details JSONB, -- Results from verification process
    
    -- Organization and tagging
    tags TEXT[] DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}', -- Flexible additional fields
    
    -- Sharing and access control
    is_shared_with_emergency_contacts BOOLEAN DEFAULT false,
    access_permissions JSONB DEFAULT '[]', -- Array of access permission objects
    share_settings JSONB DEFAULT '{}', -- Sharing configuration
    
    -- Alerts and notifications
    expiry_alerts JSONB DEFAULT '[]', -- Array of expiry alert configurations
    last_alert_sent TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_expiry_date CHECK (expiry_date IS NULL OR expiry_date > issue_date),
    CONSTRAINT valid_file_size CHECK (file_size IS NULL OR file_size > 0)
);

-- Document sharing table for secure link sharing
CREATE TABLE IF NOT EXISTS document_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES travel_documents(id) ON DELETE CASCADE,
    
    -- Share configuration
    share_token VARCHAR(255) UNIQUE NOT NULL,
    access_permissions JSONB NOT NULL DEFAULT '[]',
    share_password VARCHAR(255), -- Optional password protection
    
    -- Access control
    max_access_count INTEGER DEFAULT 10,
    current_access_count INTEGER DEFAULT 0,
    allowed_domains TEXT[], -- Restrict access by domain
    
    -- Expiry and lifecycle
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    
    -- Audit trail
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    accessed_by_ips TEXT[] DEFAULT '{}' -- Track access IPs
);

-- Document access log for audit trail
CREATE TABLE IF NOT EXISTS document_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES travel_documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    
    -- Access details
    action VARCHAR(50) NOT NULL, -- 'view', 'download', 'share', 'edit', 'delete'
    access_method VARCHAR(50) NOT NULL, -- 'direct', 'shared_link', 'emergency_access'
    share_token VARCHAR(255), -- If accessed via shared link
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    location_info JSONB, -- Geolocation if available
    
    -- Results
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency contacts table (for document sharing)
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Contact information
    name VARCHAR(255) NOT NULL,
    relationship VARCHAR(100), -- 'spouse', 'parent', 'sibling', 'friend', etc.
    phone VARCHAR(20),
    email VARCHAR(255),
    
    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(3), -- ISO 3166-1 alpha-3
    postal_code VARCHAR(20),
    
    -- Emergency access
    has_document_access BOOLEAN DEFAULT false,
    accessible_document_categories document_category[] DEFAULT '{}',
    emergency_access_code VARCHAR(10), -- PIN for emergency access
    
    -- Preferences
    notification_preferences JSONB DEFAULT '{}',
    preferred_contact_method VARCHAR(20) DEFAULT 'email',
    
    -- Status
    is_verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, email)
);

-- Document templates for common document types
CREATE TABLE IF NOT EXISTS document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Template identification
    type document_type NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category document_category NOT NULL,
    
    -- Template configuration
    required_fields JSONB NOT NULL DEFAULT '[]', -- Array of required field definitions
    optional_fields JSONB DEFAULT '[]', -- Array of optional field definitions
    validation_rules JSONB DEFAULT '{}', -- Validation rules for fields
    
    -- UI configuration
    icon VARCHAR(50),
    color VARCHAR(7), -- Hex color code
    display_order INTEGER DEFAULT 0,
    
    -- Features
    supports_ocr BOOLEAN DEFAULT false,
    supports_verification BOOLEAN DEFAULT false,
    requires_expiry_date BOOLEAN DEFAULT false,
    default_alert_days INTEGER[] DEFAULT '{30, 7, 1}', -- Default expiry alert days
    
    -- Lifecycle
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(type, version)
);

-- Document expiry alerts queue
CREATE TABLE IF NOT EXISTS document_expiry_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES travel_documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Alert configuration
    alert_type VARCHAR(20) NOT NULL, -- 'email', 'push', 'sms'
    days_before_expiry INTEGER NOT NULL,
    
    -- Scheduling
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(document_id, alert_type, days_before_expiry)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_travel_documents_user_id ON travel_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_documents_type ON travel_documents(type);
CREATE INDEX IF NOT EXISTS idx_travel_documents_category ON travel_documents(category);
CREATE INDEX IF NOT EXISTS idx_travel_documents_expiry ON travel_documents(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_travel_documents_verification ON travel_documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_travel_documents_tags ON travel_documents USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_travel_documents_updated ON travel_documents(updated_at);

CREATE INDEX IF NOT EXISTS idx_document_shares_token ON document_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_document_shares_expires ON document_shares(expires_at);
CREATE INDEX IF NOT EXISTS idx_document_shares_active ON document_shares(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_document_access_log_document ON document_access_log(document_id);
CREATE INDEX IF NOT EXISTS idx_document_access_log_user ON document_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_document_access_log_created ON document_access_log(created_at);

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user ON emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_email ON emergency_contacts(email);

CREATE INDEX IF NOT EXISTS idx_expiry_alerts_scheduled ON document_expiry_alerts(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_expiry_alerts_status ON document_expiry_alerts(status);

-- Enable Row Level Security
ALTER TABLE travel_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_expiry_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Travel Documents: Users can only access their own documents
CREATE POLICY "Users can manage their own documents" ON travel_documents
    FOR ALL USING (auth.uid() = user_id);

-- Emergency contacts can view shared documents
CREATE POLICY "Emergency contacts can view shared documents" ON travel_documents
    FOR SELECT USING (
        is_shared_with_emergency_contacts = true AND
        EXISTS (
            SELECT 1 FROM emergency_contacts ec 
            WHERE ec.user_id = travel_documents.user_id 
            AND ec.has_document_access = true 
            AND ec.is_active = true
            AND travel_documents.category = ANY(ec.accessible_document_categories)
        )
    );

-- Document Shares: Users can manage shares of their own documents
CREATE POLICY "Users can manage document shares" ON document_shares
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM travel_documents td 
            WHERE td.id = document_shares.document_id 
            AND td.user_id = auth.uid()
        )
    );

-- Public access to active shared documents
CREATE POLICY "Public can access active shared documents" ON document_shares
    FOR SELECT USING (is_active = true AND expires_at > NOW());

-- Document Access Log: Users can view logs for their documents
CREATE POLICY "Users can view access logs for their documents" ON document_access_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM travel_documents td 
            WHERE td.id = document_access_log.document_id 
            AND td.user_id = auth.uid()
        )
    );

-- Allow inserting access logs for any document (for audit purposes)
CREATE POLICY "Allow access log insertion" ON document_access_log
    FOR INSERT WITH CHECK (true);

-- Emergency Contacts: Users can manage their own emergency contacts
CREATE POLICY "Users can manage their emergency contacts" ON emergency_contacts
    FOR ALL USING (auth.uid() = user_id);

-- Document Expiry Alerts: Users can manage alerts for their documents
CREATE POLICY "Users can manage their document alerts" ON document_expiry_alerts
    FOR ALL USING (auth.uid() = user_id);

-- Functions and Triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to relevant tables
CREATE TRIGGER update_travel_documents_updated_at 
    BEFORE UPDATE ON travel_documents
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_contacts_updated_at 
    BEFORE UPDATE ON emergency_contacts
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create expiry alerts when document is created/updated
CREATE OR REPLACE FUNCTION create_expiry_alerts()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create alerts if expiry_date is set and document is verified
    IF NEW.expiry_date IS NOT NULL AND NEW.is_verified = true THEN
        -- Create default alerts (30, 7, and 1 days before expiry)
        INSERT INTO document_expiry_alerts (document_id, user_id, alert_type, days_before_expiry, scheduled_for)
        SELECT 
            NEW.id,
            NEW.user_id,
            'email',
            days,
            NEW.expiry_date - INTERVAL '1 day' * days
        FROM unnest(ARRAY[30, 7, 1]) AS days
        WHERE NEW.expiry_date - INTERVAL '1 day' * days > NOW()
        ON CONFLICT (document_id, alert_type, days_before_expiry) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_document_expiry_alerts 
    AFTER INSERT OR UPDATE OF expiry_date, is_verified ON travel_documents
    FOR EACH ROW 
    EXECUTE FUNCTION create_expiry_alerts();

-- Function to log document access
CREATE OR REPLACE FUNCTION log_document_access(
    p_document_id UUID,
    p_action VARCHAR(50),
    p_access_method VARCHAR(50) DEFAULT 'direct',
    p_share_token VARCHAR(255) DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO document_access_log (
        document_id, user_id, action, access_method, share_token, 
        ip_address, user_agent, success
    ) VALUES (
        p_document_id, auth.uid(), p_action, p_access_method, p_share_token,
        p_ip_address, p_user_agent, true
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Insert default document templates
INSERT INTO document_templates (type, name, description, category, required_fields, icon, color, supports_ocr, supports_verification, requires_expiry_date) VALUES
(
    'passport',
    'Passport',
    'International travel document issued by national government',
    'identification',
    '[
        {"name": "documentNumber", "label": "Passport Number", "type": "text", "required": true, "sensitive": true},
        {"name": "fullName", "label": "Full Name", "type": "text", "required": true, "sensitive": false},
        {"name": "nationality", "label": "Nationality", "type": "country", "required": true, "sensitive": false},
        {"name": "issueDate", "label": "Issue Date", "type": "date", "required": true, "sensitive": false},
        {"name": "expiryDate", "label": "Expiry Date", "type": "date", "required": true, "sensitive": false}
    ]'::jsonb,
    'passport',
    '#3B82F6',
    true,
    true,
    true
),
(
    'visa',
    'Visa',
    'Travel authorization document for entering specific countries',
    'travel_permits',
    '[
        {"name": "visaNumber", "label": "Visa Number", "type": "text", "required": true, "sensitive": true},
        {"name": "visaType", "label": "Visa Type", "type": "text", "required": true, "sensitive": false},
        {"name": "issuingCountry", "label": "Issuing Country", "type": "country", "required": true, "sensitive": false},
        {"name": "validFrom", "label": "Valid From", "type": "date", "required": true, "sensitive": false},
        {"name": "validUntil", "label": "Valid Until", "type": "date", "required": true, "sensitive": false}
    ]'::jsonb,
    'document',
    '#10B981',
    true,
    true,
    true
),
(
    'travel_insurance',
    'Travel Insurance',
    'Insurance policy covering travel-related risks and emergencies',
    'insurance',
    '[
        {"name": "policyNumber", "label": "Policy Number", "type": "text", "required": true, "sensitive": true},
        {"name": "provider", "label": "Insurance Provider", "type": "text", "required": true, "sensitive": false},
        {"name": "coverageAmount", "label": "Coverage Amount", "type": "text", "required": false, "sensitive": false},
        {"name": "emergencyContact", "label": "Emergency Contact", "type": "text", "required": true, "sensitive": false}
    ]'::jsonb,
    'shield',
    '#8B5CF6',
    false,
    false,
    true
),
(
    'vaccination_certificate',
    'Vaccination Certificate',
    'Medical certificate proving vaccination status',
    'medical',
    '[
        {"name": "certificateNumber", "label": "Certificate Number", "type": "text", "required": true, "sensitive": true},
        {"name": "vaccinationType", "label": "Vaccination Type", "type": "text", "required": true, "sensitive": false},
        {"name": "administeredDate", "label": "Date Administered", "type": "date", "required": true, "sensitive": false},
        {"name": "issuingAuthority", "label": "Issuing Authority", "type": "text", "required": true, "sensitive": false}
    ]'::jsonb,
    'syringe',
    '#EF4444',
    true,
    true,
    false
)
ON CONFLICT (type, version) DO NOTHING;

-- Create view for document summary with expiry status
CREATE OR REPLACE VIEW document_summary AS
SELECT 
    td.*,
    CASE 
        WHEN td.expiry_date IS NULL THEN 'no_expiry'
        WHEN td.expiry_date < NOW() THEN 'expired'
        WHEN td.expiry_date < NOW() + INTERVAL '30 days' THEN 'expiring_soon'
        ELSE 'valid'
    END as expiry_status,
    CASE 
        WHEN td.expiry_date IS NOT NULL THEN 
            EXTRACT(DAYS FROM td.expiry_date - NOW())::INTEGER
        ELSE NULL
    END as days_until_expiry
FROM travel_documents td;