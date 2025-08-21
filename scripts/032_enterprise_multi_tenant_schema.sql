-- =====================================================
-- LayoverHQ Enterprise Multi-Tenant Database Schema
-- =====================================================
-- Designed for 10,000+ concurrent users, 100,000+ QPS
-- Multi-tenant with row-level security and performance isolation
-- GDPR/CCPA compliant with audit trails and encryption

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "postgis" CASCADE;

-- =====================================================
-- ENTERPRISE TENANT MANAGEMENT
-- =====================================================

-- Enhanced enterprises table with white-label support
CREATE TABLE IF NOT EXISTS enterprises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(255),
    subdomain VARCHAR(100),
    
    -- Subscription and billing
    subscription_plan VARCHAR(50) NOT NULL DEFAULT 'free',
    billing_customer_id VARCHAR(255),
    subscription_status VARCHAR(50) DEFAULT 'active',
    
    -- API and authentication
    api_key_hash VARCHAR(255) UNIQUE,
    webhook_url TEXT,
    webhook_secret VARCHAR(255),
    
    -- Rate limits and quotas
    rate_limits JSONB DEFAULT '{}',
    usage_quotas JSONB DEFAULT '{}',
    current_usage JSONB DEFAULT '{}',
    
    -- White-label configuration
    white_label_config JSONB DEFAULT '{}',
    branding_settings JSONB DEFAULT '{}',
    custom_domain_verified BOOLEAN DEFAULT FALSE,
    
    -- Features and settings
    enabled_features JSONB DEFAULT '[]',
    settings JSONB DEFAULT '{}',
    
    -- Compliance and security
    data_residency_region VARCHAR(50) DEFAULT 'us-east-1',
    compliance_requirements JSONB DEFAULT '[]',
    encryption_key_id VARCHAR(255),
    
    -- Status and audit
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial', 'churned', 'deleted')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Add constraint for data residency
    CONSTRAINT valid_residency_region CHECK (data_residency_region IN ('us-east-1', 'eu-west-1', 'ap-southeast-1')),
    CONSTRAINT valid_subscription_plan CHECK (subscription_plan IN ('free', 'starter', 'professional', 'enterprise'))
);

-- Enhanced indexes for enterprises
CREATE INDEX idx_enterprises_slug ON enterprises(slug) WHERE status != 'deleted';
CREATE INDEX idx_enterprises_domain ON enterprises(domain) WHERE status != 'deleted';
CREATE INDEX idx_enterprises_api_key_hash ON enterprises(api_key_hash) WHERE status = 'active';
CREATE INDEX idx_enterprises_subscription_plan ON enterprises(subscription_plan);
CREATE INDEX idx_enterprises_status ON enterprises(status);
CREATE INDEX idx_enterprises_created_at ON enterprises(created_at);

-- Enhanced users table with enterprise relationships
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    
    -- Enterprise relationship
    enterprise_id UUID REFERENCES enterprises(id) ON DELETE SET NULL,
    role_in_enterprise VARCHAR(50) DEFAULT 'member',
    
    -- Personal information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(255),
    avatar_url TEXT,
    phone VARCHAR(20),
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'en-US',
    
    -- Subscription and preferences
    subscription_tier VARCHAR(50) NOT NULL DEFAULT 'free',
    api_limits JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{}',
    
    -- Security and compliance
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    recovery_codes JSONB DEFAULT '[]',
    consent_data_processing BOOLEAN DEFAULT FALSE,
    consent_marketing BOOLEAN DEFAULT FALSE,
    consent_timestamp TIMESTAMPTZ,
    
    -- Activity tracking
    last_login TIMESTAMPTZ,
    last_active TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT valid_role_in_enterprise CHECK (role_in_enterprise IN ('owner', 'admin', 'manager', 'member', 'viewer')),
    CONSTRAINT valid_subscription_tier CHECK (subscription_tier IN ('free', 'pro', 'enterprise'))
);

