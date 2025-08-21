-- Configuration Rollback and Backup System Tables
-- Advanced rollback capabilities with automatic backups and change tracking

-- Create config_rollback_plans table
CREATE TABLE IF NOT EXISTS config_rollback_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    snapshot_id UUID REFERENCES config_snapshots(id) ON DELETE CASCADE,
    target_snapshot_id UUID REFERENCES config_snapshots(id) ON DELETE CASCADE,
    changes JSONB NOT NULL,
    validation_results JSONB NOT NULL,
    estimated_downtime_seconds INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create config_rollback_executions table
CREATE TABLE IF NOT EXISTS config_rollback_executions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rollback_plan_id UUID REFERENCES config_rollback_plans(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'aborted')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    current_step TEXT,
    steps_completed INTEGER DEFAULT 0,
    total_steps INTEGER DEFAULT 0,
    errors JSONB DEFAULT '[]',
    options JSONB DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    executed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create config_backups table for automatic backups
CREATE TABLE IF NOT EXISTS config_backups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    backup_type VARCHAR(20) NOT NULL DEFAULT 'automatic' CHECK (backup_type IN ('automatic', 'manual', 'pre_rollback')),
    trigger_event VARCHAR(255) NOT NULL,
    configs JSONB NOT NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    retention_until TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create config_change_history table for detailed change tracking
