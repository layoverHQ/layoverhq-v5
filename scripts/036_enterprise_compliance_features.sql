-- =====================================================
-- LayoverHQ Enterprise Compliance Features
-- =====================================================
-- GDPR/CCPA compliant data management with:
-- - Data subject rights (access, rectification, erasure, portability)
-- - Consent management and tracking
-- - Data retention and anonymization
-- - Audit trails and breach detection
-- - Privacy by design implementation

-- =====================================================
-- DATA SUBJECT RIGHTS MANAGEMENT
-- =====================================================

-- Data subject requests tracking
CREATE TABLE IF NOT EXISTS data_subject_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Request identification
    request_number VARCHAR(50) UNIQUE NOT NULL,
    request_type VARCHAR(50) NOT NULL CHECK (request_type IN (
        'access', 'rectification', 'erasure', 'portability', 
        'restriction', 'objection', 'consent_withdrawal'
    )),
    
    -- Subject information
    subject_email VARCHAR(255) NOT NULL,
    subject_id UUID REFERENCES users(id),
    enterprise_id UUID REFERENCES enterprises(id),
    
    -- Request details
    description TEXT,
    legal_basis VARCHAR(100),
    requested_data_categories JSONB DEFAULT '[]',
    
    -- Processing information
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'in_progress', 'completed', 'rejected', 'partially_completed'
    )),
    assigned_to UUID REFERENCES users(id),
    due_date TIMESTAMPTZ NOT NULL, -- 30 days from request
    
    -- Response details
    response_method VARCHAR(50), -- email, secure_download, postal
    response_format VARCHAR(50), -- json, csv, pdf
    response_delivered_at TIMESTAMPTZ,
    response_data JSONB DEFAULT '{}',
    
    -- Compliance tracking
    verification_method VARCHAR(100),
    verification_completed_at TIMESTAMPTZ,
    identity_verified BOOLEAN DEFAULT FALSE,
    
    -- Audit information
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    notes TEXT
);

-- Indexes for data subject requests
CREATE INDEX idx_data_subject_requests_email ON data_subject_requests(subject_email);
CREATE INDEX idx_data_subject_requests_status ON data_subject_requests(status);
CREATE INDEX idx_data_subject_requests_due_date ON data_subject_requests(due_date);
CREATE INDEX idx_data_subject_requests_type ON data_subject_requests(request_type);
CREATE INDEX idx_data_subject_requests_enterprise_id ON data_subject_requests(enterprise_id);

-- =====================================================
-- CONSENT MANAGEMENT
-- =====================================================

-- Consent records with granular tracking
CREATE TABLE IF NOT EXISTS consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Subject identification
    user_id UUID REFERENCES users(id),
    enterprise_id UUID REFERENCES enterprises(id),
    email VARCHAR(255) NOT NULL,
    
    -- Consent details
    consent_type VARCHAR(100) NOT NULL, -- marketing, analytics, functional, etc.
    purpose TEXT NOT NULL,
    legal_basis VARCHAR(100) NOT NULL, -- consent, legitimate_interest, contract, etc.
    
    -- Consent status
    consent_given BOOLEAN NOT NULL,
    consent_version VARCHAR(20) NOT NULL,
    consent_language VARCHAR(10) DEFAULT 'en',
    
    -- Collection context
    collection_method VARCHAR(100), -- web_form, api, import, etc.
    collection_source VARCHAR(255), -- specific page/form/api endpoint
    ip_address INET,
    user_agent TEXT,
    
    -- Geographic and regulatory context
    country_code VARCHAR(2),
    regulatory_regime VARCHAR(50), -- gdpr, ccpa, pipeda, etc.
    
    -- Timing
    given_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ,
    withdrawn_at TIMESTAMPTZ,
    
    -- Evidence and proof
    evidence JSONB DEFAULT '{}', -- screenshots, form data, etc.
    double_opt_in_confirmed BOOLEAN DEFAULT FALSE,
    double_opt_in_confirmed_at TIMESTAMPTZ,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for consent records