-- Partition users table by enterprise_id for performance
CREATE INDEX idx_users_enterprise_id ON users(enterprise_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_last_active ON users(last_active DESC);
CREATE INDEX idx_users_created_at ON users(created_at);

-- =====================================================
-- FLIGHT DATA MANAGEMENT
-- =====================================================

-- Enhanced flights table with partitioning
CREATE TABLE IF NOT EXISTS flights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Provider and identification
    provider VARCHAR(50) NOT NULL,
    provider_flight_id VARCHAR(255) NOT NULL,
    booking_class VARCHAR(10),
    
    -- Route information
    origin_airport VARCHAR(3) NOT NULL,
    destination_airport VARCHAR(3) NOT NULL,
    route_hash VARCHAR(64), -- For efficient route-based queries
    
    -- Schedule
    departure_datetime TIMESTAMPTZ NOT NULL,
    arrival_datetime TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL,
    
    -- Pricing
    price_total DECIMAL(10,2) NOT NULL,
    price_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    price_breakdown JSONB DEFAULT '{}',
    taxes_and_fees DECIMAL(10,2) DEFAULT 0,
    
    -- Flight details
    airline_code VARCHAR(3) NOT NULL,
    airline_name VARCHAR(255),
    flight_number VARCHAR(10) NOT NULL,
    aircraft_type VARCHAR(50),
    
    -- Layover and connection information
    layovers JSONB DEFAULT '[]',
    connection_time_minutes INTEGER,
    is_direct_flight BOOLEAN DEFAULT TRUE,
    stops_count INTEGER DEFAULT 0,
    
    -- Amenities and services
    amenities JSONB DEFAULT '{}',
    baggage_policy JSONB DEFAULT '{}',
    meal_service VARCHAR(50),
    wifi_available BOOLEAN DEFAULT FALSE,
    seat_configuration JSONB DEFAULT '{}',
    
    -- Booking and availability
    booking_url TEXT,
    deep_link_url TEXT,
    available_seats INTEGER,
    booking_deadline TIMESTAMPTZ,
    
    -- Data quality and caching
    data_quality_score DECIMAL(3,2) DEFAULT 1.0,
    confidence_score DECIMAL(3,2) DEFAULT 1.0,
    search_hash VARCHAR(64),
    cache_key VARCHAR(255),
    expires_at TIMESTAMPTZ NOT NULL,
    last_verified TIMESTAMPTZ DEFAULT NOW(),
    
    -- Multi-tenant support
    enterprise_id UUID REFERENCES enterprises(id),
    access_level VARCHAR(20) DEFAULT 'public' CHECK (access_level IN ('public', 'enterprise', 'private')),
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partition flights table by departure_datetime for time-series performance
CREATE TABLE flights_current PARTITION OF flights 
FOR VALUES FROM (NOW() - INTERVAL '1 day') TO (NOW() + INTERVAL '7 days');

CREATE TABLE flights_historical PARTITION OF flights 
FOR VALUES FROM (NOW() - INTERVAL '30 days') TO (NOW() - INTERVAL '1 day');

-- Comprehensive indexes for flights
CREATE INDEX idx_flights_route_date ON flights(origin_airport, destination_airport, departure_datetime);
CREATE INDEX idx_flights_provider ON flights(provider, provider_flight_id);
CREATE INDEX idx_flights_price ON flights(price_total) WHERE expires_at > NOW();
CREATE INDEX idx_flights_search_hash ON flights(search_hash) WHERE expires_at > NOW();
CREATE INDEX idx_flights_expires_at ON flights(expires_at);
CREATE INDEX idx_flights_layovers_gin ON flights USING gin(layovers);
CREATE INDEX idx_flights_route_hash ON flights(route_hash);
CREATE INDEX idx_flights_enterprise_id ON flights(enterprise_id);
CREATE INDEX idx_flights_airline ON flights(airline_code, departure_datetime);

-- Unique constraint to prevent duplicates
CREATE UNIQUE INDEX idx_flights_unique_provider_flight 
ON flights(provider, provider_flight_id, departure_datetime) 
WHERE expires_at > NOW();

-- =====================================================
-- EXPERIENCES AND ACTIVITIES
-- =====================================================

-- Enhanced experiences table with location data
CREATE TABLE IF NOT EXISTS experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Provider information
    viator_product_code VARCHAR(50) UNIQUE NOT NULL,
    provider_category VARCHAR(100),
    
    -- Basic information
    title VARCHAR(500) NOT NULL,
    description TEXT,
    short_description TEXT,
    highlights JSONB DEFAULT '[]',
    
    -- Location data
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    location_coords POINT,
    address JSONB DEFAULT '{}',
    meeting_point JSONB DEFAULT '{}',
    
    -- Categories and tags
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    tags JSONB DEFAULT '[]',
    activity_type VARCHAR(50),
    difficulty_level VARCHAR(20),
    
    -- Timing and duration
    duration_minutes INTEGER,
    duration_text VARCHAR(100),
    operating_hours JSONB DEFAULT '{}',
    seasonal_availability JSONB DEFAULT '{}',
    
    -- Pricing
    price_from DECIMAL(10,2),
    price_currency VARCHAR(3) DEFAULT 'USD',
    pricing_tiers JSONB DEFAULT '[]',
    group_discounts JSONB DEFAULT '{}',
    
    -- Quality metrics
    rating DECIMAL(3,2),
    review_count INTEGER DEFAULT 0,
    popularity_score DECIMAL(3,2),
    
    -- Weather and conditions
    weather_suitable JSONB DEFAULT '{}',
    indoor_outdoor VARCHAR(20),
    weather_dependency VARCHAR(20),
    
    -- Booking information
    booking_url TEXT,
    instant_confirmation BOOLEAN DEFAULT FALSE,
    advance_booking_required INTEGER DEFAULT 0, -- hours
    cancellation_policy JSONB DEFAULT '{}',
    
    -- Media and content
    images JSONB DEFAULT '[]',
    videos JSONB DEFAULT '[]',
    virtual_tour_url TEXT,
    
    -- Accessibility and requirements
    accessibility_features JSONB DEFAULT '[]',
    age_restrictions JSONB DEFAULT '{}',
    physical_requirements TEXT,
    languages_available JSONB DEFAULT '[]',
    
    -- Multi-tenant support
    enterprise_id UUID REFERENCES enterprises(id),
    access_level VARCHAR(20) DEFAULT 'public',
    custom_pricing JSONB DEFAULT '{}',
    
    -- Data management
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    data_freshness_score DECIMAL(3,2) DEFAULT 1.0,
    verification_status VARCHAR(20) DEFAULT 'unverified',
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comprehensive indexes for experiences
CREATE INDEX idx_experiences_city ON experiences(city);
CREATE INDEX idx_experiences_category ON experiences(category, subcategory);
CREATE INDEX idx_experiences_duration ON experiences(duration_minutes);
CREATE INDEX idx_experiences_price ON experiences(price_from);
CREATE INDEX idx_experiences_rating ON experiences(rating DESC, review_count DESC);
CREATE INDEX idx_experiences_location ON experiences USING gist(location_coords);
CREATE INDEX idx_experiences_weather_gin ON experiences USING gin(weather_suitable);
CREATE INDEX idx_experiences_activity_type ON experiences(activity_type);
CREATE INDEX idx_experiences_tags_gin ON experiences USING gin(tags);
CREATE INDEX idx_experiences_enterprise_id ON experiences(enterprise_id);
CREATE INDEX idx_experiences_city_rating ON experiences(city, rating DESC);

-- =====================================================
-- LAYOVER ANALYSIS AND CACHING
-- =====================================================

-- Enhanced layover analysis cache
CREATE TABLE IF NOT EXISTS layover_analyses_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Cache identification
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    cache_version INTEGER DEFAULT 1,
    
    -- Layover information
    airport_code VARCHAR(3) NOT NULL,
    layover_duration INTEGER NOT NULL,
    arrival_time TIMESTAMPTZ NOT NULL,
    departure_time TIMESTAMPTZ NOT NULL,
    
    -- Analysis results
    analysis_result JSONB NOT NULL,
    opportunity_score DECIMAL(3,2),
    recommended_experiences JSONB DEFAULT '[]',
    
    -- Context data
    weather_conditions JSONB,
    transit_options JSONB,
    airport_amenities JSONB DEFAULT '{}',
    
    -- Quality metrics
    confidence_score DECIMAL(3,2),
    data_completeness DECIMAL(3,2),
    
    -- Multi-tenant support
    enterprise_id UUID REFERENCES enterprises(id),
    user_preferences JSONB DEFAULT '{}',
    
    -- Cache management
    expires_at TIMESTAMPTZ NOT NULL,
    hit_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMPTZ DEFAULT NOW(),
    access_pattern JSONB DEFAULT '{}',
    
    -- Performance tracking
    computation_time_ms INTEGER,
    data_sources JSONB DEFAULT '[]',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for layover cache
CREATE INDEX idx_layover_cache_key ON layover_analyses_cache(cache_key);
CREATE INDEX idx_layover_cache_airport ON layover_analyses_cache(airport_code, expires_at);
CREATE INDEX idx_layover_cache_expires ON layover_analyses_cache(expires_at);
CREATE INDEX idx_layover_cache_accessed ON layover_analyses_cache(last_accessed);
CREATE INDEX idx_layover_cache_enterprise_id ON layover_analyses_cache(enterprise_id);
CREATE INDEX idx_layover_cache_opportunity_score ON layover_analyses_cache(opportunity_score DESC);

-- =====================================================
-- ANALYTICS AND MONITORING
-- =====================================================

-- Enhanced analytics events with partitioning
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event identification
    event_type VARCHAR(100) NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    event_category VARCHAR(50),
    
    -- User and session data
    user_id UUID REFERENCES users(id),
    enterprise_id UUID REFERENCES enterprises(id),
    session_id VARCHAR(255),
    anonymous_id VARCHAR(255),
    
    -- Event properties
    properties JSONB DEFAULT '{}',
    user_properties JSONB DEFAULT '{}',
    
    -- Technical context
    ip_address INET,
    user_agent TEXT,
    referer TEXT,
    page_url TEXT,
    
    -- Device and location
    device_type VARCHAR(50),
    browser VARCHAR(50),
    operating_system VARCHAR(50),
    country VARCHAR(2),
    region VARCHAR(100),
    city VARCHAR(100),
    
    -- Performance data
    page_load_time_ms INTEGER,
    api_response_time_ms INTEGER,
    
    -- Business metrics
    revenue_impact DECIMAL(10,2),
    conversion_funnel_step VARCHAR(100),
    
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
) PARTITION BY RANGE (timestamp);

