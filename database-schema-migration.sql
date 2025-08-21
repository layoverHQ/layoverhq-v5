-- LayoverHQ Enterprise Database Schema Migration
-- This script transforms the current LayoverHQ database into an enterprise-ready, multi-tenant architecture

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ============================================================================
-- ENTERPRISE CORE TABLES
-- ============================================================================

-- Enterprise/Tenant Management
CREATE TABLE enterprises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  domain VARCHAR(255) UNIQUE,
  subscription_plan VARCHAR(50) NOT NULL DEFAULT 'startup',
  api_key_hash VARCHAR(255) UNIQUE,
  rate_limits JSONB DEFAULT '{"hourly": 1000, "daily": 10000}',
  white_label_config JSONB DEFAULT '{}',
  billing_settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT valid_subscription_plan CHECK (subscription_plan IN ('startup', 'growth', 'enterprise')),
  CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Create indexes for enterprises
CREATE INDEX idx_enterprises_slug ON enterprises(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_enterprises_domain ON enterprises(domain) WHERE deleted_at IS NULL AND domain IS NOT NULL;
CREATE INDEX idx_enterprises_subscription ON enterprises(subscription_plan) WHERE is_active = TRUE;
CREATE INDEX idx_enterprises_active ON enterprises(is_active, created_at);

-- Users with multi-tenant support
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  encrypted_password VARCHAR(255),
  enterprise_id UUID REFERENCES enterprises(id) ON DELETE SET NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  subscription_tier VARCHAR(50) NOT NULL DEFAULT 'free',
  api_limits JSONB DEFAULT '{"hourly": 100, "daily": 1000}',
  preferences JSONB DEFAULT '{}',
  last_login TIMESTAMPTZ,
  email_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT valid_role CHECK (role IN ('admin', 'enterprise_admin', 'user', 'api_user')),
  CONSTRAINT valid_subscription_tier CHECK (subscription_tier IN ('free', 'pro', 'enterprise'))
);

-- Create indexes for users
CREATE INDEX idx_users_enterprise_id ON users(enterprise_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role) WHERE is_active = TRUE;
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY users_tenant_isolation ON users
  FOR ALL TO authenticated
  USING (
    enterprise_id = current_setting('app.current_enterprise_id', true)::uuid 
    OR current_setting('app.current_user_role', true) = 'admin'
  );

-- ============================================================================
-- CONFIGURATION MANAGEMENT TABLES
-- ============================================================================

-- System Configuration (Zero-CLI Management)
CREATE TABLE system_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) NOT NULL,
  value JSONB NOT NULL,
  value_type VARCHAR(50) NOT NULL DEFAULT 'string',
  description TEXT,
  category VARCHAR(100) NOT NULL DEFAULT 'runtime',
  requires_restart BOOLEAN DEFAULT FALSE,
  tenant_id UUID REFERENCES enterprises(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  is_sensitive BOOLEAN DEFAULT FALSE,
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_value_type CHECK (value_type IN ('string', 'number', 'boolean', 'json', 'array')),
  CONSTRAINT valid_category CHECK (category IN ('runtime', 'business', 'security', 'algorithm', 'integration'))
);

-- Unique constraint allowing tenant overrides
CREATE UNIQUE INDEX idx_system_configs_key_tenant_active
ON system_configs(key, COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid))
WHERE is_active = TRUE;

-- Additional indexes for system_configs
CREATE INDEX idx_system_configs_category ON system_configs(category) WHERE is_active = TRUE;
CREATE INDEX idx_system_configs_tenant_id ON system_configs(tenant_id) WHERE is_active = TRUE;
CREATE INDEX idx_system_configs_updated_at ON system_configs(updated_at DESC);
CREATE INDEX idx_system_configs_requires_restart ON system_configs(requires_restart) WHERE requires_restart = TRUE;

-- Feature Flags with A/B Testing
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT FALSE,
  rollout_percentage INTEGER DEFAULT 0,
  conditions JSONB DEFAULT '{}',
  tenant_overrides JSONB DEFAULT '{}',
  user_overrides JSONB DEFAULT '{}',
  environments JSONB DEFAULT '["production"]',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_rollout_percentage CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100)
);

-- Indexes for feature_flags
CREATE INDEX idx_feature_flags_enabled ON feature_flags(enabled);
CREATE INDEX idx_feature_flags_rollout ON feature_flags(rollout_percentage) WHERE enabled = TRUE;
CREATE INDEX idx_feature_flags_updated_at ON feature_flags(updated_at DESC);