CREATE INDEX idx_consent_records_user_id ON consent_records(user_id);
CREATE INDEX idx_consent_records_email ON consent_records(email);
CREATE INDEX idx_consent_records_type ON consent_records(consent_type);
CREATE INDEX idx_consent_records_status ON consent_records(consent_given, withdrawn_at);
CREATE INDEX idx_consent_records_enterprise_id ON consent_records(enterprise_id);
CREATE INDEX idx_consent_records_expires_at ON consent_records(expires_at);

-- Consent preferences (current state view)
CREATE TABLE IF NOT EXISTS consent_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) UNIQUE,
    enterprise_id UUID REFERENCES enterprises(id),
    
    -- Current consent state
    marketing_consent BOOLEAN DEFAULT FALSE,
    analytics_consent BOOLEAN DEFAULT FALSE,
    functional_consent BOOLEAN DEFAULT TRUE,
    personalization_consent BOOLEAN DEFAULT FALSE,
    third_party_sharing_consent BOOLEAN DEFAULT FALSE,
    
    -- Preferences details
    communication_preferences JSONB DEFAULT '{}',
    data_retention_preferences JSONB DEFAULT '{}',
    
    -- Metadata
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    last_consent_review TIMESTAMPTZ,
    consent_renewal_due TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DATA RETENTION AND LIFECYCLE
-- =====================================================

-- Data retention policies
CREATE TABLE IF NOT EXISTS data_retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Policy identification
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(20) NOT NULL DEFAULT '1.0',
    
    -- Scope
    applies_to_table VARCHAR(255),
    applies_to_data_category VARCHAR(100),
    enterprise_id UUID REFERENCES enterprises(id),
    
    -- Retention rules
    retention_period_days INTEGER NOT NULL,
    retention_basis VARCHAR(100) NOT NULL, -- legal_obligation, consent, contract, etc.
    
    -- Action after retention period
    action_after_retention VARCHAR(50) NOT NULL CHECK (action_after_retention IN (
        'delete', 'anonymize', 'archive', 'review'
    )),
    
    -- Conditions and exceptions
    conditions JSONB DEFAULT '{}',
    exceptions JSONB DEFAULT '[]',
    
    -- Geographic scope
    applicable_jurisdictions JSONB DEFAULT '[]',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    effective_from TIMESTAMPTZ NOT NULL,
    effective_until TIMESTAMPTZ,
    
    -- Approval and governance
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    legal_review_completed BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data lifecycle tracking
CREATE TABLE IF NOT EXISTS data_lifecycle_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Data identification
    table_name VARCHAR(255) NOT NULL,
    record_id VARCHAR(255) NOT NULL,
    data_category VARCHAR(100),
    
    -- Event details
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'created', 'accessed', 'modified', 'anonymized', 'archived', 'deleted', 'exported'
    )),
    event_reason VARCHAR(100),
    
    -- Context
    triggered_by VARCHAR(100), -- retention_policy, user_request, legal_obligation, etc.
    policy_id UUID REFERENCES data_retention_policies(id),
    request_id UUID REFERENCES data_subject_requests(id),
    
    -- User context
    user_id UUID REFERENCES users(id),
    enterprise_id UUID REFERENCES enterprises(id),
    ip_address INET,
    
    -- Technical details
    before_state JSONB,
    after_state JSONB,
    anonymization_method VARCHAR(100),
    
    -- Audit
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    processed_by VARCHAR(100) -- system, user, automated_job
) PARTITION BY RANGE (timestamp);

-- Create partitions for data lifecycle events
CREATE TABLE data_lifecycle_events_current PARTITION OF data_lifecycle_events 
FOR VALUES FROM (NOW() - INTERVAL '30 days') TO (NOW() + INTERVAL '1 day');

CREATE TABLE data_lifecycle_events_recent PARTITION OF data_lifecycle_events 
FOR VALUES FROM (NOW() - INTERVAL '365 days') TO (NOW() - INTERVAL '30 days');

-- =====================================================
-- PRIVACY BREACH DETECTION AND MANAGEMENT
-- =====================================================

