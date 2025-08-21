-- Enterprise Configuration Management System
-- Zero-CLI Administration with Multi-Tenant Support

-- Create system_configs table for dynamic configuration
CREATE TABLE IF NOT EXISTS system_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(255) NOT NULL,
    value JSONB NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('string', 'number', 'boolean', 'json', 'encrypted')),
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    description TEXT,
    tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    environment VARCHAR(50) NOT NULL DEFAULT 'all' CHECK (environment IN ('production', 'staging', 'development', 'all')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Unique constraint for global configs (no tenant)
    UNIQUE NULLS NOT DISTINCT (key, tenant_id, environment)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_system_configs_key ON system_configs(key) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_system_configs_tenant ON system_configs(tenant_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_system_configs_category ON system_configs(category);
CREATE INDEX IF NOT EXISTS idx_system_configs_environment ON system_configs(environment);

-- Create config_snapshots table for rollback capability
CREATE TABLE IF NOT EXISTS config_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    configs JSONB NOT NULL,
    tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create index for snapshots
CREATE INDEX IF NOT EXISTS idx_config_snapshots_tenant ON config_snapshots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_config_snapshots_created_at ON config_snapshots(created_at DESC);

-- Create config_audit_logs table for audit trail
CREATE TABLE IF NOT EXISTS config_audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    config_key VARCHAR(255) NOT NULL,
    config_value JSONB,
    old_value JSONB,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for audit logs
CREATE INDEX IF NOT EXISTS idx_config_audit_logs_config_key ON config_audit_logs(config_key);
CREATE INDEX IF NOT EXISTS idx_config_audit_logs_user_id ON config_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_config_audit_logs_tenant_id ON config_audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_config_audit_logs_created_at ON config_audit_logs(created_at DESC);

-- Create tenants table for multi-tenant support
CREATE TABLE IF NOT EXISTS tenants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    domain VARCHAR(255),
    subdomain VARCHAR(100),
    owner_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
    settings JSONB DEFAULT '{}',
    features JSONB DEFAULT '{}',
    limits JSONB DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial', 'churned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for tenants
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(domain);
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_owner_id ON tenants(owner_id);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- Create tenant_users table for multi-tenant user relationships
CREATE TABLE IF NOT EXISTS tenant_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    permissions JSONB DEFAULT '[]',
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    invited_at TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
    
    UNIQUE(tenant_id, user_id)
);

-- Create index for tenant users
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_role ON tenant_users(role);
CREATE INDEX IF NOT EXISTS idx_tenant_users_status ON tenant_users(status);

-- Create feature_flags table for dynamic feature management
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_segment JSONB DEFAULT '{}',
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    conditions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    UNIQUE NULLS NOT DISTINCT (key, tenant_id)
);

-- Create index for feature flags
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_tenant_id ON feature_flags(tenant_id);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(is_enabled);

-- Create enterprise_audit_logs table for comprehensive audit trail
CREATE TABLE IF NOT EXISTS enterprise_audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    risk_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for enterprise audit logs
CREATE INDEX IF NOT EXISTS idx_enterprise_audit_logs_event_type ON enterprise_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_enterprise_audit_logs_entity_type ON enterprise_audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_enterprise_audit_logs_actor_id ON enterprise_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_audit_logs_tenant_id ON enterprise_audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_audit_logs_created_at ON enterprise_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enterprise_audit_logs_risk_score ON enterprise_audit_logs(risk_score DESC);

-- Create performance_metrics table for monitoring
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_name VARCHAR(255) NOT NULL,
    value NUMERIC NOT NULL,
    tags JSONB DEFAULT '{}',
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for performance metrics
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_tenant_id ON performance_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_recorded_at ON performance_metrics(recorded_at DESC);

-- Insert default system configurations
INSERT INTO system_configs (key, value, type, category, description, environment) VALUES
    ('app.name', '"LayoverHQ"', 'string', 'application', 'Application name displayed to users', 'all'),
    ('app.environment', '"production"', 'string', 'application', 'Current environment', 'all'),
    ('features.hacker_mode', 'true', 'boolean', 'features', 'Enable hacker mode interface', 'all'),
    ('features.ai_recommendations', 'true', 'boolean', 'features', 'Enable AI-powered recommendations', 'all'),
    ('rate_limits.api_requests_per_minute', '60', 'number', 'security', 'API requests per minute per user', 'all'),
    ('cache.ttl_seconds', '3600', 'number', 'performance', 'Default cache TTL in seconds', 'all'),
    ('integrations.amadeus.enabled', 'true', 'boolean', 'integrations', 'Enable Amadeus flight API', 'all'),
    ('integrations.viator.enabled', 'true', 'boolean', 'integrations', 'Enable Viator experiences API', 'all'),
    ('ui.theme.primary_color', '"#3b82f6"', 'string', 'ui', 'Primary brand color', 'all'),
    ('monitoring.error_tracking', 'true', 'boolean', 'monitoring', 'Enable error tracking and reporting', 'all'),
    ('security.session_timeout_minutes', '60', 'number', 'security', 'User session timeout in minutes', 'all')