-- API Credentials Management
CREATE TABLE api_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name VARCHAR(100) NOT NULL,
  credential_type VARCHAR(50) NOT NULL DEFAULT 'api_key',
  encrypted_value TEXT NOT NULL,
  encryption_key_id VARCHAR(100) NOT NULL,
  tenant_id UUID REFERENCES enterprises(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_credential_type CHECK (credential_type IN ('api_key', 'oauth_token', 'secret_key', 'certificate'))
);

-- Unique constraint for active credentials
CREATE UNIQUE INDEX idx_api_credentials_service_tenant_active
ON api_credentials(service_name, credential_type, COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid))
WHERE is_active = TRUE;

-- Additional indexes for api_credentials
CREATE INDEX idx_api_credentials_tenant_id ON api_credentials(tenant_id) WHERE is_active = TRUE;
CREATE INDEX idx_api_credentials_expires_at ON api_credentials(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_api_credentials_service_name ON api_credentials(service_name);

-- ============================================================================
-- FLIGHT AND TRAVEL DATA TABLES
-- ============================================================================

-- Enhanced Flights Table with Partitioning
CREATE TABLE flights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL,
  provider_flight_id VARCHAR(255) NOT NULL,
  origin_airport VARCHAR(3) NOT NULL,
  destination_airport VARCHAR(3) NOT NULL,
  departure_datetime TIMESTAMPTZ NOT NULL,
  arrival_datetime TIMESTAMPTZ NOT NULL,
  price_total DECIMAL(10,2) NOT NULL,
  price_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  airline_code VARCHAR(3) NOT NULL,
  flight_number VARCHAR(10) NOT NULL,
  aircraft_type VARCHAR(50),
  duration_minutes INTEGER NOT NULL,
  layovers JSONB DEFAULT '[]',
  amenities JSONB DEFAULT '{}',
  booking_url TEXT,
  booking_conditions JSONB DEFAULT '{}',
  data_quality_score DECIMAL(3,2) DEFAULT 1.0,
  search_hash VARCHAR(64),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_price CHECK (price_total >= 0),
  CONSTRAINT valid_duration CHECK (duration_minutes > 0),
  CONSTRAINT valid_data_quality CHECK (data_quality_score >= 0 AND data_quality_score <= 1),
  CONSTRAINT valid_airports CHECK (origin_airport != destination_airport),
  CONSTRAINT valid_datetime CHECK (arrival_datetime > departure_datetime)
) PARTITION BY RANGE(departure_datetime);

-- Create flight partitions for the next 12 months
DO $$
DECLARE
  start_date DATE := DATE_TRUNC('month', CURRENT_DATE);
  end_date DATE;
  partition_name TEXT;
BEGIN
  FOR i IN 0..11 LOOP
    end_date := start_date + INTERVAL '1 month';
    partition_name := 'flights_' || TO_CHAR(start_date, 'YYYY_MM');
    
    EXECUTE format('
      CREATE TABLE %I PARTITION OF flights
      FOR VALUES FROM (%L) TO (%L)',
      partition_name, start_date, end_date
    );
    
    -- Create indexes on each partition
    EXECUTE format('CREATE INDEX %I ON %I(origin_airport, destination_airport, departure_datetime, price_total) WHERE expires_at > NOW()', 
      'idx_' || partition_name || '_route_search', partition_name);
    EXECUTE format('CREATE INDEX %I ON %I USING gin(layovers) WHERE expires_at > NOW()', 
      'idx_' || partition_name || '_layovers', partition_name);
    EXECUTE format('CREATE INDEX %I ON %I(search_hash) WHERE expires_at > NOW()', 
      'idx_' || partition_name || '_search_hash', partition_name);
    
    start_date := end_date;
  END LOOP;
END $$;

-- Experiences Table with Enhanced Search
CREATE TABLE experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viator_product_code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  city VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  duration_minutes INTEGER,
  price_from DECIMAL(10,2),
  price_currency VARCHAR(3) DEFAULT 'USD',
  rating DECIMAL(3,2),
  review_count INTEGER DEFAULT 0,
  weather_suitable JSONB DEFAULT '{}',
  activity_type VARCHAR(50),
  location_coords POINT,
  address TEXT,
  booking_url TEXT,
  booking_conditions JSONB DEFAULT '{}',
  images JSONB DEFAULT '[]',
  tags JSONB DEFAULT '[]',
  availability_schedule JSONB DEFAULT '{}',
  cancellation_policy JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  last_synced TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_rating CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
  CONSTRAINT valid_review_count CHECK (review_count >= 0),
  CONSTRAINT valid_price CHECK (price_from IS NULL OR price_from >= 0),
  CONSTRAINT valid_duration CHECK (duration_minutes IS NULL OR duration_minutes > 0)
);

