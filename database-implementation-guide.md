# LayoverHQ Database Engineering Implementation Guide

## Overview
This comprehensive database engineering guide provides the technical foundation for transforming LayoverHQ into an enterprise-ready, multi-tenant travel platform. The architecture is designed to handle 10,000+ concurrent users, 1M+ API calls daily, and TB-scale data processing.

## Core Database Architecture

### Primary Stack
- **Database**: Neon Postgres (Enterprise with auto-scaling)
- **Cache**: Upstash Redis (Global replication)
- **Analytics**: Neon Analytics (Built-in time-series)
- **Deployment**: Vercel integration with connection pooling

### Key Design Principles

#### 1. Multi-Tenant Architecture
```sql
-- Row-Level Security for tenant isolation
CREATE POLICY tenant_isolation ON users
  FOR ALL TO authenticated_user
  USING (enterprise_id = current_setting('app.current_enterprise_id')::uuid);

-- Partition by tenant for performance
CREATE TABLE flights_partitioned (LIKE flights INCLUDING ALL)
PARTITION BY HASH(enterprise_id);
```

#### 2. Configuration-Driven Database
```sql
-- All application settings stored in database
CREATE TABLE system_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) NOT NULL,
  value JSONB NOT NULL,
  tenant_id UUID REFERENCES enterprises(id),
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE
);

-- Hot-reload capability with versioning
CREATE OR REPLACE FUNCTION get_config(config_key TEXT, tenant UUID DEFAULT NULL)
RETURNS JSONB AS $$
  SELECT value FROM system_configs 
  WHERE key = config_key 
    AND (tenant_id = tenant OR tenant_id IS NULL)
    AND is_active = TRUE
  ORDER BY tenant_id NULLS LAST, version DESC
  LIMIT 1;
$$ LANGUAGE SQL STABLE;
```

## Critical Database Tables

### 1. Core Business Tables

#### Users Table (Multi-tenant)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  enterprise_id UUID REFERENCES enterprises(id),
  subscription_tier VARCHAR(50) NOT NULL DEFAULT 'free',
  api_limits JSONB DEFAULT '{}',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Optimized indexes for multi-tenant queries
CREATE INDEX idx_users_enterprise_active 
ON users(enterprise_id, subscription_tier) 
WHERE deleted_at IS NULL;

-- RLS Policy
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_users ON users
  FOR ALL TO authenticated_user
  USING (enterprise_id = current_setting('app.current_enterprise_id')::uuid);
```

#### Flights Table (High-Performance Search)
```sql
CREATE TABLE flights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL,
  origin_airport VARCHAR(3) NOT NULL,
  destination_airport VARCHAR(3) NOT NULL,
  departure_datetime TIMESTAMPTZ NOT NULL,
  arrival_datetime TIMESTAMPTZ NOT NULL,
  price_total DECIMAL(10,2) NOT NULL,
  price_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  layovers JSONB DEFAULT '[]',
  search_hash VARCHAR(64), -- For deduplication
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE(departure_datetime);

-- Performance-critical indexes
CREATE INDEX idx_flights_route_search 
ON flights(origin_airport, destination_airport, departure_datetime, price_total)
WHERE expires_at > NOW();

CREATE INDEX idx_flights_layovers_gin 
ON flights USING gin(layovers)
WHERE expires_at > NOW();

-- Automatic cleanup of expired flights
CREATE OR REPLACE FUNCTION cleanup_expired_flights()
RETURNS void AS $$
  DELETE FROM flights WHERE expires_at < NOW() - INTERVAL '1 hour';
$$ LANGUAGE SQL;

SELECT cron.schedule('cleanup-flights', '*/30 * * * *', 'SELECT cleanup_expired_flights();');
```

### 2. Admin Configuration Tables

#### System Configs (Zero-CLI Management)
```sql
CREATE TABLE system_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) NOT NULL,
  value JSONB NOT NULL,
  value_type VARCHAR(50) NOT NULL, -- string, number, boolean, json, array
  description TEXT,
  category VARCHAR(100) NOT NULL, -- runtime, business, security, etc.
  requires_restart BOOLEAN DEFAULT FALSE,
  tenant_id UUID REFERENCES enterprises(id),
  is_active BOOLEAN DEFAULT TRUE,
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint allowing tenant overrides
CREATE UNIQUE INDEX idx_system_configs_key_tenant_active
ON system_configs(key, COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid))
WHERE is_active = TRUE;

