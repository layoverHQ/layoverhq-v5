-- Enterprise API Credentials Management System
-- Secure storage and management of third-party API credentials

-- Create api_credentials table for secure credential storage
CREATE TABLE IF NOT EXISTS api_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL, -- amadeus, viator, opensky, etc.
    credential_type VARCHAR(50) NOT NULL DEFAULT 'api_key' CHECK (credential_type IN ('api_key', 'oauth', 'bearer_token', 'basic_auth', 'custom')),
    environment VARCHAR(50) NOT NULL DEFAULT 'production' CHECK (environment IN ('production', 'staging', 'development', 'sandbox')),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL for global credentials
    
    -- Encrypted credential data
    encrypted_data JSONB NOT NULL, -- Stores encrypted credentials
    encryption_key_id VARCHAR(255) NOT NULL, -- Reference to encryption key
    
    -- Configuration
    config JSONB DEFAULT '{}', -- Additional configuration like base URLs, timeouts
    rate_limits JSONB DEFAULT '{}', -- Rate limiting configuration
    
    -- Status and metadata
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_test_mode BOOLEAN NOT NULL DEFAULT false,
    last_used TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Ensure unique credentials per provider/environment/tenant
    UNIQUE NULLS NOT DISTINCT (provider, environment, tenant_id)
);