-- Indexes for experiences
CREATE INDEX idx_experiences_city_category ON experiences(city, category) WHERE is_active = TRUE;
CREATE INDEX idx_experiences_duration ON experiences(duration_minutes) WHERE duration_minutes IS NOT NULL;
CREATE INDEX idx_experiences_price ON experiences(price_from) WHERE price_from IS NOT NULL;
CREATE INDEX idx_experiences_rating ON experiences(rating DESC) WHERE rating IS NOT NULL;
CREATE INDEX idx_experiences_location ON experiences USING gist(location_coords) WHERE location_coords IS NOT NULL;
CREATE INDEX idx_experiences_weather_gin ON experiences USING gin(weather_suitable);
CREATE INDEX idx_experiences_activity_type ON experiences(activity_type) WHERE activity_type IS NOT NULL;
CREATE INDEX idx_experiences_tags_gin ON experiences USING gin(tags);

-- ============================================================================
-- ANALYTICS AND MONITORING TABLES
-- ============================================================================

-- API Usage Logging (Partitioned by time)
CREATE TABLE api_usage_logs (
  id UUID DEFAULT gen_random_uuid(),
  enterprise_id UUID REFERENCES enterprises(id) NOT NULL,
  user_id UUID REFERENCES users(id),
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  response_status INTEGER NOT NULL,
  response_time_ms INTEGER NOT NULL,
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,
  api_key_used VARCHAR(100),
  ip_address INET,
  user_agent TEXT,
  request_id VARCHAR(100),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (id, timestamp),
  CONSTRAINT valid_method CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS')),
  CONSTRAINT valid_status CHECK (response_status >= 100 AND response_status < 600),
  CONSTRAINT valid_response_time CHECK (response_time_ms >= 0)
) PARTITION BY RANGE(timestamp);

-- Create API usage partitions for the next 12 months
DO $$
DECLARE
  start_date DATE := DATE_TRUNC('month', CURRENT_DATE);
  end_date DATE;
  partition_name TEXT;
BEGIN
  FOR i IN 0..11 LOOP
    end_date := start_date + INTERVAL '1 month';
    partition_name := 'api_usage_logs_' || TO_CHAR(start_date, 'YYYY_MM');
    
    EXECUTE format('
      CREATE TABLE %I PARTITION OF api_usage_logs
      FOR VALUES FROM (%L) TO (%L)',
      partition_name, start_date, end_date
    );
    
    -- Create indexes on each partition
    EXECUTE format('CREATE INDEX %I ON %I(enterprise_id, timestamp DESC)', 
      'idx_' || partition_name || '_enterprise_time', partition_name);
    EXECUTE format('CREATE INDEX %I ON %I(endpoint, timestamp DESC)', 
      'idx_' || partition_name || '_endpoint_time', partition_name);
    EXECUTE format('CREATE INDEX %I ON %I(response_status, timestamp DESC)', 
      'idx_' || partition_name || '_status_time', partition_name);
    
    start_date := end_date;
  END LOOP;
END $$;

-- Analytics Events for Business Intelligence
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES users(id),
  enterprise_id UUID REFERENCES enterprises(id),
  session_id VARCHAR(255),
  properties JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  page_url TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
) PARTITION BY RANGE(timestamp);

-- Create analytics partitions
DO $$
DECLARE
  start_date DATE := DATE_TRUNC('month', CURRENT_DATE);
  end_date DATE;
  partition_name TEXT;
BEGIN
  FOR i IN 0..11 LOOP
    end_date := start_date + INTERVAL '1 month';
    partition_name := 'analytics_events_' || TO_CHAR(start_date, 'YYYY_MM');
    
    EXECUTE format('
      CREATE TABLE %I PARTITION OF analytics_events
      FOR VALUES FROM (%L) TO (%L)',
      partition_name, start_date, end_date
    );
    
    start_date := end_date;
  END LOOP;
END $$;

-- ============================================================================
-- CACHING AND PERFORMANCE TABLES
-- ============================================================================