-- Configuration change triggers
CREATE OR REPLACE FUNCTION notify_config_change()
RETURNS trigger AS $$
BEGIN
  -- Notify application of configuration changes
  PERFORM pg_notify('config_change', json_build_object(
    'key', NEW.key,
    'tenant_id', NEW.tenant_id,
    'value', NEW.value,
    'requires_restart', NEW.requires_restart
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER config_change_notify
  AFTER INSERT OR UPDATE ON system_configs
  FOR EACH ROW EXECUTE FUNCTION notify_config_change();
```

#### Feature Flags (A/B Testing & Gradual Rollout)
```sql
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT FALSE,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),
  conditions JSONB DEFAULT '{}', -- User/tenant conditions
  tenant_overrides JSONB DEFAULT '{}', -- Per-tenant enable/disable
  user_overrides JSONB DEFAULT '{}', -- Per-user enable/disable
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
$$ LANGUAGE plpgsql STABLE;
```

### 3. Analytics and Monitoring Tables

#### API Usage Tracking (Billing & Rate Limiting)
```sql
CREATE TABLE api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id UUID REFERENCES enterprises(id) NOT NULL,
  user_id UUID REFERENCES users(id),
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  response_status INTEGER NOT NULL,
  response_time_ms INTEGER NOT NULL,
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,
  timestamp TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE(timestamp);

-- Create partitions for the next 12 months
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
    
    start_date := end_date;
  END LOOP;
END $$;

-- Billing aggregation view
CREATE MATERIALIZED VIEW api_usage_billing AS
SELECT 
  enterprise_id,
  DATE(timestamp) as usage_date,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE response_status >= 200 AND response_status < 300) as successful_requests,
  AVG(response_time_ms) as avg_response_time,
  SUM(request_size_bytes + response_size_bytes) as total_bytes
FROM api_usage_logs 
WHERE timestamp >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY enterprise_id, DATE(timestamp);

-- Refresh billing data hourly
SELECT cron.schedule('refresh-billing', '0 * * * *', 'REFRESH MATERIALIZED VIEW api_usage_billing;');
```

## Performance Optimization Strategies

### 1. Intelligent Caching
```sql
-- Layover analysis cache with smart invalidation
CREATE TABLE layover_analyses_cache (
  cache_key VARCHAR(255) PRIMARY KEY,
  airport_code VARCHAR(3) NOT NULL,
  analysis_result JSONB NOT NULL,
  confidence_score DECIMAL(3,2),
  expires_at TIMESTAMPTZ NOT NULL,
  hit_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ DEFAULT NOW()
);

-- Cache warming function
CREATE OR REPLACE FUNCTION warm_popular_caches()
RETURNS void AS $$
  -- Pre-compute analysis for popular routes
  INSERT INTO layover_analyses_cache (cache_key, airport_code, analysis_result, expires_at)
  SELECT 
    'popular_' || airport_code,
    airport_code,
    jsonb_build_object('precomputed', true),
    NOW() + INTERVAL '4 hours'
  FROM (
    SELECT origin_airport as airport_code FROM flights 
    WHERE expires_at > NOW()
    GROUP BY origin_airport 
    ORDER BY COUNT(*) DESC 
    LIMIT 20
  ) popular_airports
  ON CONFLICT (cache_key) DO NOTHING;
$$ LANGUAGE SQL;
```

### 2. Query Optimization
```sql
-- Materialized views for common aggregations
CREATE MATERIALIZED VIEW popular_layover_routes AS
SELECT 
  origin_airport,
  destination_airport,
  COUNT(*) as flight_count,
  AVG(price_total) as avg_price,
  AVG(ARRAY_LENGTH(layovers::jsonb, 1)) as avg_layovers
FROM flights 
WHERE expires_at > NOW() 
  AND layovers IS NOT NULL 
  AND jsonb_array_length(layovers) > 0