CREATE TABLE IF NOT EXISTS config_change_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    config_key VARCHAR(255) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('create', 'update', 'delete', 'restore')),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    rollback_execution_id UUID REFERENCES config_rollback_executions(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for rollback tables
CREATE INDEX IF NOT EXISTS idx_config_rollback_plans_snapshot_id ON config_rollback_plans(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_config_rollback_plans_target_snapshot_id ON config_rollback_plans(target_snapshot_id);
CREATE INDEX IF NOT EXISTS idx_config_rollback_plans_created_by ON config_rollback_plans(created_by);
CREATE INDEX IF NOT EXISTS idx_config_rollback_plans_created_at ON config_rollback_plans(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_config_rollback_executions_plan_id ON config_rollback_executions(rollback_plan_id);
CREATE INDEX IF NOT EXISTS idx_config_rollback_executions_status ON config_rollback_executions(status);
CREATE INDEX IF NOT EXISTS idx_config_rollback_executions_executed_by ON config_rollback_executions(executed_by);
CREATE INDEX IF NOT EXISTS idx_config_rollback_executions_started_at ON config_rollback_executions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_config_backups_backup_type ON config_backups(backup_type);
CREATE INDEX IF NOT EXISTS idx_config_backups_tenant_id ON config_backups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_config_backups_retention_until ON config_backups(retention_until);
CREATE INDEX IF NOT EXISTS idx_config_backups_created_at ON config_backups(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_config_change_history_config_key ON config_change_history(config_key);
CREATE INDEX IF NOT EXISTS idx_config_change_history_tenant_id ON config_change_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_config_change_history_user_id ON config_change_history(user_id);
CREATE INDEX IF NOT EXISTS idx_config_change_history_rollback_execution_id ON config_change_history(rollback_execution_id);
CREATE INDEX IF NOT EXISTS idx_config_change_history_created_at ON config_change_history(created_at DESC);

-- Enable RLS on rollback tables
ALTER TABLE config_rollback_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_rollback_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_change_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for config_rollback_plans
CREATE POLICY "Admin users can manage all rollback plans" ON config_rollback_plans
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Tenant admins can manage their rollback plans" ON config_rollback_plans
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM config_snapshots cs
            WHERE cs.id = config_rollback_plans.snapshot_id
            AND (
                cs.tenant_id IS NULL OR 
                cs.tenant_id IN (
                    SELECT tenant_id FROM tenant_users 
                    WHERE user_id = auth.uid() 
                    AND role IN ('owner', 'admin')
                )
            )
        )
    );

-- RLS policies for config_rollback_executions
CREATE POLICY "Admin users can manage all rollback executions" ON config_rollback_executions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Users can view their own rollback executions" ON config_rollback_executions
    FOR SELECT TO authenticated
    USING (executed_by = auth.uid());

-- RLS policies for config_backups
CREATE POLICY "Admin users can manage all backups" ON config_backups
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Tenant admins can manage their backups" ON config_backups
    FOR ALL TO authenticated
    USING (
        tenant_id IS NULL OR tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- Functions for rollback management

-- Function to clean up expired backups
CREATE OR REPLACE FUNCTION cleanup_expired_backups()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM config_backups 
    WHERE retention_until < now();
    
    -- Log cleanup
    INSERT INTO enterprise_audit_logs (
        event_type,
        entity_type,
        action,
        metadata,
        risk_score
    ) VALUES (
        'maintenance',
        'backup',
        'cleanup_expired',
        jsonb_build_object(
            'cleaned_at', now(),
            'automated', true
        ),
        1
    );
END;
$$;

-- Function to get rollback plan summary
CREATE OR REPLACE FUNCTION get_rollback_plan_summary(plan_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    plan_data config_rollback_plans%ROWTYPE;
    summary JSONB;
BEGIN
    SELECT * INTO plan_data
    FROM config_rollback_plans
    WHERE id = plan_id_param;
    
    IF plan_data.id IS NULL THEN
        RETURN NULL;
    END IF;
    
    summary := jsonb_build_object(
        'id', plan_data.id,
        'change_count', jsonb_array_length(plan_data.changes),
        'validation_passed', plan_data.validation_results->>'passed',
        'estimated_downtime', plan_data.estimated_downtime_seconds,
        'high_risk_changes', (
            SELECT COUNT(*)
            FROM jsonb_array_elements(plan_data.changes) AS change
            WHERE change->>'risk_level' = 'high'
        ),
        'requires_restart', (
            SELECT COUNT(*) > 0
            FROM jsonb_array_elements(plan_data.changes) AS change
            WHERE (change->>'requires_restart')::boolean = true
        ),
        'created_at', plan_data.created_at
    );
    
    RETURN summary;
END;
$$;

-- Function to create rollback checkpoint
CREATE OR REPLACE FUNCTION create_rollback_checkpoint(
    checkpoint_name VARCHAR,
    user_id_param UUID,
    tenant_id_param UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    snapshot_id UUID;
    config_data JSONB;
BEGIN
    -- Get current configurations
    SELECT jsonb_agg(
        jsonb_build_object(
            'key', key,
            'value', value,
            'type', type,
            'category', category,
            'tenant_id', tenant_id,
            'environment', environment,
            'updated_at', updated_at
        )
    ) INTO config_data
    FROM system_configs
    WHERE is_active = true
    AND (tenant_id_param IS NULL OR tenant_id = tenant_id_param);
    
    -- Create snapshot
    INSERT INTO config_snapshots (
        name,
        description,
        configs,
        tenant_id,
        created_by
    ) VALUES (
        checkpoint_name,
        'Automatic rollback checkpoint',
        config_data,
        tenant_id_param,
        user_id_param
    ) RETURNING id INTO snapshot_id;
    
    -- Log checkpoint creation
    INSERT INTO enterprise_audit_logs (
        event_type,
        entity_type,
        entity_id,
        action,
        actor_id,
        tenant_id,
        metadata,
        risk_score
    ) VALUES (
        'configuration',
        'snapshot',
        snapshot_id::TEXT,
        'checkpoint_create',
        user_id_param,
        tenant_id_param,
        jsonb_build_object(
            'name', checkpoint_name,
            'config_count', jsonb_array_length(config_data)
        ),
        1
    );
    
    RETURN snapshot_id;
END;
$$;

-- Function to validate rollback safety
CREATE OR REPLACE FUNCTION validate_rollback_safety(
    source_snapshot_id UUID,
    target_snapshot_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    source_configs JSONB;
    target_configs JSONB;
    safety_score INTEGER := 100;
    warnings TEXT[] := ARRAY[]::TEXT[];
    errors TEXT[] := ARRAY[]::TEXT[];
    result JSONB;
BEGIN
    -- Get snapshot configs
    SELECT configs INTO source_configs
    FROM config_snapshots
    WHERE id = source_snapshot_id;
    
    SELECT configs INTO target_configs
    FROM config_snapshots
    WHERE id = target_snapshot_id;
    
    IF source_configs IS NULL OR target_configs IS NULL THEN
        errors := array_append(errors, 'One or both snapshots not found');
        safety_score := 0;
    ELSE
        -- Analyze configuration changes for safety
        -- This is a simplified example - extend based on your needs
        
        -- Check for security-related changes
        IF (source_configs::text ~* 'security|auth|password' OR 
            target_configs::text ~* 'security|auth|password') THEN
            warnings := array_append(warnings, 'Security-related configurations detected');
            safety_score := safety_score - 20;
        END IF;
        
        -- Check for database-related changes
        IF (source_configs::text ~* 'database|db_' OR 
            target_configs::text ~* 'database|db_') THEN
            warnings := array_append(warnings, 'Database configurations detected');
            safety_score := safety_score - 15;
        END IF;
    END IF;
    
    result := jsonb_build_object(
        'safety_score', safety_score,
        'is_safe', safety_score >= 70,
        'warnings', to_jsonb(warnings),
        'errors', to_jsonb(errors),
        'recommendation', 
            CASE 
                WHEN safety_score >= 90 THEN 'Safe to proceed'
                WHEN safety_score >= 70 THEN 'Proceed with caution'
                WHEN safety_score >= 50 THEN 'High risk - recommend testing first'
                ELSE 'Not recommended - significant risks detected'
            END
    );
    
    RETURN result;
END;
$$;

-- Trigger to automatically log configuration changes
CREATE OR REPLACE FUNCTION log_config_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO config_change_history (
            config_key,
            old_value,
            new_value,
            change_type,
            tenant_id,
            user_id
        ) VALUES (
            NEW.key,
            OLD.value,
            NEW.value,
            'update',
            NEW.tenant_id,
            NEW.updated_by
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO config_change_history (
            config_key,
            new_value,
            change_type,
            tenant_id,
            user_id
        ) VALUES (
            NEW.key,
            NEW.value,
            'create',
            NEW.tenant_id,
            NEW.updated_by
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO config_change_history (
            config_key,
            old_value,
            change_type,
            tenant_id
        ) VALUES (
            OLD.key,
            OLD.value,
            'delete',
            OLD.tenant_id
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for config change logging
DROP TRIGGER IF EXISTS trigger_log_config_changes ON system_configs;
CREATE TRIGGER trigger_log_config_changes
    AFTER INSERT OR UPDATE OR DELETE ON system_configs
    FOR EACH ROW
    EXECUTE FUNCTION log_config_change();

-- Schedule automatic cleanup of expired backups (would be called by cron job)
COMMENT ON FUNCTION cleanup_expired_backups() IS 'Cleans up expired configuration backups';
COMMENT ON FUNCTION get_rollback_plan_summary(UUID) IS 'Gets summary information for a rollback plan';
COMMENT ON FUNCTION create_rollback_checkpoint(VARCHAR, UUID, UUID) IS 'Creates an automatic rollback checkpoint';
COMMENT ON FUNCTION validate_rollback_safety(UUID, UUID) IS 'Validates the safety of a proposed rollback';

-- Table comments for documentation
COMMENT ON TABLE config_rollback_plans IS 'Rollback plans with impact analysis and validation results';
COMMENT ON TABLE config_rollback_executions IS 'Rollback execution tracking with progress and status';
COMMENT ON TABLE config_backups IS 'Automatic configuration backups with retention policies';
COMMENT ON TABLE config_change_history IS 'Detailed history of all configuration changes';