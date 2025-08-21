-- Monitoring and Logging Tables

-- Error reports table
CREATE TABLE IF NOT EXISTS public.error_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint TEXT NOT NULL UNIQUE,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  service TEXT NOT NULL,
  operation TEXT,
  user_id UUID REFERENCES auth.users(id),
  request_id TEXT,
  metadata JSONB DEFAULT '{}',
  count INTEGER DEFAULT 1,
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'ignored')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts table
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  condition TEXT NOT NULL,
  threshold DECIMAL(15,4) NOT NULL,
  current_value DECIMAL(15,4),
  metric_name TEXT NOT NULL,
  triggered_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'suppressed')),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health checks table
CREATE TABLE IF NOT EXISTS public.health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy')),
  response_time INTEGER NOT NULL, -- milliseconds
  details JSONB DEFAULT '{}',
  checked_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance metrics aggregation table
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  hour INTEGER NOT NULL DEFAULT EXTRACT(HOUR FROM NOW()),
  service_name TEXT NOT NULL,
  endpoint TEXT,
  method TEXT,
  avg_response_time DECIMAL(10,2) DEFAULT 0,
  p50_response_time DECIMAL(10,2) DEFAULT 0,
  p95_response_time DECIMAL(10,2) DEFAULT 0,
  p99_response_time DECIMAL(10,2) DEFAULT 0,
  request_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  error_rate DECIMAL(5,2) DEFAULT 0,
  throughput DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, hour, service_name, endpoint, method)
);

-- System resource usage table
CREATE TABLE IF NOT EXISTS public.system_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  cpu_usage DECIMAL(5,2) DEFAULT 0,
  memory_usage_mb DECIMAL(10,2) DEFAULT 0,
  memory_total_mb DECIMAL(10,2) DEFAULT 0,
  disk_usage_gb DECIMAL(10,2) DEFAULT 0,
  disk_total_gb DECIMAL(10,2) DEFAULT 0,
  active_connections INTEGER DEFAULT 0,
  event_loop_lag_ms DECIMAL(10,2) DEFAULT 0
);

-- Uptime monitoring table
CREATE TABLE IF NOT EXISTS public.uptime_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  status_code INTEGER,
  response_time INTEGER, -- milliseconds
  is_up BOOLEAN NOT NULL,
  error_message TEXT,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.error_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uptime_checks ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Admin/Manager access for monitoring tables
CREATE POLICY "error_reports_admin_read" ON public.error_reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "error_reports_system_write" ON public.error_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "error_reports_admin_update" ON public.error_reports FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "alerts_admin_only" ON public.alerts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "health_checks_admin_read" ON public.health_checks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "health_checks_system_write" ON public.health_checks FOR INSERT WITH CHECK (true);

CREATE POLICY "performance_metrics_admin_only" ON public.performance_metrics FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "system_resources_admin_only" ON public.system_resources FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "uptime_checks_admin_only" ON public.uptime_checks FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Create indexes for performance
CREATE INDEX idx_error_reports_fingerprint ON public.error_reports(fingerprint);
CREATE INDEX idx_error_reports_service ON public.error_reports(service);
CREATE INDEX idx_error_reports_last_seen ON public.error_reports(last_seen);
CREATE INDEX idx_error_reports_status ON public.error_reports(status);

CREATE INDEX idx_alerts_status ON public.alerts(status);
CREATE INDEX idx_alerts_severity ON public.alerts(severity);
CREATE INDEX idx_alerts_triggered_at ON public.alerts(triggered_at);

CREATE INDEX idx_health_checks_service ON public.health_checks(service_name);
CREATE INDEX idx_health_checks_status ON public.health_checks(status);
CREATE INDEX idx_health_checks_checked_at ON public.health_checks(checked_at);

CREATE INDEX idx_performance_metrics_date_hour ON public.performance_metrics(date, hour);
CREATE INDEX idx_performance_metrics_service ON public.performance_metrics(service_name);