GROUP BY origin_airport, destination_airport
HAVING COUNT(*) >= 5;

-- Partial indexes for hot data
CREATE INDEX idx_flights_active_cheap
ON flights(departure_datetime, price_total)
WHERE expires_at > NOW() AND price_total < 1000;

CREATE INDEX idx_experiences_premium
ON experiences(city, rating DESC, price_from)
WHERE rating >= 4.0 AND price_from IS NOT NULL;
```

### 3. Connection Management
```sql
-- Connection pool monitoring
CREATE OR REPLACE VIEW connection_stats AS
SELECT 
  datname,
  usename,
  client_addr,
  state,
  COUNT(*) as connection_count,
  AVG(EXTRACT(EPOCH FROM (now() - query_start))) as avg_query_time
FROM pg_stat_activity 
WHERE datname = current_database()
GROUP BY datname, usename, client_addr, state;

-- Kill long-running queries
CREATE OR REPLACE FUNCTION kill_long_queries(max_duration INTERVAL DEFAULT '5 minutes')
RETURNS INTEGER AS $$
DECLARE
  killed_count INTEGER := 0;
  query_record RECORD;
BEGIN
  FOR query_record IN
    SELECT pid FROM pg_stat_activity 
    WHERE state = 'active' 
      AND query_start < NOW() - max_duration
      AND query NOT LIKE '%pg_stat_activity%'
  LOOP
    PERFORM pg_terminate_backend(query_record.pid);
    killed_count := killed_count + 1;
  END LOOP;
  
  RETURN killed_count;
END;
$$ LANGUAGE plpgsql;
```

## Data Migration and Deployment

### 1. Zero-Downtime Migration Strategy
```sql
-- Migration with backwards compatibility
CREATE OR REPLACE FUNCTION migrate_to_enterprise_schema()
RETURNS void AS $$
BEGIN
  -- Step 1: Create new tables alongside existing ones
  CREATE TABLE IF NOT EXISTS enterprises_new (LIKE enterprises INCLUDING ALL);
  
  -- Step 2: Populate with default enterprise
  INSERT INTO enterprises_new (id, name, slug, subscription_plan)
  VALUES ('00000000-0000-0000-0000-000000000000', 'Default Enterprise', 'default', 'enterprise')
  ON CONFLICT DO NOTHING;
  
  -- Step 3: Update existing users to belong to default enterprise
  UPDATE users SET enterprise_id = '00000000-0000-0000-0000-000000000000'
  WHERE enterprise_id IS NULL;
  
  -- Step 4: Enable RLS gradually
  -- (This would be done in stages with feature flags)
  
  RAISE NOTICE 'Migration completed successfully';
END;
$$ LANGUAGE plpgsql;
```

### 2. Configuration Seeding
```sql
-- Seed essential configuration
INSERT INTO system_configs (key, value, value_type, category, description) VALUES
('api.rate_limit.default', '1000', 'number', 'runtime', 'Default API rate limit per hour'),
('weather.cache_ttl', '300', 'number', 'runtime', 'Weather data cache TTL in seconds'),
('flight.search_timeout', '30', 'number', 'runtime', 'Flight search timeout in seconds'),
('layover.min_duration', '90', 'number', 'business', 'Minimum layover duration in minutes'),
('algorithm.weather_weight', '0.3', 'number', 'business', 'Weather factor in scoring algorithm'),
('security.session_timeout', '3600', 'number', 'security', 'Session timeout in seconds'),
('features.experimental_ml', 'false', 'boolean', 'runtime', 'Enable experimental ML features')
ON CONFLICT (key) DO NOTHING;

-- Seed feature flags
INSERT INTO feature_flags (name, description, enabled, rollout_percentage) VALUES
('enhanced_search', 'Enhanced search with ML recommendations', true, 100),
('real_time_weather', 'Real-time weather integration', true, 50),
('advanced_analytics', 'Advanced analytics dashboard', false, 0),
('white_label_v2', 'Next generation white-label features', false, 5)
ON CONFLICT (name) DO NOTHING;
```

## Monitoring and Alerting

### 1. Database Health Monitoring
```sql
-- Database performance metrics
CREATE OR REPLACE VIEW db_performance_metrics AS
SELECT 
  'active_connections' as metric,
  COUNT(*) as value,
  NOW() as timestamp
