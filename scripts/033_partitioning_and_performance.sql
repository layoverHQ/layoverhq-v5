-- =====================================================
-- LayoverHQ Partitioning Strategy and Performance Optimization
-- =====================================================
-- Designed for 100K+ QPS with automatic partition management
-- Includes materialized views, query optimization, and monitoring

-- =====================================================
-- AUTOMATIC PARTITION MANAGEMENT
-- =====================================================

-- Function to create partitions automatically
CREATE OR REPLACE FUNCTION create_time_partitions(
    table_name TEXT,
    start_date DATE,
    end_date DATE,
    partition_interval INTERVAL DEFAULT '1 day'
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    current_date DATE := start_date;
    next_date DATE;
    partition_name TEXT;
    partition_count INTEGER := 0;
BEGIN
    WHILE current_date < end_date LOOP
        next_date := current_date + partition_interval;
        partition_name := table_name || '_' || to_char(current_date, 'YYYY_MM_DD');
        
        -- Create partition if it doesn't exist
        BEGIN
            EXECUTE format(
                'CREATE TABLE IF NOT EXISTS %I PARTITION OF %I 
                 FOR VALUES FROM (%L) TO (%L)',
                partition_name, table_name, current_date, next_date
            );
            partition_count := partition_count + 1;
        EXCEPTION WHEN duplicate_table THEN
            -- Partition already exists, continue
        END;
        
        current_date := next_date;
    END LOOP;
    
    RETURN partition_count;
END;
$$;

-- Function to automatically drop old partitions
CREATE OR REPLACE FUNCTION drop_old_partitions(
    table_name TEXT,
    retention_days INTEGER DEFAULT 90
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    partition_name TEXT;
    drop_count INTEGER := 0;
    cutoff_date DATE := CURRENT_DATE - retention_days;
BEGIN
    FOR partition_name IN
        SELECT schemaname||'.'||tablename
        FROM pg_tables
        WHERE tablename LIKE table_name || '_%'
        AND schemaname = 'public'
    LOOP
        -- Extract date from partition name and check if it's old enough
        DECLARE
            partition_date TEXT;
            partition_date_parsed DATE;
        BEGIN
            partition_date := substring(partition_name from '[0-9]{4}_[0-9]{2}_[0-9]{2}');
            partition_date_parsed := to_date(partition_date, 'YYYY_MM_DD');
            
            IF partition_date_parsed < cutoff_date THEN
                EXECUTE 'DROP TABLE IF EXISTS ' || partition_name;
                drop_count := drop_count + 1;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- Skip if date parsing fails
            CONTINUE;
        END;
    END LOOP;
    
    RETURN drop_count;
END;
$$;

-- =====================================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- =====================================================

-- Popular routes with layover opportunities
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_popular_layover_routes AS
SELECT 
    origin_airport,
    destination_airport,
    COUNT(*) as search_count,
    AVG(price_total) as avg_price,
    MIN(price_total) as min_price,
    MAX(price_total) as max_price,
    AVG(duration_minutes) as avg_duration,
    COUNT(CASE WHEN jsonb_array_length(layovers) > 0 THEN 1 END) as layover_count,
    AVG(CASE WHEN jsonb_array_length(layovers) > 0 THEN 
        (layovers->0->>'duration_minutes')::INTEGER 
        END) as avg_layover_duration,
    array_agg(DISTINCT airline_code) as airlines,
    MAX(created_at) as last_updated
FROM flights 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY origin_airport, destination_airport
HAVING COUNT(*) > 10
ORDER BY search_count DESC, avg_price ASC;

CREATE UNIQUE INDEX idx_mv_popular_layover_routes_route 
ON mv_popular_layover_routes(origin_airport, destination_airport);

-- Experience recommendations by city and category
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_experience_recommendations AS
SELECT 
    city,
    country,
    category,
    COUNT(*) as experience_count,
    AVG(rating) as avg_rating,
    AVG(price_from) as avg_price,
    MIN(price_from) as min_price,
    MAX(price_from) as max_price,
    SUM(review_count) as total_reviews,
    array_agg(
        json_build_object(
            'id', id,
            'title', title,
            'rating', rating,
            'price_from', price_from,
            'duration_minutes', duration_minutes
        ) ORDER BY rating DESC, review_count DESC
    )[1:5] as top_experiences,
    jsonb_agg(DISTINCT tags) as all_tags
FROM experiences 
WHERE rating >= 3.0 
  AND verification_status = 'verified'
GROUP BY city, country, category
HAVING COUNT(*) >= 3
ORDER BY city, avg_rating DESC;

CREATE UNIQUE INDEX idx_mv_experience_recommendations_city_category 
ON mv_experience_recommendations(city, category);

-- Enterprise usage analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_enterprise_usage_analytics AS
SELECT 
    e.id as enterprise_id,
    e.name as enterprise_name,
    e.subscription_plan,
    DATE(aul.timestamp) as usage_date,
    COUNT(*) as api_requests,
    COUNT(DISTINCT aul.user_id) as active_users,
    AVG(aul.response_time_ms) as avg_response_time,
    COUNT(CASE WHEN aul.response_status >= 400 THEN 1 END) as error_count,
    SUM(aul.operation_cost) as total_cost,
    SUM(aul.request_size_bytes + aul.response_size_bytes) as total_bandwidth
FROM enterprises e
JOIN api_usage_logs aul ON e.id = aul.enterprise_id
WHERE aul.timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY e.id, e.name, e.subscription_plan, DATE(aul.timestamp)
ORDER BY usage_date DESC, api_requests DESC;

CREATE UNIQUE INDEX idx_mv_enterprise_usage_analytics_enterprise_date 
ON mv_enterprise_usage_analytics(enterprise_id, usage_date);

-- Airport layover opportunities
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_airport_layover_opportunities AS
WITH airport_layovers AS (
    SELECT 
        jsonb_array_elements(layovers)->>'airport_code' as airport_code,
        (jsonb_array_elements(layovers)->>'duration_minutes')::INTEGER as layover_duration,
        origin_airport,
        destination_airport,
        price_total,
        departure_datetime::date as travel_date
    FROM flights 
    WHERE jsonb_array_length(layovers) > 0
      AND expires_at > NOW()
),
experience_counts AS (
    SELECT 
        city,
        COUNT(*) as total_experiences,
        AVG(rating) as avg_rating,
        COUNT(CASE WHEN duration_minutes <= 180 THEN 1 END) as short_experiences,
        COUNT(CASE WHEN indoor_outdoor = 'indoor' THEN 1 END) as indoor_experiences
    FROM experiences 
    WHERE rating >= 3.5
    GROUP BY city
)
SELECT 
    al.airport_code,
    ap.city,
    ap.country,
    COUNT(*) as layover_flight_count,
    AVG(al.layover_duration) as avg_layover_duration,
    MIN(al.layover_duration) as min_layover_duration,
    MAX(al.layover_duration) as max_layover_duration,
    COUNT(CASE WHEN al.layover_duration >= 240 THEN 1 END) as long_layover_count,
    AVG(al.price_total) as avg_flight_price,
    ec.total_experiences,
    ec.avg_rating as avg_experience_rating,
    ec.short_experiences,
    ec.indoor_experiences,
    CASE 
        WHEN ec.total_experiences >= 20 AND ec.avg_rating >= 4.0 THEN 'excellent'
        WHEN ec.total_experiences >= 10 AND ec.avg_rating >= 3.5 THEN 'good'
        WHEN ec.total_experiences >= 5 THEN 'moderate'
        ELSE 'limited'
    END as opportunity_level
FROM airport_layovers al
JOIN airports ap ON al.airport_code = ap.iata_code
LEFT JOIN experience_counts ec ON ap.city = ec.city
GROUP BY al.airport_code, ap.city, ap.country, ec.total_experiences, 
         ec.avg_rating, ec.short_experiences, ec.indoor_experiences
HAVING COUNT(*) >= 10
ORDER BY layover_flight_count DESC, ec.total_experiences DESC NULLS LAST;

CREATE UNIQUE INDEX idx_mv_airport_layover_opportunities_airport 
ON mv_airport_layover_opportunities(airport_code);

-- =====================================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- =====================================================

-- Composite indexes for complex queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flights_enterprise_route_date 
ON flights(enterprise_id, origin_airport, destination_airport, departure_datetime)
WHERE expires_at > NOW();

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flights_price_range_date 
ON flights(price_total, departure_datetime)
WHERE expires_at > NOW() AND price_total BETWEEN 100 AND 2000;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_experiences_city_category_rating 
ON experiences(city, category, rating DESC, price_from)
WHERE verification_status = 'verified';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_layover_cache_airport_duration 
ON layover_analyses_cache(airport_code, layover_duration, opportunity_score DESC)
WHERE expires_at > NOW();

-- Partial indexes for specific use cases
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flights_direct_flights 
ON flights(origin_airport, destination_airport, departure_datetime, price_total)
WHERE is_direct_flight = TRUE AND expires_at > NOW();

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flights_layover_flights 
ON flights(origin_airport, destination_airport, departure_datetime, price_total)
WHERE stops_count > 0 AND expires_at > NOW();

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_experiences_quick_activities 
ON experiences(city, duration_minutes, rating DESC)
WHERE duration_minutes <= 240 AND rating >= 4.0;

-- GIN indexes for JSONB queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flights_amenities_gin 
ON flights USING gin(amenities);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_experiences_tags_trgm 
ON experiences USING gin(title gin_trgm_ops);

-- =====================================================
-- QUERY OPTIMIZATION FUNCTIONS
-- =====================================================

-- Function to optimize flight search queries
CREATE OR REPLACE FUNCTION optimize_flight_search(
    p_origin VARCHAR(3),
    p_destination VARCHAR(3),
    p_departure_date DATE,
    p_max_price DECIMAL DEFAULT NULL,
    p_max_stops INTEGER DEFAULT NULL,
    p_enterprise_id UUID DEFAULT NULL
)
RETURNS TABLE (
    flight_id UUID,
    airline_code VARCHAR(3),
    flight_number VARCHAR(10),
    departure_datetime TIMESTAMPTZ,
    arrival_datetime TIMESTAMPTZ,
    duration_minutes INTEGER,
    price_total DECIMAL(10,2),
    stops_count INTEGER,
    layover_opportunities JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH eligible_flights AS (
        SELECT 
            f.id,
            f.airline_code,
            f.flight_number,
            f.departure_datetime,
            f.arrival_datetime,
            f.duration_minutes,
            f.price_total,
            f.stops_count,
            f.layovers
        FROM flights f
        WHERE f.origin_airport = p_origin
          AND f.destination_airport = p_destination
          AND f.departure_datetime::date = p_departure_date
          AND f.expires_at > NOW()
          AND (p_max_price IS NULL OR f.price_total <= p_max_price)
          AND (p_max_stops IS NULL OR f.stops_count <= p_max_stops)
          AND (p_enterprise_id IS NULL OR f.enterprise_id = p_enterprise_id OR f.access_level = 'public')
    ),
    layover_analysis AS (
        SELECT 
            ef.id,
            CASE 
                WHEN ef.stops_count > 0 THEN
                    jsonb_agg(
                        jsonb_build_object(
                            'airport_code', layover->>'airport_code',
                            'duration_minutes', (layover->>'duration_minutes')::INTEGER,
                            'experience_count', COALESCE(
                                (SELECT total_experiences 
                                 FROM mv_airport_layover_opportunities 
                                 WHERE airport_code = layover->>'airport_code'), 0
                            )
                        )
                    )
                ELSE '[]'::jsonb
            END as layover_opportunities
        FROM eligible_flights ef
        LEFT JOIN LATERAL jsonb_array_elements(ef.layovers) as layover ON true
        GROUP BY ef.id, ef.stops_count
    )
    SELECT 
        ef.id,
        ef.airline_code,
        ef.flight_number,
        ef.departure_datetime,
        ef.arrival_datetime,
        ef.duration_minutes,
        ef.price_total,
        ef.stops_count,
        COALESCE(la.layover_opportunities, '[]'::jsonb)
    FROM eligible_flights ef
    LEFT JOIN layover_analysis la ON ef.id = la.id
    ORDER BY ef.price_total ASC, ef.duration_minutes ASC;
END;
$$;

-- Function for intelligent experience recommendations
CREATE OR REPLACE FUNCTION recommend_experiences(
    p_city VARCHAR(100),
    p_duration_minutes INTEGER,
    p_arrival_time TIMESTAMPTZ,
    p_user_preferences JSONB DEFAULT '{}'::jsonb,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    experience_id UUID,
    title VARCHAR(500),
    category VARCHAR(100),
    duration_minutes INTEGER,
    price_from DECIMAL(10,2),
    rating DECIMAL(3,2),
    match_score DECIMAL(3,2)
)
LANGUAGE plpgsql
AS $$
DECLARE
    arrival_hour INTEGER := EXTRACT(hour FROM p_arrival_time);
    preferred_categories TEXT[] := ARRAY(SELECT jsonb_array_elements_text(p_user_preferences->'preferred_categories'));
    budget_max DECIMAL := (p_user_preferences->>'max_budget')::DECIMAL;
BEGIN
    RETURN QUERY
    WITH experience_scores AS (
        SELECT 
            e.id,
            e.title,
            e.category,
            e.duration_minutes,
            e.price_from,
            e.rating,
            (
                -- Base score from rating and popularity
                (e.rating / 5.0) * 0.3 +
                (LEAST(e.review_count, 1000) / 1000.0) * 0.2 +
                
                -- Duration compatibility
                CASE 
                    WHEN e.duration_minutes <= p_duration_minutes * 0.8 THEN 0.3
                    WHEN e.duration_minutes <= p_duration_minutes THEN 0.2
                    ELSE 0.0
                END +
                
                -- Time of day compatibility
                CASE 
                    WHEN arrival_hour BETWEEN 9 AND 17 THEN 0.1
                    WHEN arrival_hour BETWEEN 18 AND 22 AND e.category = 'dining' THEN 0.1
                    ELSE 0.05
                END +
                
                -- Category preference match
                CASE 
                    WHEN preferred_categories IS NOT NULL AND e.category = ANY(preferred_categories) THEN 0.1
                    ELSE 0.0
                END
            ) as match_score
        FROM experiences e
        WHERE e.city = p_city
          AND e.verification_status = 'verified'
          AND e.rating >= 3.0
          AND (budget_max IS NULL OR e.price_from <= budget_max)
          AND (
            e.duration_minutes <= p_duration_minutes OR
            e.duration_minutes IS NULL
          )
    )
    SELECT 
        es.id,
        es.title,
        es.category,
        es.duration_minutes,
        es.price_from,
        es.rating,
        es.match_score
    FROM experience_scores es
    WHERE es.match_score > 0.3
    ORDER BY es.match_score DESC, es.rating DESC
    LIMIT p_limit;
END;
$$;

-- =====================================================
-- AUTOMATIC MAINTENANCE JOBS
-- =====================================================

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    view_count INTEGER := 0;
BEGIN
    -- Refresh views concurrently to minimize blocking
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_popular_layover_routes;
    view_count := view_count + 1;
    
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_experience_recommendations;
    view_count := view_count + 1;
    
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_enterprise_usage_analytics;
    view_count := view_count + 1;
    
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_airport_layover_opportunities;
    view_count := view_count + 1;
    
    -- Log the refresh
    INSERT INTO performance_metrics (metric_name, value, tags)
    VALUES ('materialized_views_refreshed', view_count, '{"job": "maintenance"}'::jsonb);
    
    RETURN view_count;
END;
$$;

-- Function for automatic partition maintenance
CREATE OR REPLACE FUNCTION maintain_partitions()
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    result JSONB := '{}'::jsonb;
    created_count INTEGER;
    dropped_count INTEGER;
BEGIN
    -- Create future partitions for flights
    SELECT create_time_partitions('flights', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days') 
    INTO created_count;
    result := result || jsonb_build_object('flights_partitions_created', created_count);
    
    -- Create future partitions for analytics_events
    SELECT create_time_partitions('analytics_events', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days') 
    INTO created_count;
    result := result || jsonb_build_object('analytics_partitions_created', created_count);
    
    -- Create future partitions for api_usage_logs
    SELECT create_time_partitions('api_usage_logs', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days') 
    INTO created_count;
    result := result || jsonb_build_object('api_usage_partitions_created', created_count);
    
    -- Drop old partitions
    SELECT drop_old_partitions('flights', 7) INTO dropped_count;
    result := result || jsonb_build_object('flights_partitions_dropped', dropped_count);
    
    SELECT drop_old_partitions('analytics_events', 90) INTO dropped_count;
    result := result || jsonb_build_object('analytics_partitions_dropped', dropped_count);
    
    SELECT drop_old_partitions('api_usage_logs', 365) INTO dropped_count;
    result := result || jsonb_build_object('api_usage_partitions_dropped', dropped_count);
    
    -- Log the maintenance
    INSERT INTO performance_metrics (metric_name, value, tags)
    VALUES ('partition_maintenance_completed', 1, result);
    
    RETURN result;
END;
$$;

-- =====================================================
-- PERFORMANCE MONITORING
-- =====================================================

-- Function to collect performance statistics
CREATE OR REPLACE FUNCTION collect_performance_stats()
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    stats JSONB := '{}'::jsonb;
    temp_value NUMERIC;
BEGIN
    -- Database size
    SELECT pg_database_size(current_database()) INTO temp_value;
    stats := stats || jsonb_build_object('database_size_bytes', temp_value);
    
    -- Active connections
    SELECT count(*) FROM pg_stat_activity WHERE state = 'active' INTO temp_value;
    stats := stats || jsonb_build_object('active_connections', temp_value);
    
    -- Cache hit ratio
    SELECT round(100 * sum(blks_hit) / (sum(blks_hit) + sum(blks_read)), 2)
    FROM pg_stat_database WHERE datname = current_database() INTO temp_value;
    stats := stats || jsonb_build_object('cache_hit_ratio', temp_value);
    
    -- Slow queries (over 1 second)
    SELECT count(*) FROM pg_stat_statements WHERE mean_exec_time > 1000 INTO temp_value;
    stats := stats || jsonb_build_object('slow_queries_count', temp_value);
    
    -- Table sizes
    stats := stats || jsonb_build_object('table_sizes', (
        SELECT jsonb_object_agg(tablename, pg_total_relation_size(schemaname||'.'||tablename))
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('flights', 'experiences', 'analytics_events', 'api_usage_logs')
    ));
    
    -- Insert metrics
    INSERT INTO performance_metrics (metric_name, value, tags)
    SELECT 
        key as metric_name,
        value::text::numeric as value,
        jsonb_build_object('collection_type', 'automated') as tags
    FROM jsonb_each_text(stats)
    WHERE value::text ~ '^[0-9]+\.?[0-9]*$';
    
    RETURN stats;
END;
$$;

-- Comments for documentation
COMMENT ON FUNCTION create_time_partitions IS 'Automatically creates time-based partitions for high-volume tables';
COMMENT ON FUNCTION refresh_materialized_views IS 'Refreshes all materialized views for optimal query performance';
COMMENT ON FUNCTION optimize_flight_search IS 'Optimized flight search with layover opportunity analysis';
COMMENT ON FUNCTION recommend_experiences IS 'Intelligent experience recommendations based on context and preferences';
COMMENT ON MATERIALIZED VIEW mv_popular_layover_routes IS 'Popular flight routes with layover statistics for quick access';
COMMENT ON MATERIALIZED VIEW mv_experience_recommendations IS 'Pre-computed experience recommendations by city and category';
COMMENT ON MATERIALIZED VIEW mv_enterprise_usage_analytics IS 'Enterprise API usage analytics for billing and monitoring';
COMMENT ON MATERIALIZED VIEW mv_airport_layover_opportunities IS 'Airport-specific layover opportunities with experience data';