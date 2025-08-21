-- File metadata table
CREATE TABLE IF NOT EXISTS file_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    size BIGINT NOT NULL,
    type TEXT NOT NULL,
    bucket TEXT NOT NULL,
    path TEXT NOT NULL,
    url TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(bucket, path)
);

-- File access logs
CREATE TABLE IF NOT EXISTS file_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID REFERENCES file_metadata(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL, -- 'upload', 'download', 'delete', 'view'
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Storage quotas
CREATE TABLE IF NOT EXISTS storage_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) UNIQUE,
    max_storage_bytes BIGINT DEFAULT 1073741824, -- 1GB default
    used_storage_bytes BIGINT DEFAULT 0,
    max_files INTEGER DEFAULT 1000,
    used_files INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CDN cache settings
CREATE TABLE IF NOT EXISTS cdn_cache_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket TEXT NOT NULL,
    path_pattern TEXT NOT NULL,
    cache_duration INTEGER DEFAULT 3600, -- seconds
    compression_enabled BOOLEAN DEFAULT true,
    auto_webp BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_file_metadata_bucket ON file_metadata(bucket);
CREATE INDEX IF NOT EXISTS idx_file_metadata_created_by ON file_metadata(created_by);
CREATE INDEX IF NOT EXISTS idx_file_metadata_created_at ON file_metadata(created_at);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_file_id ON file_access_logs(file_id);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_user_id ON file_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_created_at ON file_access_logs(created_at);

-- RLS Policies
ALTER TABLE file_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cdn_cache_settings ENABLE ROW LEVEL SECURITY;

-- File metadata policies
CREATE POLICY "Users can view their own files" ON file_metadata
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can upload files" ON file_metadata
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own files" ON file_metadata
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own files" ON file_metadata
    FOR DELETE USING (created_by = auth.uid());

CREATE POLICY "Admins can manage all files" ON file_metadata
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- File access logs policies
CREATE POLICY "Users can view their own access logs" ON file_access_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert access logs" ON file_access_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all access logs" ON file_access_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Storage quotas policies
CREATE POLICY "Users can view their own quotas" ON storage_quotas
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all quotas" ON storage_quotas
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- CDN cache settings policies
CREATE POLICY "Admins can manage CDN settings" ON cdn_cache_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Functions
CREATE OR REPLACE FUNCTION update_storage_quota()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO storage_quotas (user_id, used_storage_bytes, used_files)
        VALUES (NEW.created_by, NEW.size, 1)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            used_storage_bytes = storage_quotas.used_storage_bytes + NEW.size,
            used_files = storage_quotas.used_files + 1,
            updated_at = NOW();
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE storage_quotas 
        SET 
            used_storage_bytes = GREATEST(0, used_storage_bytes - OLD.size),
            used_files = GREATEST(0, used_files - 1),
            updated_at = NOW()
        WHERE user_id = OLD.created_by;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_storage_quota_trigger
    AFTER INSERT OR DELETE ON file_metadata
    FOR EACH ROW EXECUTE FUNCTION update_storage_quota();

CREATE TRIGGER update_file_metadata_updated_at
    BEFORE UPDATE ON file_metadata
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