FROM pg_stat_activity WHERE state = 'active'
UNION ALL
SELECT 
  'avg_query_time' as metric,
  AVG(EXTRACT(EPOCH FROM (now() - query_start))) as value,
  NOW() as timestamp
FROM pg_stat_activity WHERE state = 'active'
UNION ALL
SELECT 
  'cache_hit_ratio' as metric,
  ROUND(100.0 * sum(blks_hit) / NULLIF(sum(blks_hit + blks_read), 0), 2) as value,
  NOW() as timestamp
FROM pg_stat_database;

-- Alert triggers
CREATE OR REPLACE FUNCTION check_performance_alerts()
RETURNS void AS $$
DECLARE
  active_connections INTEGER;
  avg_query_time NUMERIC;
  cache_hit_ratio NUMERIC;
BEGIN
  SELECT COUNT(*) INTO active_connections 
  FROM pg_stat_activity WHERE state = 'active';
  
  IF active_connections > 80 THEN
    PERFORM pg_notify('performance_alert', 
      json_build_object('type', 'high_connections', 'value', active_connections)::text);
  END IF;
  
  -- Additional checks...
END;
$$ LANGUAGE plpgsql;

-- Schedule performance checks
SELECT cron.schedule('performance-check', '* * * * *', 'SELECT check_performance_alerts();');
```

### 2. Business Metrics Monitoring
```sql
-- Real-time business metrics
CREATE OR REPLACE VIEW business_metrics AS
SELECT 
  'total_enterprises' as metric,
  COUNT(*) as value
FROM enterprises WHERE deleted_at IS NULL
UNION ALL
SELECT 
  'active_users_24h' as metric,
  COUNT(DISTINCT user_id) as value
FROM api_usage_logs 
WHERE timestamp > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
  'api_calls_last_hour' as metric,
  COUNT(*) as value
FROM api_usage_logs 
WHERE timestamp > NOW() - INTERVAL '1 hour';
```

## Security and Compliance

### 1. Data Encryption and Protection
```sql
-- Encrypt sensitive configuration values
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION encrypt_config_value(plaintext TEXT, config_key TEXT)
RETURNS TEXT AS $$
  SELECT pgp_sym_encrypt(plaintext, current_setting('app.encryption_key') || config_key);
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION decrypt_config_value(ciphertext TEXT, config_key TEXT)
RETURNS TEXT AS $$
  SELECT pgp_sym_decrypt(ciphertext, current_setting('app.encryption_key') || config_key);
$$ LANGUAGE SQL;
```

### 2. Audit Logging
```sql
-- Comprehensive audit trail
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(100) NOT NULL,
  operation VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
  row_id UUID,
  old_values JSONB,
  new_values JSONB,
  user_id UUID REFERENCES users(id),
  enterprise_id UUID REFERENCES enterprises(id),
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (
    table_name, operation, row_id, old_values, new_values,
    user_id, enterprise_id, ip_address
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
    current_setting('app.current_user_id', true)::uuid,
    current_setting('app.current_enterprise_id', true)::uuid,
    current_setting('app.current_ip', true)::inet
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_system_configs
  AFTER INSERT OR UPDATE OR DELETE ON system_configs
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

## Deployment Checklist

### Pre-Deployment
- [ ] Schema validation and backwards compatibility check
- [ ] Performance testing with production-like data volume
- [ ] Security scanning and vulnerability assessment
- [ ] Backup and recovery procedure testing
- [ ] Monitoring and alerting configuration verification

### Post-Deployment
- [ ] Database performance monitoring activation
- [ ] Configuration management system validation
- [ ] Multi-tenant access testing
- [ ] Feature flag functionality verification
- [ ] Billing and usage tracking validation

This comprehensive database architecture provides the foundation for LayoverHQ's enterprise transformation, ensuring scalability, security, and maintainability for a successful Y Combinator application.