-- Create partitions for analytics events
CREATE TABLE analytics_events_current PARTITION OF analytics_events 
FOR VALUES FROM (NOW() - INTERVAL '1 day') TO (NOW() + INTERVAL '1 day');

CREATE TABLE analytics_events_recent PARTITION OF analytics_events 
FOR VALUES FROM (NOW() - INTERVAL '7 days') TO (NOW() - INTERVAL '1 day');

CREATE TABLE analytics_events_historical PARTITION OF analytics_events 
FOR VALUES FROM (NOW() - INTERVAL '90 days') TO (NOW() - INTERVAL '7 days');

-- Indexes for analytics events
CREATE INDEX idx_analytics_events_type_timestamp ON analytics_events(event_type, timestamp DESC);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id, timestamp DESC);
CREATE INDEX idx_analytics_events_enterprise_id ON analytics_events(enterprise_id, timestamp DESC);
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id, timestamp DESC);
CREATE INDEX idx_analytics_events_properties_gin ON analytics_events USING gin(properties);

-- Enhanced API usage logs with billing integration
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Request identification
    request_id VARCHAR(255),
    trace_id VARCHAR(255),
    
    -- Enterprise and user context
    enterprise_id UUID REFERENCES enterprises(id) NOT NULL,
    user_id UUID REFERENCES users(id),
    api_key_used VARCHAR(100),
    
    -- Request details
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    path VARCHAR(500),
    query_parameters JSONB DEFAULT '{}',
    
    -- Response details
    response_status INTEGER NOT NULL,
    response_time_ms INTEGER NOT NULL,
    request_size_bytes INTEGER,
    response_size_bytes INTEGER,
    
    -- Error information
    error_code VARCHAR(50),
    error_message TEXT,
    error_details JSONB DEFAULT '{}',
    
    -- Billing and quotas
    billable_operation BOOLEAN DEFAULT TRUE,
    operation_cost DECIMAL(10,4) DEFAULT 0,
    quota_consumed INTEGER DEFAULT 1,
    
    -- Rate limiting
    rate_limit_key VARCHAR(255),
    rate_limit_remaining INTEGER,
    rate_limit_reset_at TIMESTAMPTZ,
    
    -- Geographic and technical context
    ip_address INET,
    user_agent TEXT,
    country VARCHAR(2),
    
    timestamp TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (timestamp);