-- Privacy incidents and breaches
CREATE TABLE IF NOT EXISTS privacy_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Incident identification
    incident_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Classification
    incident_type VARCHAR(100) NOT NULL, -- data_breach, consent_violation, retention_violation, etc.
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    category VARCHAR(100), -- technical, human_error, malicious, etc.
    
    -- Scope and impact
    affected_data_categories JSONB DEFAULT '[]',
    estimated_affected_individuals INTEGER,
    affected_enterprises JSONB DEFAULT '[]',
    potential_harm_assessment TEXT,
    
    -- Discovery and reporting
    discovered_at TIMESTAMPTZ NOT NULL,
    discovered_by UUID REFERENCES users(id),
    discovery_method VARCHAR(100),
    reported_internally_at TIMESTAMPTZ,
    
    -- Regulatory reporting
    requires_authority_notification BOOLEAN DEFAULT FALSE,
    authority_notification_due TIMESTAMPTZ, -- 72 hours for GDPR
    authority_notified_at TIMESTAMPTZ,
    notification_reference VARCHAR(255),
    
    -- Individual notification
    requires_individual_notification BOOLEAN DEFAULT FALSE,
    individuals_notified_at TIMESTAMPTZ,
    notification_method VARCHAR(100),
    
    -- Response and mitigation
    immediate_actions_taken TEXT,
    containment_completed_at TIMESTAMPTZ,
    root_cause_analysis TEXT,
    remediation_plan TEXT,
    
    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN (
        'open', 'investigating', 'contained', 'resolved', 'closed'
    )),
    assigned_to UUID REFERENCES users(id),
    
    -- Resolution
    resolved_at TIMESTAMPTZ,
    resolution_summary TEXT,
    lessons_learned TEXT,
    
    -- Compliance and legal
    legal_review_completed BOOLEAN DEFAULT FALSE,
    regulatory_action_taken VARCHAR(255),
    fines_or_penalties DECIMAL(15,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for privacy incidents
CREATE INDEX idx_privacy_incidents_severity ON privacy_incidents(severity);
CREATE INDEX idx_privacy_incidents_status ON privacy_incidents(status);
CREATE INDEX idx_privacy_incidents_discovered_at ON privacy_incidents(discovered_at);
CREATE INDEX idx_privacy_incidents_notification_due ON privacy_incidents(authority_notification_due);

-- =====================================================
-- PRIVACY BY DESIGN IMPLEMENTATION
-- =====================================================

-- Data processing activities (Article 30 GDPR)
CREATE TABLE IF NOT EXISTS data_processing_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Activity identification
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    
    -- Controller/Processor information
    data_controller VARCHAR(255) NOT NULL,
    data_processor VARCHAR(255),
    joint_controllers JSONB DEFAULT '[]',
    
    -- Processing details
    purposes JSONB NOT NULL, -- Array of processing purposes
    legal_bases JSONB NOT NULL, -- Array of legal bases per purpose
    data_categories JSONB NOT NULL, -- Array of personal data categories
    data_subjects JSONB NOT NULL, -- Array of data subject categories
    
    -- Data sources and recipients
    data_sources JSONB DEFAULT '[]',
    recipients JSONB DEFAULT '[]',
    third_country_transfers JSONB DEFAULT '[]',
    transfer_safeguards JSONB DEFAULT '[]',
    
    -- Retention and security
    retention_periods JSONB DEFAULT '{}',
    security_measures JSONB DEFAULT '[]',
    
    -- Rights and obligations
    data_subject_rights JSONB DEFAULT '[]',
    automated_decision_making BOOLEAN DEFAULT FALSE,
    profiling BOOLEAN DEFAULT FALSE,
    
    -- Risk and impact
    risk_assessment_completed BOOLEAN DEFAULT FALSE,
    dpia_required BOOLEAN DEFAULT FALSE,
    dpia_completed_at TIMESTAMPTZ,
    
    -- Compliance status
    is_active BOOLEAN DEFAULT TRUE,
    last_reviewed TIMESTAMPTZ,
    next_review_due TIMESTAMPTZ,
    
    -- Approval and governance
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Privacy impact assessments (PIA/DPIA)
CREATE TABLE IF NOT EXISTS privacy_impact_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Assessment identification
    title VARCHAR(255) NOT NULL,
    reference_number VARCHAR(100) UNIQUE,
    version VARCHAR(20) DEFAULT '1.0',
    
    -- Scope
    processing_activity_id UUID REFERENCES data_processing_activities(id),
    project_name VARCHAR(255),
    project_description TEXT,
    
    -- Assessment details
    necessity_assessment TEXT,
    proportionality_assessment TEXT,
    risk_identification JSONB DEFAULT '[]',
    risk_mitigation_measures JSONB DEFAULT '[]',
    
    -- Impact analysis
    privacy_risks JSONB DEFAULT '[]',
    rights_and_freedoms_impact TEXT,
    measures_to_address_risks JSONB DEFAULT '[]',
    
    -- Consultation and review
    stakeholders_consulted JSONB DEFAULT '[]',
    dpo_consulted BOOLEAN DEFAULT FALSE,
    external_consultation_required BOOLEAN DEFAULT FALSE,
    
    -- Approval and status
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN (
        'draft', 'review', 'approved', 'rejected', 'requires_revision'
    )),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    
    -- Monitoring
    monitoring_plan TEXT,
    review_schedule VARCHAR(100),
    next_review_date TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- COMPLIANCE FUNCTIONS AND PROCEDURES
