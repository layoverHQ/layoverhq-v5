-- Cache and Session Management Tables

-- Cache entries table for persistent caching
CREATE TABLE IF NOT EXISTS public.cache_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  ttl INTEGER NOT NULL, -- Time to live in milliseconds
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  hit_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update user_sessions table with additional fields for enterprise session management
ALTER TABLE public.user_sessions 
ADD COLUMN IF NOT EXISTS session_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Cache statistics table
CREATE TABLE IF NOT EXISTS public.cache_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_hits BIGINT DEFAULT 0,
  total_misses BIGINT DEFAULT 0,
  hit_rate DECIMAL(5,4) DEFAULT 0,
  total_keys INTEGER DEFAULT 0,
  memory_usage_mb DECIMAL(10,2) DEFAULT 0,
  evictions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date)
);

-- Session analytics table
CREATE TABLE IF NOT EXISTS public.session_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_sessions INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  average_duration_ms BIGINT DEFAULT 0,
  sessions_created INTEGER DEFAULT 0,
  sessions_expired INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date)
);

-- Enable RLS on new tables
ALTER TABLE public.cache_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cache_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Admin only for cache and session management
CREATE POLICY "cache_entries_admin_only" ON public.cache_entries FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "cache_stats_admin_only" ON public.cache_stats FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "session_analytics_admin_only" ON public.session_analytics FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Create indexes for performance
CREATE INDEX idx_cache_entries_key ON public.cache_entries(cache_key);
CREATE INDEX idx_cache_entries_expires_at ON public.cache_entries(expires_at);
CREATE INDEX idx_cache_entries_tags ON public.cache_entries USING GIN(tags);
CREATE INDEX idx_cache_entries_last_accessed ON public.cache_entries(last_accessed_at);

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON public.user_sessions(expires_at);
CREATE INDEX idx_user_sessions_is_active ON public.user_sessions(is_active);
CREATE INDEX idx_user_sessions_created_at ON public.user_sessions(created_at);

-- Add updated_at trigger to user_sessions
CREATE TRIGGER user_sessions_updated_at 
  BEFORE UPDATE ON public.user_sessions 
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to cleanup expired cache entries
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete expired cache entries
  DELETE FROM public.cache_entries 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- Function to update cache hit count
CREATE OR REPLACE FUNCTION public.update_cache_hit(cache_key_param TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.cache_entries 
  SET 
    hit_count = hit_count + 1,
    last_accessed_at = NOW()
  WHERE cache_key = cache_key_param;
END;
$$;

-- Function to record daily cache statistics
CREATE OR REPLACE FUNCTION public.record_cache_stats()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_entries INTEGER;
  total_hits BIGINT;
  avg_hit_rate DECIMAL(5,4);
BEGIN
  -- Get current cache statistics
  SELECT 
    COUNT(*),
    COALESCE(SUM(hit_count), 0)
  INTO total_entries, total_hits
  FROM public.cache_entries
  WHERE expires_at > NOW();
  
  -- Calculate hit rate (simplified)
  avg_hit_rate := CASE 
    WHEN total_hits > 0 THEN total_hits::DECIMAL / (total_hits + 100)::DECIMAL 
    ELSE 0 
  END;
  
  -- Insert or update daily stats
  INSERT INTO public.cache_stats (
    date, 
    total_keys, 
    total_hits,
    hit_rate
  ) VALUES (
    CURRENT_DATE,
    total_entries,
    total_hits,
    avg_hit_rate
  )
  ON CONFLICT (date) DO UPDATE SET
    total_keys = EXCLUDED.total_keys,
    total_hits = EXCLUDED.total_hits,
    hit_rate = EXCLUDED.hit_rate;
END;
$$;

-- Function to record daily session analytics
CREATE OR REPLACE FUNCTION public.record_session_analytics()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  active_sessions INTEGER;
  unique_users INTEGER;
  avg_duration BIGINT;
  created_today INTEGER;
BEGIN
  -- Get active sessions count
  SELECT COUNT(*) INTO active_sessions
  FROM public.user_sessions
  WHERE is_active = true AND expires_at > NOW();
  
  -- Get unique users count
  SELECT COUNT(DISTINCT user_id) INTO unique_users
  FROM public.user_sessions
  WHERE is_active = true AND expires_at > NOW();
  
  -- Get sessions created today
  SELECT COUNT(*) INTO created_today
  FROM public.user_sessions
  WHERE created_at >= CURRENT_DATE;
  
  -- Calculate average session duration (simplified)
  SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) * 1000), 0)::BIGINT
  INTO avg_duration
  FROM public.user_sessions
  WHERE is_active = true AND expires_at > NOW();
  
  -- Insert or update daily stats
  INSERT INTO public.session_analytics (
    date,
    total_sessions,
    unique_users,
    average_duration_ms,
    sessions_created
  ) VALUES (
    CURRENT_DATE,
    active_sessions,
    unique_users,
    avg_duration,
    created_today
  )
  ON CONFLICT (date) DO UPDATE SET
    total_sessions = EXCLUDED.total_sessions,
    unique_users = EXCLUDED.unique_users,
    average_duration_ms = EXCLUDED.average_duration_ms,
    sessions_created = EXCLUDED.sessions_created;
END;
$$;

-- Create scheduled cleanup job (would be called by cron or background job)
CREATE OR REPLACE FUNCTION public.daily_cleanup_and_stats()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Cleanup expired cache entries
  PERFORM public.cleanup_expired_cache();
  
  -- Record daily statistics
  PERFORM public.record_cache_stats();
  PERFORM public.record_session_analytics();
  
  -- Cleanup old statistics (keep 90 days)
  DELETE FROM public.cache_stats WHERE created_at < NOW() - INTERVAL '90 days';
  DELETE FROM public.session_analytics WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;