CREATE INDEX idx_system_resources_timestamp ON public.system_resources(timestamp);

CREATE INDEX idx_uptime_checks_service ON public.uptime_checks(service_name);
CREATE INDEX idx_uptime_checks_checked_at ON public.uptime_checks(checked_at);

-- Function to aggregate performance metrics hourly
CREATE OR REPLACE FUNCTION public.aggregate_performance_metrics()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_hour INTEGER;
  current_date DATE;
BEGIN
  current_hour := EXTRACT(HOUR FROM NOW());
  current_date := CURRENT_DATE;
  
  -- Aggregate metrics from system_metrics table
  INSERT INTO public.performance_metrics (
    date,
    hour,
    service_name,
    endpoint,
    method,
    avg_response_time,
    request_count,
    error_count
  )
  SELECT 
    current_date,
    current_hour,
    service_name,
    COALESCE(tags->>'endpoint', 'unknown') as endpoint,
    COALESCE(tags->>'method', 'unknown') as method,
    AVG(CASE WHEN metric_type = 'response_time' THEN value ELSE NULL END) as avg_response_time,
    SUM(CASE WHEN metric_type = 'request_count' THEN value ELSE 0 END) as request_count,
    SUM(CASE WHEN metric_type = 'error_count' THEN value ELSE 0 END) as error_count
  FROM public.system_metrics
  WHERE 
    timestamp >= current_date + (current_hour || ' hours')::INTERVAL
    AND timestamp < current_date + ((current_hour + 1) || ' hours')::INTERVAL
    AND metric_type IN ('response_time', 'request_count', 'error_count')
  GROUP BY service_name, tags->>'endpoint', tags->>'method'
  ON CONFLICT (date, hour, service_name, endpoint, method) DO UPDATE SET
    avg_response_time = EXCLUDED.avg_response_time,
    request_count = EXCLUDED.request_count,
    error_count = EXCLUDED.error_count;
    
  -- Calculate error rates
  UPDATE public.performance_metrics 
  SET error_rate = CASE 
    WHEN request_count > 0 THEN (error_count::DECIMAL / request_count::DECIMAL) * 100 
    ELSE 0 
  END
  WHERE date = current_date AND hour = current_hour;
END;
$$;

-- Function to cleanup old monitoring data
CREATE OR REPLACE FUNCTION public.cleanup_monitoring_data(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER := 0;
  temp_count INTEGER;
BEGIN
  -- Cleanup old error reports (keep resolved ones for longer)
  DELETE FROM public.error_reports 
  WHERE last_seen < NOW() - INTERVAL '1 day' * days_to_keep 
    AND status = 'resolved';
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Cleanup old alerts
  DELETE FROM public.alerts 
  WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Cleanup old health checks (keep only last 7 days)
  DELETE FROM public.health_checks 
  WHERE created_at < NOW() - INTERVAL '7 days';
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Cleanup old system resources (keep only last 30 days)
  DELETE FROM public.system_resources 
  WHERE timestamp < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Cleanup old uptime checks (keep only last 30 days)
  DELETE FROM public.uptime_checks 
  WHERE created_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  RETURN deleted_count;
END;
$$;

-- Function to get system health summary
CREATE OR REPLACE FUNCTION public.get_system_health_summary()
RETURNS TABLE (
  service_name TEXT,
  status TEXT,
  avg_response_time DECIMAL,
  last_check TIMESTAMPTZ,
  error_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hc.service_name,
    hc.status,
    AVG(hc.response_time)::DECIMAL as avg_response_time,
    MAX(hc.checked_at) as last_check,
    COUNT(CASE WHEN hc.status != 'healthy' THEN 1 END)::INTEGER as error_count
  FROM public.health_checks hc
  WHERE hc.checked_at > NOW() - INTERVAL '1 hour'
  GROUP BY hc.service_name, hc.status
  ORDER BY hc.service_name;
END;
$$;