-- =====================================================

-- Function to handle data subject access requests
CREATE OR REPLACE FUNCTION process_data_access_request(
    request_id UUID,
    user_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_data JSONB := '{}';
    user_record RECORD;
    consent_data JSONB;
    usage_data JSONB;
    result JSONB;
BEGIN
    -- Get user basic information
    SELECT 
        id, email, first_name, last_name, created_at, last_login,
        subscription_tier, preferences
    INTO user_record
    FROM users
    WHERE email = user_email;
    
    IF user_record IS NULL THEN
        RETURN jsonb_build_object('error', 'User not found');
    END IF;
    
    -- Build user data
    user_data := jsonb_build_object(
        'personal_information', jsonb_build_object(
            'email', user_record.email,
            'first_name', user_record.first_name,
            'last_name', user_record.last_name,
            'account_created', user_record.created_at,
            'last_login', user_record.last_login,
            'subscription_tier', user_record.subscription_tier,
            'preferences', user_record.preferences
        )
    );
    
    -- Get consent records
    SELECT jsonb_agg(
        jsonb_build_object(
            'consent_type', consent_type,
            'purpose', purpose,
            'consent_given', consent_given,
            'given_at', given_at,
            'withdrawn_at', withdrawn_at
        )
    ) INTO consent_data
    FROM consent_records
    WHERE user_id = user_record.id;
    
    user_data := user_data || jsonb_build_object('consent_records', COALESCE(consent_data, '[]'::jsonb));
    
    -- Get API usage summary (anonymized)
    SELECT jsonb_build_object(
        'total_requests', COUNT(*),
        'first_request', MIN(timestamp),
        'last_request', MAX(timestamp),
        'average_response_time', AVG(response_time_ms)
    ) INTO usage_data
    FROM api_usage_logs
    WHERE user_id = user_record.id;
    
    user_data := user_data || jsonb_build_object('usage_summary', COALESCE(usage_data, '{}'::jsonb));
    
    -- Update request status
    UPDATE data_subject_requests
    SET 
        status = 'completed',
        response_data = user_data,
        response_delivered_at = NOW()
    WHERE id = request_id;
    
    -- Log the access
    INSERT INTO data_lifecycle_events (
        table_name, record_id, event_type, event_reason,
        user_id, request_id, processed_by
    ) VALUES (
        'users', user_record.id::text, 'accessed', 'data_subject_request',
        user_record.id, request_id, 'system'
    );
    
    RETURN user_data;
END;
$$;

-- Function to handle right to erasure (right to be forgotten)
CREATE OR REPLACE FUNCTION process_erasure_request(
    request_id UUID,
    user_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
    deleted_records JSONB := '{}';
    deletion_summary JSONB;
BEGIN
    -- Get user information
    SELECT id, email, enterprise_id INTO user_record
    FROM users
    WHERE email = user_email;
    
    IF user_record IS NULL THEN
        RETURN jsonb_build_object('error', 'User not found');
    END IF;
    
    -- Check if erasure is possible (e.g., no legal obligations)
    -- This is simplified - in production, you'd check various conditions
    
    -- Begin erasure process
    
    -- 1. Anonymize API usage logs (keep for analytics but remove PII)
    UPDATE api_usage_logs
    SET 
        user_id = NULL,
        ip_address = NULL,
        user_agent = NULL
    WHERE user_id = user_record.id;
    
    -- 2. Delete consent records
    DELETE FROM consent_records WHERE user_id = user_record.id;
    
    -- 3. Delete consent preferences
    DELETE FROM consent_preferences WHERE user_id = user_record.id;
    
    -- 4. Soft delete user record (mark as deleted, anonymize PII)
    UPDATE users
    SET 
        email = 'deleted_user_' || id || '@deleted.local',
        first_name = NULL,
        last_name = NULL,
        display_name = 'Deleted User',
        avatar_url = NULL,
        phone = NULL,
        deleted_at = NOW()
    WHERE id = user_record.id;
    
    deletion_summary := jsonb_build_object(
        'user_anonymized', true,
        'api_logs_anonymized', true,
        'consent_records_deleted', true,
        'erasure_completed_at', NOW()
    );
    
    -- Update request status
    UPDATE data_subject_requests
    SET 
        status = 'completed',
        response_data = deletion_summary,
        response_delivered_at = NOW()
    WHERE id = request_id;
    
    -- Log the erasure
    INSERT INTO data_lifecycle_events (
        table_name, record_id, event_type, event_reason,
        user_id, request_id, processed_by
    ) VALUES (
        'users', user_record.id::text, 'deleted', 'erasure_request',
        user_record.id, request_id, 'system'
    );
    
    RETURN deletion_summary;
END;
$$;

-- Function to check data retention compliance
CREATE OR REPLACE FUNCTION check_retention_compliance()
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    policy_record RECORD;
    expired_data_count INTEGER := 0;
    total_checks INTEGER := 0;
    compliance_summary JSONB := '{}';
BEGIN
    -- Check each active retention policy
    FOR policy_record IN
        SELECT * FROM data_retention_policies 
        WHERE is_active = TRUE 
        AND effective_from <= NOW()
        AND (effective_until IS NULL OR effective_until > NOW())
    LOOP
        total_checks := total_checks + 1;
        
        -- This is a simplified example - in production, you'd have more sophisticated logic
        -- to identify and handle expired data based on the policy
        
        CASE policy_record.applies_to_table
            WHEN 'api_usage_logs' THEN
                SELECT COUNT(*) INTO expired_data_count
                FROM api_usage_logs
                WHERE timestamp < NOW() - (policy_record.retention_period_days || ' days')::INTERVAL;
                
            WHEN 'analytics_events' THEN
                SELECT COUNT(*) INTO expired_data_count
                FROM analytics_events
                WHERE timestamp < NOW() - (policy_record.retention_period_days || ' days')::INTERVAL;
                
            ELSE
                expired_data_count := 0;
        END CASE;
        
        -- Store compliance check result
        compliance_summary := compliance_summary || jsonb_build_object(
            policy_record.name, jsonb_build_object(
                'expired_records', expired_data_count,
                'action_required', expired_data_count > 0
            )
        );
    END LOOP;
    
    RETURN jsonb_build_object(
        'policies_checked', total_checks,
        'compliance_details', compliance_summary,
        'check_timestamp', NOW()
    );
END;
$$;

-- Function to generate privacy compliance report
CREATE OR REPLACE FUNCTION generate_privacy_compliance_report(
    report_period_days INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    report_start TIMESTAMPTZ := NOW() - (report_period_days || ' days')::INTERVAL;
    report_end TIMESTAMPTZ := NOW();
    report JSONB := '{}';
    request_stats JSONB;
    consent_stats JSONB;
    incident_stats JSONB;
BEGIN
    -- Data subject request statistics
    SELECT jsonb_build_object(
        'total_requests', COUNT(*),
        'by_type', jsonb_object_agg(request_type, type_count),
        'by_status', jsonb_object_agg(status, status_count),
        'average_response_time_days', AVG(
            EXTRACT(days FROM (COALESCE(response_delivered_at, NOW()) - created_at))
        )
    ) INTO request_stats
    FROM (
        SELECT 
            request_type,
            status,
            created_at,
            response_delivered_at,
            COUNT(*) OVER (PARTITION BY request_type) as type_count,
            COUNT(*) OVER (PARTITION BY status) as status_count
        FROM data_subject_requests
        WHERE created_at BETWEEN report_start AND report_end
    ) sub;
    
    -- Consent statistics
    SELECT jsonb_build_object(
        'new_consents', COUNT(CASE WHEN consent_given = true THEN 1 END),
        'consent_withdrawals', COUNT(CASE WHEN withdrawn_at IS NOT NULL THEN 1 END),
        'by_type', jsonb_object_agg(consent_type, consent_count)
    ) INTO consent_stats
    FROM (
        SELECT 
            consent_type,
            consent_given,
            withdrawn_at,
            COUNT(*) OVER (PARTITION BY consent_type) as consent_count
        FROM consent_records
        WHERE given_at BETWEEN report_start AND report_end
           OR withdrawn_at BETWEEN report_start AND report_end
    ) sub;
    
    -- Privacy incident statistics
    SELECT jsonb_build_object(
        'total_incidents', COUNT(*),
        'by_severity', jsonb_object_agg(severity, severity_count),
        'regulatory_notifications', COUNT(CASE WHEN authority_notified_at IS NOT NULL THEN 1 END)
    ) INTO incident_stats
    FROM (
        SELECT 
            severity,
            authority_notified_at,
            COUNT(*) OVER (PARTITION BY severity) as severity_count
        FROM privacy_incidents
        WHERE discovered_at BETWEEN report_start AND report_end
    ) sub;
    
    -- Compile final report
    report := jsonb_build_object(
        'report_period', jsonb_build_object(
            'start', report_start,
            'end', report_end,
            'days', report_period_days
        ),
        'data_subject_requests', COALESCE(request_stats, '{}'::jsonb),
        'consent_management', COALESCE(consent_stats, '{}'::jsonb),
        'privacy_incidents', COALESCE(incident_stats, '{}'::jsonb),
        'generated_at', NOW()
    );
    
    RETURN report;
END;
$$;

-- =====================================================
-- AUTOMATED COMPLIANCE MONITORING
-- =====================================================

-- Create monitoring job for retention compliance
INSERT INTO performance_metrics (metric_name, value, tags) VALUES
    ('retention_compliance_check', 1, '{"schedule": "daily", "function": "check_retention_compliance"}'),
    ('privacy_report_generation', 1, '{"schedule": "weekly", "function": "generate_privacy_compliance_report"}'),
    ('consent_renewal_check', 1, '{"schedule": "daily", "description": "Check for consents requiring renewal"}');

-- Enable RLS on compliance tables
ALTER TABLE data_subject_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_lifecycle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_processing_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_impact_assessments ENABLE ROW LEVEL SECURITY;

-- RLS policies for compliance tables (simplified - in production, these would be more nuanced)
CREATE POLICY "Users can view their own data subject requests" ON data_subject_requests
    FOR SELECT TO authenticated
    USING (subject_email = (SELECT email FROM users WHERE id = auth.uid()));

CREATE POLICY "Privacy officers can manage data subject requests" ON data_subject_requests
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role_in_enterprise IN ('admin', 'privacy_officer')
        )
    );

CREATE POLICY "Users can view their own consent records" ON consent_records
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can view their own consent preferences" ON consent_preferences
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Comments for documentation
COMMENT ON TABLE data_subject_requests IS 'GDPR/CCPA data subject rights requests with full audit trail';
COMMENT ON TABLE consent_records IS 'Granular consent tracking with legal basis and evidence';
COMMENT ON TABLE consent_preferences IS 'Current consent state for each user';
COMMENT ON TABLE data_retention_policies IS 'Data retention policies with automated compliance checking';
COMMENT ON TABLE data_lifecycle_events IS 'Complete audit trail of data lifecycle events';
COMMENT ON TABLE privacy_incidents IS 'Privacy breach and incident management with regulatory reporting';
COMMENT ON TABLE data_processing_activities IS 'Article 30 GDPR processing activities register';
COMMENT ON TABLE privacy_impact_assessments IS 'Privacy impact assessments (DPIA) management';

COMMENT ON FUNCTION process_data_access_request IS 'Automated processing of data subject access requests';
COMMENT ON FUNCTION process_erasure_request IS 'Automated processing of right to erasure requests';
COMMENT ON FUNCTION check_retention_compliance IS 'Automated data retention compliance checking';
COMMENT ON FUNCTION generate_privacy_compliance_report IS 'Generate comprehensive privacy compliance reports';