-- Layover Analysis Cache
CREATE TABLE layover_analyses_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  airport_code VARCHAR(3) NOT NULL,
  layover_duration INTEGER NOT NULL,
  arrival_time TIMESTAMPTZ NOT NULL,
  analysis_result JSONB NOT NULL,
  weather_conditions JSONB,
  transit_options JSONB,
  confidence_score DECIMAL(3,2),
  computation_time_ms INTEGER,
  expires_at TIMESTAMPTZ NOT NULL,
  hit_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_confidence CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)),
  CONSTRAINT valid_computation_time CHECK (computation_time_ms IS NULL OR computation_time_ms >= 0)
);

-- Indexes for cache
CREATE INDEX idx_layover_cache_airport_expires ON layover_analyses_cache(airport_code, expires_at);
CREATE INDEX idx_layover_cache_expires ON layover_analyses_cache(expires_at);
CREATE INDEX idx_layover_cache_accessed ON layover_analyses_cache(last_accessed);
CREATE INDEX idx_layover_cache_hit_count ON layover_analyses_cache(hit_count DESC);

-- Configuration Audit Log
CREATE TABLE config_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID,
  config_key VARCHAR(255) NOT NULL,
  operation VARCHAR(20) NOT NULL,
  old_value JSONB,
  new_value JSONB,
  user_id UUID REFERENCES users(id),
  enterprise_id UUID REFERENCES enterprises(id),
  ip_address INET,
  user_agent TEXT,
  reason TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_operation CHECK (operation IN ('CREATE', 'UPDATE', 'DELETE', 'ACTIVATE', 'DEACTIVATE'))
);

