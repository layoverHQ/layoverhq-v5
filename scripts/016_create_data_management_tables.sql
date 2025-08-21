-- Database backups tracking
CREATE TABLE IF NOT EXISTS database_backups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_id TEXT NOT NULL UNIQUE,
  status TEXT CHECK (status IN ('running', 'completed', 'failed', 'restoring', 'restored')) DEFAULT 'running',
  config JSONB,
  file_path TEXT,
  file_size BIGINT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  restore_started_at TIMESTAMP WITH TIME ZONE,
  restore_completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Database migrations tracking
CREATE TABLE IF NOT EXISTS database_migrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT DEFAULT '1.0.0',
  status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed')) DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  checksum TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data archival tracking
CREATE TABLE IF NOT EXISTS data_archives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  archive_date TIMESTAMP WITH TIME ZONE NOT NULL,
  records_archived INTEGER DEFAULT 0,
  archive_size BIGINT,
  status TEXT CHECK (status IN ('running', 'completed', 'failed')) DEFAULT 'running',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Full-text search configuration
CREATE TABLE IF NOT EXISTS search_indexes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  column_name TEXT NOT NULL,
  index_type TEXT DEFAULT 'gin',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Database performance metrics
CREATE TABLE IF NOT EXISTS database_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type TEXT NOT NULL,
  table_name TEXT,
  query_text TEXT,
  execution_time NUMERIC,
  rows_affected INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_database_backups_status ON database_backups(status, created_at);
CREATE INDEX IF NOT EXISTS idx_database_migrations_status ON database_migrations(status, started_at);
CREATE INDEX IF NOT EXISTS idx_data_archives_table_date ON data_archives(table_name, archive_date);
CREATE INDEX IF NOT EXISTS idx_search_indexes_table ON search_indexes(table_name, is_active);
CREATE INDEX IF NOT EXISTS idx_database_performance_type ON database_performance(metric_type, created_at);

-- RLS Policies
ALTER TABLE database_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE database_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_indexes ENABLE ROW LEVEL SECURITY;
ALTER TABLE database_performance ENABLE ROW LEVEL SECURITY;

-- Only admins can manage database operations
CREATE POLICY "Admins can manage database backups" ON database_backups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage database migrations" ON database_migrations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage data archives" ON data_archives
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage search indexes" ON search_indexes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view database performance" ON database_performance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Database utility functions
CREATE OR REPLACE FUNCTION get_table_stats()
RETURNS TABLE(table_name TEXT, row_count BIGINT, table_size TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname||'.'||tablename as table_name,
    n_tup_ins - n_tup_del as row_count,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size
  FROM pg_stat_user_tables
  ORDER BY n_tup_ins - n_tup_del DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_database_size()
RETURNS TABLE(size TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT pg_size_pretty(pg_database_size(current_database()));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_active_connections()
RETURNS TABLE(pid INTEGER, usename TEXT, application_name TEXT, state TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pg_stat_activity.pid,
    pg_stat_activity.usename,
    pg_stat_activity.application_name,
    pg_stat_activity.state
  FROM pg_stat_activity
  WHERE pg_stat_activity.state = 'active'
  AND pg_stat_activity.pid <> pg_backend_pid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION archive_old_data(table_name TEXT, cutoff_date TIMESTAMP WITH TIME ZONE)
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  -- This is a simplified example - in practice, you'd implement table-specific archival logic
  EXECUTE format('INSERT INTO %I_archive SELECT * FROM %I WHERE created_at < %L', table_name, table_name, cutoff_date);
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  EXECUTE format('DELETE FROM %I WHERE created_at < %L', table_name, cutoff_date);
  
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION full_text_search(search_table TEXT, search_query TEXT)
RETURNS TABLE(id UUID, content TEXT, rank REAL) AS $$
BEGIN
  -- This is a simplified example - in practice, you'd implement proper full-text search
  RETURN QUERY EXECUTE format(
    'SELECT id, content::TEXT, ts_rank(to_tsvector(content::TEXT), plainto_tsquery(%L)) as rank 
     FROM %I 
     WHERE to_tsvector(content::TEXT) @@ plainto_tsquery(%L)
     ORDER BY rank DESC
     LIMIT 100',
    search_query, search_table, search_query
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION optimize_database()
RETURNS VOID AS $$
BEGIN
  -- Run VACUUM and ANALYZE on all tables
  VACUUM ANALYZE;
  
  -- Update table statistics
  ANALYZE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