ON CONFLICT (key, tenant_id, environment) DO NOTHING;

-- Create RLS policies for system_configs
ALTER TABLE system_configs ENABLE ROW LEVEL SECURITY;

-- Policy for admin users to access all configs
CREATE POLICY "Admin users can manage all system configs" ON system_configs
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policy for tenant owners to manage their configs
CREATE POLICY "Tenant owners can manage their configs" ON system_configs
    FOR ALL
    TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- Policy for users to read global configs
CREATE POLICY "Users can read global configs" ON system_configs
    FOR SELECT
    TO authenticated
    USING (tenant_id IS NULL AND is_active = true);

-- Create RLS policies for other tables
ALTER TABLE config_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Policies for config_snapshots
CREATE POLICY "Admin users can manage all snapshots" ON config_snapshots
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Tenant admins can manage their snapshots" ON config_snapshots
    FOR ALL TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- Policies for tenants
CREATE POLICY "Users can view their tenants" ON tenants
    FOR SELECT TO authenticated
    USING (
        id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Tenant owners can manage their tenant" ON tenants
    FOR ALL TO authenticated
    USING (
        id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() 
            AND role = 'owner'
        )
    );

-- Policies for tenant_users
CREATE POLICY "Users can view their tenant memberships" ON tenant_users
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Tenant admins can manage tenant users" ON tenant_users
    FOR ALL TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- Functions for configuration management
CREATE OR REPLACE FUNCTION get_config_value(
    config_key TEXT,
    tenant_id_param UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Try to get tenant-specific config first
    IF tenant_id_param IS NOT NULL THEN
        SELECT value INTO result
        FROM system_configs
        WHERE key = config_key
        AND tenant_id = tenant_id_param
        AND is_active = true
        LIMIT 1;
        
        IF result IS NOT NULL THEN
            RETURN result;
        END IF;
    END IF;
    
    -- Fall back to global config
    SELECT value INTO result
    FROM system_configs
    WHERE key = config_key
    AND tenant_id IS NULL
    AND is_active = true
    LIMIT 1;
    
    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION update_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_system_configs_timestamp
    BEFORE UPDATE ON system_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_config_timestamp();

CREATE TRIGGER update_tenants_timestamp
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_config_timestamp();

CREATE TRIGGER update_feature_flags_timestamp
    BEFORE UPDATE ON feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION update_config_timestamp();

-- Create function to audit configuration changes
CREATE OR REPLACE FUNCTION audit_config_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO config_audit_logs (
            action, config_key, config_value, old_value, user_id, tenant_id
        ) VALUES (
            'UPDATE', NEW.key, NEW.value, OLD.value, NEW.updated_by, NEW.tenant_id
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO config_audit_logs (
            action, config_key, config_value, user_id, tenant_id
        ) VALUES (
            'CREATE', NEW.key, NEW.value, NEW.updated_by, NEW.tenant_id
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO config_audit_logs (
            action, config_key, old_value, tenant_id
        ) VALUES (
            'DELETE', OLD.key, OLD.value, OLD.tenant_id
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for config audit
CREATE TRIGGER audit_system_configs
    AFTER INSERT OR UPDATE OR DELETE ON system_configs
    FOR EACH ROW
    EXECUTE FUNCTION audit_config_changes();

COMMENT ON TABLE system_configs IS 'Dynamic system configurations with multi-tenant support';
COMMENT ON TABLE config_snapshots IS 'Configuration snapshots for rollback capability';
COMMENT ON TABLE config_audit_logs IS 'Audit trail for configuration changes';
COMMENT ON TABLE tenants IS 'Multi-tenant organization management';
COMMENT ON TABLE tenant_users IS 'User membership in tenants with roles';
COMMENT ON TABLE feature_flags IS 'Dynamic feature flag management';
COMMENT ON TABLE enterprise_audit_logs IS 'Comprehensive enterprise audit logging';
COMMENT ON TABLE performance_metrics IS 'Performance and monitoring metrics';