-- Indexes for audit log
CREATE INDEX idx_config_audit_key_time ON config_audit_log(config_key, timestamp DESC);
CREATE INDEX idx_config_audit_user_time ON config_audit_log(user_id, timestamp DESC);
CREATE INDEX idx_config_audit_enterprise_time ON config_audit_log(enterprise_id, timestamp DESC);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Configuration management functions
CREATE OR REPLACE FUNCTION get_config(config_key TEXT, tenant_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  config_value JSONB;
BEGIN
  SELECT value INTO config_value
  FROM system_configs 
  WHERE key = config_key 
    AND (system_configs.tenant_id = get_config.tenant_id OR system_configs.tenant_id IS NULL)
    AND is_active = TRUE
  ORDER BY system_configs.tenant_id NULLS LAST, version DESC
  LIMIT 1;
  
  RETURN COALESCE(config_value, 'null'::jsonb);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Feature flag evaluation function
CREATE OR REPLACE FUNCTION is_feature_enabled(
  flag_name TEXT,
  user_id UUID DEFAULT NULL,
  tenant_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  flag_record feature_flags%ROWTYPE;
  user_hash INTEGER;
BEGIN
  SELECT * INTO flag_record FROM feature_flags WHERE name = flag_name;
  
  IF NOT FOUND OR NOT flag_record.enabled THEN
    RETURN FALSE;
  END IF;
  
  -- Check tenant override
  IF tenant_id IS NOT NULL AND flag_record.tenant_overrides ? tenant_id::text THEN
    RETURN (flag_record.tenant_overrides ->> tenant_id::text)::boolean;
  END IF;
  
  -- Check user override  
  IF user_id IS NOT NULL AND flag_record.user_overrides ? user_id::text THEN
    RETURN (flag_record.user_overrides ->> user_id::text)::boolean;
  END IF;
  
  -- Check rollout percentage
  IF user_id IS NOT NULL THEN
    user_hash := abs(hashtext(user_id::text)) % 100;
    RETURN user_hash < flag_record.rollout_percentage;
  END IF;
  
  RETURN flag_record.rollout_percentage = 100;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Configuration change notification trigger
CREATE OR REPLACE FUNCTION notify_config_change()
RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('config_change', json_build_object(
    'key', NEW.key,
    'tenant_id', NEW.tenant_id,
    'value', NEW.value,
    'requires_restart', NEW.requires_restart,
    'category', NEW.category
  )::text);
  
  -- Log the change
  INSERT INTO config_audit_log (
    config_id, config_key, operation, old_value, new_value,
    user_id, enterprise_id, timestamp
  ) VALUES (
    NEW.id, NEW.key, 
    CASE WHEN TG_OP = 'INSERT' THEN 'CREATE' ELSE 'UPDATE' END,
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.value ELSE NULL END,
    NEW.value,
    NEW.created_by, NEW.tenant_id, NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER config_change_notify
  AFTER INSERT OR UPDATE ON system_configs
  FOR EACH ROW EXECUTE FUNCTION notify_config_change();

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to tables that need them
CREATE TRIGGER update_enterprises_updated_at BEFORE UPDATE ON enterprises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users  
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_configs_updated_at BEFORE UPDATE ON system_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Cache cleanup functions
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM layover_analyses_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  DELETE FROM flights WHERE expires_at < NOW() - INTERVAL '1 hour';
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Data retention cleanup
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Delete old API usage logs (older than 1 year)
  DELETE FROM api_usage_logs WHERE timestamp < NOW() - INTERVAL '1 year';
  
  -- Delete old analytics events (older than 2 years)
  DELETE FROM analytics_events WHERE timestamp < NOW() - INTERVAL '2 years';
  
  -- Archive old audit logs (older than 3 years)
  DELETE FROM config_audit_log WHERE timestamp < NOW() - INTERVAL '3 years';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MATERIALIZED VIEWS FOR ANALYTICS
-- ============================================================================

-- Popular layover routes analysis
CREATE MATERIALIZED VIEW popular_layover_routes AS
SELECT 
  origin_airport,
  destination_airport,
  COUNT(*) as flight_count,
  AVG(price_total) as avg_price,
  MIN(price_total) as min_price,
  MAX(price_total) as max_price,
  AVG(duration_minutes) as avg_duration,
  COUNT(CASE WHEN jsonb_array_length(layovers) > 0 THEN 1 END) as layover_count,
  AVG(CASE WHEN jsonb_array_length(layovers) > 0 THEN jsonb_array_length(layovers) END) as avg_layovers
FROM flights 
WHERE expires_at > NOW() - INTERVAL '7 days'
  AND departure_datetime > NOW()
GROUP BY origin_airport, destination_airport
HAVING COUNT(*) >= 5
ORDER BY flight_count DESC;

-- Create index on materialized view
CREATE INDEX idx_popular_routes_airports ON popular_layover_routes(origin_airport, destination_airport);

-- Enterprise usage summary
CREATE MATERIALIZED VIEW enterprise_usage_summary AS
SELECT 
  e.id as enterprise_id,
  e.name as enterprise_name,
  e.subscription_plan,
  DATE(a.timestamp) as usage_date,
  COUNT(*) as total_requests,
  COUNT(CASE WHEN a.response_status >= 200 AND a.response_status < 300 THEN 1 END) as successful_requests,
  AVG(a.response_time_ms) as avg_response_time,
  SUM(COALESCE(a.request_size_bytes, 0) + COALESCE(a.response_size_bytes, 0)) as total_bytes,
  COUNT(DISTINCT a.user_id) as active_users
FROM enterprises e
LEFT JOIN api_usage_logs a ON e.id = a.enterprise_id
WHERE a.timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY e.id, e.name, e.subscription_plan, DATE(a.timestamp)
ORDER BY e.id, usage_date DESC;

-- ============================================================================
-- SCHEDULED JOBS
-- ============================================================================

-- Schedule cache cleanup every 30 minutes
SELECT cron.schedule('cleanup-cache', '*/30 * * * *', 'SELECT cleanup_expired_cache();');

-- Schedule daily data cleanup
SELECT cron.schedule('cleanup-old-data', '0 2 * * *', 'SELECT cleanup_old_data();');

-- Refresh materialized views hourly
SELECT cron.schedule('refresh-popular-routes', '0 * * * *', 'REFRESH MATERIALIZED VIEW popular_layover_routes;');
SELECT cron.schedule('refresh-enterprise-usage', '15 * * * *', 'REFRESH MATERIALIZED VIEW enterprise_usage_summary;');

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Create default enterprise
INSERT INTO enterprises (id, name, slug, subscription_plan) VALUES 
('00000000-0000-0000-0000-000000000000', 'Default Enterprise', 'default', 'enterprise')
ON CONFLICT (id) DO NOTHING;

-- Seed essential system configurations
INSERT INTO system_configs (key, value, value_type, category, description) VALUES
('api.rate_limit.default', '1000', 'number', 'runtime', 'Default API rate limit per hour'),
('api.rate_limit.enterprise', '10000', 'number', 'runtime', 'Enterprise API rate limit per hour'),
('weather.cache_ttl', '300', 'number', 'runtime', 'Weather data cache TTL in seconds'),
('flight.search_timeout', '30', 'number', 'runtime', 'Flight search timeout in seconds'),
('layover.min_duration', '90', 'number', 'business', 'Minimum layover duration in minutes'),
('layover.max_duration', '1440', 'number', 'business', 'Maximum layover duration in minutes'),
('algorithm.weather_weight', '0.3', 'number', 'business', 'Weather factor in scoring algorithm'),
('algorithm.price_weight', '0.4', 'number', 'business', 'Price factor in scoring algorithm'),
('algorithm.rating_weight', '0.3', 'number', 'business', 'Rating factor in scoring algorithm'),
('security.session_timeout', '3600', 'number', 'security', 'Session timeout in seconds'),
('security.max_login_attempts', '5', 'number', 'security', 'Maximum login attempts before lockout'),
('cache.default_ttl', '600', 'number', 'runtime', 'Default cache TTL in seconds'),
('features.experimental_ml', 'false', 'boolean', 'runtime', 'Enable experimental ML features'),
('features.real_time_pricing', 'true', 'boolean', 'runtime', 'Enable real-time pricing updates'),
('integration.viator.timeout', '10', 'number', 'integration', 'Viator API timeout in seconds'),
('integration.weather.timeout', '5', 'number', 'integration', 'Weather API timeout in seconds')
ON CONFLICT (key) DO NOTHING;

-- Seed feature flags
INSERT INTO feature_flags (name, description, enabled, rollout_percentage) VALUES
('enhanced_search', 'Enhanced search with ML recommendations', true, 100),
('real_time_weather', 'Real-time weather integration for layover planning', true, 80),
('dynamic_pricing', 'Dynamic pricing based on demand and availability', true, 50),
('advanced_analytics', 'Advanced analytics dashboard for enterprises', false, 0),
('white_label_v2', 'Next generation white-label customization features', false, 10),
('ai_recommendations', 'AI-powered experience recommendations', true, 25),
('mobile_app_features', 'Enhanced features for mobile app users', false, 0),
('enterprise_reporting', 'Advanced reporting for enterprise customers', true, 100),
('social_features', 'Social sharing and collaborative planning', false, 5),
('loyalty_program', 'Loyalty program integration and rewards', false, 0)
ON CONFLICT (name) DO NOTHING;

-- Create admin user (password should be changed immediately)
INSERT INTO users (id, email, encrypted_password, enterprise_id, role, subscription_tier) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@layoverhq.com', crypt('admin123!', gen_salt('bf')), 
 '00000000-0000-0000-0000-000000000000', 'admin', 'enterprise')
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- PERFORMANCE ANALYSIS AND MONITORING SETUP
-- ============================================================================

-- Create performance monitoring view
CREATE OR REPLACE VIEW db_performance_metrics AS
SELECT 
  'active_connections' as metric,
  COUNT(*) as value,
  NOW() as timestamp
FROM pg_stat_activity WHERE state = 'active'
UNION ALL
SELECT 
  'avg_query_time' as metric,
  COALESCE(AVG(EXTRACT(EPOCH FROM (now() - query_start))), 0) as value,
  NOW() as timestamp
FROM pg_stat_activity WHERE state = 'active' AND query_start IS NOT NULL
UNION ALL
SELECT 
  'cache_hit_ratio' as metric,
  ROUND(100.0 * sum(blks_hit) / NULLIF(sum(blks_hit + blks_read), 0), 2) as value,
  NOW() as timestamp
FROM pg_stat_database
WHERE datname = current_database();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT UPDATE, INSERT ON users TO authenticated;
GRANT ALL ON system_configs TO authenticated;
GRANT ALL ON feature_flags TO authenticated;

-- Create read-only role for analytics
CREATE ROLE analytics_reader;
GRANT CONNECT ON DATABASE layoverhq TO analytics_reader;
GRANT USAGE ON SCHEMA public TO analytics_reader;
GRANT SELECT ON analytics_events, api_usage_logs, enterprise_usage_summary, popular_layover_routes TO analytics_reader;

COMMIT;

-- Display completion message
DO $$
BEGIN
  RAISE NOTICE 'LayoverHQ Enterprise Database Schema Migration completed successfully!';
  RAISE NOTICE 'Default admin user created: admin@layoverhq.com (password: admin123!)';
  RAISE NOTICE 'Please change the admin password immediately after first login.';
  RAISE NOTICE 'Database is now ready for enterprise multi-tenant operation.';
END $$;