-- Enterprise Session Management Tables
-- Advanced session management with security controls and monitoring

-- Create enterprise_sessions table
CREATE TABLE IF NOT EXISTS enterprise_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    
    -- Device information
    device_type VARCHAR(20) DEFAULT 'unknown' CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown')),
    device_id VARCHAR(32) NOT NULL,
    browser VARCHAR(50),
    operating_system VARCHAR(50),
    user_agent TEXT,
    
    -- Location information
    ip_address INET NOT NULL,
    country VARCHAR(2),
    city VARCHAR(100),
    timezone VARCHAR(50),
    is_vpn BOOLEAN DEFAULT false,
    
    -- Security information
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 10),
    is_trusted_device BOOLEAN DEFAULT false,
    mfa_verified BOOLEAN DEFAULT false,
    login_method VARCHAR(20) DEFAULT 'password',
    
    -- Activity tracking
    request_count INTEGER DEFAULT 0,
    last_endpoint VARCHAR(255),
    idle_time_seconds INTEGER DEFAULT 0,
    
    -- Session lifecycle
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    terminated_at TIMESTAMP WITH TIME ZONE,
    termination_reason VARCHAR(50),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create security_alerts table
CREATE TABLE IF NOT EXISTS security_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN (
        'suspicious_login', 'concurrent_limit_exceeded', 'location_anomaly', 
        'session_hijack_attempt', 'brute_force_detected', 'impossible_travel'
    )),
    severity VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES enterprise_sessions(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Alert details
    details JSONB DEFAULT '{}',
    actions_taken JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
    
    -- Resolution
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create trusted_devices table
CREATE TABLE IF NOT EXISTS trusted_devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id VARCHAR(32) NOT NULL,
    device_name VARCHAR(100),
    device_fingerprint JSONB NOT NULL,
    
    -- Trust information
    trust_level INTEGER DEFAULT 1 CHECK (trust_level >= 1 AND trust_level <= 10),
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
    usage_count INTEGER DEFAULT 0,
    
    -- Status
    is_trusted BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    revoke_reason VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    UNIQUE(user_id, device_id)
);

-- Create session_security_policies table
CREATE TABLE IF NOT EXISTS session_security_policies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Session limits
    max_concurrent_sessions INTEGER DEFAULT 5,
    session_timeout_minutes INTEGER DEFAULT 60,
    idle_timeout_minutes INTEGER DEFAULT 30,
    session_rotation_hours INTEGER DEFAULT 24,
    
    -- Security settings
    require_mfa_for_new_devices BOOLEAN DEFAULT true,
    allow_concurrent_from_same_ip BOOLEAN DEFAULT false,
    block_suspicious_locations BOOLEAN DEFAULT true,
    enforce_device_registration BOOLEAN DEFAULT false,
    minimum_password_strength INTEGER DEFAULT 3,
    
    -- Risk thresholds
    max_risk_score_without_mfa INTEGER DEFAULT 5,
    auto_terminate_risk_score INTEGER DEFAULT 8,
    alert_risk_score INTEGER DEFAULT 6,
    
    -- Rate limiting
    max_failed_attempts_per_hour INTEGER DEFAULT 5,
    lockout_duration_minutes INTEGER DEFAULT 30,
    
    -- Geo-security
    allowed_countries JSONB DEFAULT '[]',
    blocked_countries JSONB DEFAULT '[]',
    require_approval_for_new_countries BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Only one policy per tenant (NULL for global)
    UNIQUE NULLS NOT DISTINCT (tenant_id)
);

-- Create session_activity_logs table
CREATE TABLE IF NOT EXISTS session_activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES enterprise_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Activity details
    activity_type VARCHAR(50) NOT NULL,
    endpoint VARCHAR(255),
    method VARCHAR(10),
    status_code INTEGER,
    response_time_ms INTEGER,
    
    -- Security context
    ip_address INET,
    user_agent TEXT,
    risk_score INTEGER DEFAULT 0,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for enterprise session tables