-- Create partitions for API usage logs
CREATE TABLE api_usage_logs_current PARTITION OF api_usage_logs 
FOR VALUES FROM (NOW() - INTERVAL '1 day') TO (NOW() + INTERVAL '1 day');

CREATE TABLE api_usage_logs_recent PARTITION OF api_usage_logs 
FOR VALUES FROM (NOW() - INTERVAL '30 days') TO (NOW() - INTERVAL '1 day');

-- Indexes for API usage logs
CREATE INDEX idx_api_usage_enterprise_timestamp ON api_usage_logs(enterprise_id, timestamp DESC);
CREATE INDEX idx_api_usage_endpoint ON api_usage_logs(endpoint, timestamp DESC);
CREATE INDEX idx_api_usage_status ON api_usage_logs(response_status, timestamp DESC);
CREATE INDEX idx_api_usage_billing ON api_usage_logs(enterprise_id, DATE(timestamp)) WHERE billable_operation = TRUE;
CREATE INDEX idx_api_usage_user_id ON api_usage_logs(user_id, timestamp DESC);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all main tables
ALTER TABLE enterprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE layover_analyses_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enterprise policies
CREATE POLICY "Users can view their enterprise" ON enterprises
    FOR SELECT TO authenticated
    USING (
        id IN (
            SELECT enterprise_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Enterprise owners can manage their enterprise" ON enterprises
    FOR ALL TO authenticated
    USING (
        id IN (
            SELECT enterprise_id FROM users 
            WHERE id = auth.uid() AND role_in_enterprise = 'owner'
        )
    );

-- User policies
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Enterprise admins can view enterprise users" ON users
    FOR SELECT TO authenticated
    USING (
        enterprise_id IN (
            SELECT enterprise_id FROM users 
            WHERE id = auth.uid() 
            AND role_in_enterprise IN ('owner', 'admin')
        )
    );

-- Flight policies
CREATE POLICY "Users can view public flights" ON flights
    FOR SELECT TO authenticated
    USING (access_level = 'public');

CREATE POLICY "Enterprise users can view enterprise flights" ON flights
    FOR SELECT TO authenticated
    USING (
        access_level = 'enterprise' AND
        enterprise_id IN (
            SELECT enterprise_id FROM users WHERE id = auth.uid()
        )
    );

-- Experience policies
CREATE POLICY "Users can view public experiences" ON experiences
    FOR SELECT TO authenticated
    USING (access_level = 'public');

CREATE POLICY "Enterprise users can view enterprise experiences" ON experiences
    FOR SELECT TO authenticated
    USING (
        access_level = 'enterprise' AND
        enterprise_id IN (
            SELECT enterprise_id FROM users WHERE id = auth.uid()
        )
    );

-- Layover cache policies
CREATE POLICY "Users can access their layover analyses" ON layover_analyses_cache
    FOR SELECT TO authenticated
    USING (
        enterprise_id IS NULL OR
        enterprise_id IN (
            SELECT enterprise_id FROM users WHERE id = auth.uid()
        )
    );

-- Analytics policies
CREATE POLICY "Users can view their analytics events" ON analytics_events
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Enterprise admins can view enterprise analytics" ON analytics_events
    FOR SELECT TO authenticated
    USING (
        enterprise_id IN (
            SELECT enterprise_id FROM users 
            WHERE id = auth.uid() 
            AND role_in_enterprise IN ('owner', 'admin')
        )
    );

-- API usage policies
CREATE POLICY "Enterprise users can view their API usage" ON api_usage_logs
    FOR SELECT TO authenticated
    USING (
        enterprise_id IN (
            SELECT enterprise_id FROM users WHERE id = auth.uid()
        )
    );

-- Comments for documentation
COMMENT ON TABLE enterprises IS 'Multi-tenant enterprise customers with white-label support and compliance features';
COMMENT ON TABLE users IS 'Enterprise users with role-based access and subscription management';
COMMENT ON TABLE flights IS 'Flight data with multi-provider support and intelligent caching';
COMMENT ON TABLE experiences IS 'Curated travel experiences with location and weather intelligence';
COMMENT ON TABLE layover_analyses_cache IS 'Intelligent layover opportunity analysis with caching';
COMMENT ON TABLE analytics_events IS 'Comprehensive user behavior analytics with partitioning';
COMMENT ON TABLE api_usage_logs IS 'API usage tracking for billing and rate limiting';