-- Create indexes for api_credentials
CREATE INDEX IF NOT EXISTS idx_api_credentials_provider ON api_credentials(provider);
CREATE INDEX IF NOT EXISTS idx_api_credentials_tenant_id ON api_credentials(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_credentials_environment ON api_credentials(environment);
CREATE INDEX IF NOT EXISTS idx_api_credentials_active ON api_credentials(is_active);
CREATE INDEX IF NOT EXISTS idx_api_credentials_last_used ON api_credentials(last_used);

-- Create api_credential_rotations table for key rotation tracking
CREATE TABLE IF NOT EXISTS api_credential_rotations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    credential_id UUID REFERENCES api_credentials(id) ON DELETE CASCADE,
    old_encryption_key_id VARCHAR(255),
    new_encryption_key_id VARCHAR(255),
    rotation_type VARCHAR(50) NOT NULL CHECK (rotation_type IN ('manual', 'automatic', 'emergency')),
    reason TEXT,
    rotated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    rotated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create api_usage_logs table for tracking API usage
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    credential_id UUID REFERENCES api_credentials(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    endpoint VARCHAR(500),
    method VARCHAR(10),
    status_code INTEGER,
    response_time_ms INTEGER,
    request_size_bytes INTEGER,
    response_size_bytes INTEGER,
    error_message TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for api_usage_logs
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_credential_id ON api_usage_logs(credential_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_tenant_id ON api_usage_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON api_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_status_code ON api_usage_logs(status_code);

-- Create api_quota_limits table for managing API quotas
CREATE TABLE IF NOT EXISTS api_quota_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    credential_id UUID REFERENCES api_credentials(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    quota_type VARCHAR(50) NOT NULL CHECK (quota_type IN ('requests_per_minute', 'requests_per_hour', 'requests_per_day', 'requests_per_month')),
    limit_value INTEGER NOT NULL,
    current_usage INTEGER DEFAULT 0,
    reset_time TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    UNIQUE(credential_id, quota_type)
);

-- Create indexes for api_quota_limits
CREATE INDEX IF NOT EXISTS idx_api_quota_limits_credential_id ON api_quota_limits(credential_id);
CREATE INDEX IF NOT EXISTS idx_api_quota_limits_tenant_id ON api_quota_limits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_quota_limits_reset_time ON api_quota_limits(reset_time);

-- Enable RLS on all tables
ALTER TABLE api_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_credential_rotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_quota_limits ENABLE ROW LEVEL SECURITY;

-- RLS policies for api_credentials
CREATE POLICY "Super admin can manage all credentials" ON api_credentials
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'super_admin'
        )
    );

CREATE POLICY "Admin can manage non-global credentials" ON api_credentials
    FOR ALL TO authenticated
    USING (
        tenant_id IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Tenant admins can manage their credentials" ON api_credentials
    FOR ALL TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Users can read active credentials for their operations" ON api_credentials
    FOR SELECT TO authenticated
    USING (
        is_active = true AND
        (tenant_id IS NULL OR tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid()
        ))
    );

-- Functions for credential management

-- Function to update API credential usage
CREATE OR REPLACE FUNCTION update_api_credential_usage(
    credential_id_param UUID,
    endpoint_param VARCHAR DEFAULT NULL,
    status_code_param INTEGER DEFAULT NULL,
    response_time_param INTEGER DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update usage count and last used timestamp
    UPDATE api_credentials 
    SET 
        usage_count = usage_count + 1,
        last_used = now()
    WHERE id = credential_id_param;
    
    -- Log the usage
    INSERT INTO api_usage_logs (
        credential_id,
        endpoint,
        status_code,
        response_time_ms,
        user_id,
        created_at
    ) VALUES (
        credential_id_param,
        endpoint_param,
        status_code_param,
        response_time_param,
        auth.uid(),
        now()
    );
END;
$$;

-- Function to check API quota
CREATE OR REPLACE FUNCTION check_api_quota(
    credential_id_param UUID,
    quota_type_param VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    quota_record api_quota_limits%ROWTYPE;
    current_time TIMESTAMP WITH TIME ZONE := now();
BEGIN
    -- Get quota limit
    SELECT * INTO quota_record
    FROM api_quota_limits
    WHERE credential_id = credential_id_param
    AND quota_type = quota_type_param
    AND is_active = true;
    
    -- If no quota limit found, allow access
    IF quota_record.id IS NULL THEN
        RETURN true;
    END IF;
    
    -- Check if quota period has reset
    IF quota_record.reset_time <= current_time THEN
        -- Reset the quota
        UPDATE api_quota_limits
        SET 
            current_usage = 0,
            reset_time = CASE 
                WHEN quota_type_param = 'requests_per_minute' THEN current_time + INTERVAL '1 minute'
                WHEN quota_type_param = 'requests_per_hour' THEN current_time + INTERVAL '1 hour'
                WHEN quota_type_param = 'requests_per_day' THEN current_time + INTERVAL '1 day'
                WHEN quota_type_param = 'requests_per_month' THEN current_time + INTERVAL '1 month'
            END
        WHERE id = quota_record.id;
        
        quota_record.current_usage := 0;
    END IF;
    
    -- Check if under limit
    RETURN quota_record.current_usage < quota_record.limit_value;
END;
$$;

-- Function to increment API quota usage
CREATE OR REPLACE FUNCTION increment_api_quota_usage(
    credential_id_param UUID,
    quota_type_param VARCHAR
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE api_quota_limits
    SET current_usage = current_usage + 1
    WHERE credential_id = credential_id_param
    AND quota_type = quota_type_param
    AND is_active = true;
END;
$$;

-- Function to rotate API credentials
CREATE OR REPLACE FUNCTION rotate_api_credential(
    credential_id_param UUID,
    new_encrypted_data JSONB,
    new_encryption_key_id VARCHAR,
    rotation_type_param VARCHAR DEFAULT 'manual',
    reason_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    old_key_id VARCHAR;
BEGIN
    -- Get current encryption key ID
    SELECT encryption_key_id INTO old_key_id
    FROM api_credentials
    WHERE id = credential_id_param;
    
    -- Update the credential
    UPDATE api_credentials
    SET 
        encrypted_data = new_encrypted_data,
        encryption_key_id = new_encryption_key_id,
        updated_at = now(),
        updated_by = auth.uid()
    WHERE id = credential_id_param;
    
    -- Log the rotation
    INSERT INTO api_credential_rotations (
        credential_id,
        old_encryption_key_id,
        new_encryption_key_id,
        rotation_type,
        reason,
        rotated_by
    ) VALUES (
        credential_id_param,
        old_key_id,
        new_encryption_key_id,
        rotation_type_param,
        reason_param,
        auth.uid()
    );
    
    RETURN true;
END;
$$;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_api_credentials_timestamp
    BEFORE UPDATE ON api_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_config_timestamp();

CREATE TRIGGER update_api_quota_limits_timestamp
    BEFORE UPDATE ON api_quota_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_config_timestamp();

-- Insert default API credentials configuration
INSERT INTO system_configs (key, value, type, category, description, environment) VALUES
    ('api.rate_limit.default_rpm', '60', 'number', 'api', 'Default API requests per minute', 'all'),
    ('api.rate_limit.burst_limit', '10', 'number', 'api', 'Burst limit for API requests', 'all'),
    ('api.timeout.default_ms', '30000', 'number', 'api', 'Default API timeout in milliseconds', 'all'),
    ('api.retry.max_attempts', '3', 'number', 'api', 'Maximum retry attempts for failed API calls', 'all'),
    ('api.retry.backoff_ms', '1000', 'number', 'api', 'Backoff time between retries in milliseconds', 'all'),
    ('encryption.key_rotation_days', '90', 'number', 'security', 'Days between automatic key rotations', 'all'),
    ('monitoring.api_usage_retention_days', '90', 'number', 'monitoring', 'Days to retain API usage logs', 'all')
ON CONFLICT (key, tenant_id, environment) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE api_credentials IS 'Secure storage of third-party API credentials with encryption';
COMMENT ON TABLE api_credential_rotations IS 'Audit trail for API credential rotations';
COMMENT ON TABLE api_usage_logs IS 'Detailed logging of API usage for monitoring and billing';
COMMENT ON TABLE api_quota_limits IS 'API quota management and rate limiting';