CREATE INDEX IF NOT EXISTS idx_enterprise_sessions_user_id ON enterprise_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_sessions_tenant_id ON enterprise_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_sessions_token_hash ON enterprise_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_enterprise_sessions_device_id ON enterprise_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_sessions_ip_address ON enterprise_sessions(ip_address);
CREATE INDEX IF NOT EXISTS idx_enterprise_sessions_active ON enterprise_sessions(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_enterprise_sessions_last_activity ON enterprise_sessions(last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_enterprise_sessions_risk_score ON enterprise_sessions(risk_score DESC);

CREATE INDEX IF NOT EXISTS idx_security_alerts_user_id ON security_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_session_id ON security_alerts(session_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_tenant_id ON security_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_type ON security_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_status ON security_alerts(status);
CREATE INDEX IF NOT EXISTS idx_security_alerts_created_at ON security_alerts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id ON trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_device_id ON trusted_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_active ON trusted_devices(is_active, is_trusted);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_last_seen ON trusted_devices(last_seen DESC);

CREATE INDEX IF NOT EXISTS idx_session_security_policies_tenant_id ON session_security_policies(tenant_id);

CREATE INDEX IF NOT EXISTS idx_session_activity_logs_session_id ON session_activity_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_session_activity_logs_user_id ON session_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_session_activity_logs_activity_type ON session_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_session_activity_logs_created_at ON session_activity_logs(created_at DESC);

-- Enable RLS on all tables
ALTER TABLE enterprise_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_security_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for enterprise_sessions
CREATE POLICY "Admin users can manage all sessions" ON enterprise_sessions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Users can manage their own sessions" ON enterprise_sessions
    FOR ALL TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Tenant admins can manage tenant sessions" ON enterprise_sessions
    FOR ALL TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- RLS policies for security_alerts
CREATE POLICY "Admin users can manage all alerts" ON security_alerts
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Users can view their own alerts" ON security_alerts
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Tenant admins can manage tenant alerts" ON security_alerts
    FOR ALL TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- RLS policies for trusted_devices
CREATE POLICY "Users can manage their own trusted devices" ON trusted_devices
    FOR ALL TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admin users can view all trusted devices" ON trusted_devices
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Functions for session management

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE enterprise_sessions 
    SET 
        is_active = false,
        terminated_at = now(),
        termination_reason = 'expired'
    WHERE is_active = true 
    AND expires_at < now();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    -- Log cleanup activity
    INSERT INTO enterprise_audit_logs (
        event_type,
        entity_type,
        action,
        metadata,
        risk_score
    ) VALUES (
        'maintenance',
        'session',
        'cleanup_expired',
        jsonb_build_object(
            'expired_count', expired_count,
            'cleanup_time', now()
        ),
        1
    );
    
    RETURN expired_count;
END;
$$;

-- Function to get session security summary
CREATE OR REPLACE FUNCTION get_session_security_summary(
    user_id_param UUID DEFAULT NULL,
    tenant_id_param UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    summary JSONB;
    base_query TEXT;
    where_clause TEXT := '';
BEGIN
    -- Build dynamic where clause
    IF user_id_param IS NOT NULL THEN
        where_clause := where_clause || ' AND user_id = $1';
    END IF;
    
    IF tenant_id_param IS NOT NULL THEN
        where_clause := where_clause || ' AND tenant_id = $2';
    END IF;
    
    -- Remove leading AND
    IF where_clause != '' THEN
        where_clause := 'WHERE' || substring(where_clause from 5);
    END IF;
    
    -- Get summary data
    base_query := 'SELECT 
        COUNT(*) as total_sessions,
        COUNT(*) FILTER (WHERE is_active = true) as active_sessions,
        COUNT(*) FILTER (WHERE risk_score >= 6) as high_risk_sessions,
        COUNT(DISTINCT device_id) as unique_devices,
        COUNT(*) FILTER (WHERE is_trusted_device = true) as trusted_device_sessions,
        AVG(risk_score) as avg_risk_score,
        COUNT(*) FILTER (WHERE created_at > now() - interval ''24 hours'') as sessions_24h
    FROM enterprise_sessions ' || where_clause;
    
    EXECUTE base_query INTO summary USING user_id_param, tenant_id_param;
    
    RETURN summary;
END;
$$;

-- Function to detect suspicious session patterns
CREATE OR REPLACE FUNCTION detect_suspicious_session_patterns()
RETURNS TABLE(
    user_id UUID,
    pattern_type TEXT,
    risk_score INTEGER,
    details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Detect multiple simultaneous logins from different locations
    RETURN QUERY
    SELECT 
        es.user_id,
        'multiple_locations'::TEXT as pattern_type,
        8 as risk_score,
        jsonb_build_object(
            'ip_addresses', array_agg(DISTINCT es.ip_address),
            'session_count', count(*),
            'countries', array_agg(DISTINCT es.country)
        ) as details
    FROM enterprise_sessions es
    WHERE es.is_active = true
    AND es.created_at > now() - interval '1 hour'
    GROUP BY es.user_id
    HAVING count(DISTINCT es.ip_address) > 1
    AND count(DISTINCT es.country) > 1;
    
    -- Detect rapid session creation
    RETURN QUERY
    SELECT 
        es.user_id,
        'rapid_sessions'::TEXT as pattern_type,
        6 as risk_score,
        jsonb_build_object(
            'session_count', count(*),
            'time_window', '10 minutes',
            'ip_addresses', array_agg(DISTINCT es.ip_address)
        ) as details
    FROM enterprise_sessions es
    WHERE es.created_at > now() - interval '10 minutes'
    GROUP BY es.user_id
    HAVING count(*) > 5;
END;
$$;

-- Function to automatically handle high-risk sessions
CREATE OR REPLACE FUNCTION handle_high_risk_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    handled_count INTEGER := 0;
    session_record RECORD;
BEGIN
    -- Get high-risk active sessions
    FOR session_record IN
        SELECT id, user_id, risk_score, ip_address, device_id
        FROM enterprise_sessions
        WHERE is_active = true 
        AND risk_score >= 8
        AND created_at > now() - interval '1 hour'
    LOOP
        -- Terminate high-risk session
        UPDATE enterprise_sessions
        SET 
            is_active = false,
            terminated_at = now(),
            termination_reason = 'high_risk_auto_termination'
        WHERE id = session_record.id;
        
        -- Create security alert
        INSERT INTO security_alerts (
            alert_type,
            severity,
            user_id,
            session_id,
            details,
            actions_taken
        ) VALUES (
            'suspicious_login',
            'high',
            session_record.user_id,
            session_record.id,
            jsonb_build_object(
                'risk_score', session_record.risk_score,
                'ip_address', session_record.ip_address,
                'device_id', session_record.device_id,
                'auto_terminated', true
            ),
            jsonb_build_array('session_terminated', 'alert_created')
        );
        
        handled_count := handled_count + 1;
    END LOOP;
    
    RETURN handled_count;
END;
$$;

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trusted_devices_timestamp
    BEFORE UPDATE ON trusted_devices
    FOR EACH ROW
    EXECUTE FUNCTION update_session_timestamp();

CREATE TRIGGER update_session_security_policies_timestamp
    BEFORE UPDATE ON session_security_policies
    FOR EACH ROW
    EXECUTE FUNCTION update_session_timestamp();

-- Insert default security policy
INSERT INTO session_security_policies (
    tenant_id,
    max_concurrent_sessions,
    session_timeout_minutes,
    idle_timeout_minutes,
    require_mfa_for_new_devices,
    block_suspicious_locations,
    max_risk_score_without_mfa,
    auto_terminate_risk_score
) VALUES (
    NULL, -- Global policy
    5,
    60,
    30,
    true,
    true,
    5,
    8
) ON CONFLICT (tenant_id) DO NOTHING;

-- Schedule automatic functions (would be called by cron jobs)
COMMENT ON FUNCTION cleanup_expired_sessions() IS 'Automatically cleanup expired sessions - run every 5 minutes';
COMMENT ON FUNCTION handle_high_risk_sessions() IS 'Automatically handle high-risk sessions - run every minute';
COMMENT ON FUNCTION detect_suspicious_session_patterns() IS 'Detect suspicious session patterns for security monitoring';

-- Table comments for documentation
COMMENT ON TABLE enterprise_sessions IS 'Enterprise-grade session management with security tracking';
COMMENT ON TABLE security_alerts IS 'Security alerts and incidents for monitoring and response';
COMMENT ON TABLE trusted_devices IS 'User trusted devices for enhanced security';
COMMENT ON TABLE session_security_policies IS 'Configurable security policies for session management';
COMMENT ON TABLE session_activity_logs IS 'Detailed activity logs for session monitoring';