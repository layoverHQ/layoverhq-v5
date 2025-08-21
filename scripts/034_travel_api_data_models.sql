-- =====================================================
-- LayoverHQ Travel API Data Models
-- =====================================================
-- Comprehensive data models for Viator, Amadeus, Duffel, Kiwi, and other travel APIs
-- Designed for high-performance aggregation and intelligent caching

-- =====================================================
-- PROVIDER CONFIGURATION AND CREDENTIALS
-- =====================================================

-- API provider configurations
CREATE TABLE IF NOT EXISTS api_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Provider identification
    name VARCHAR(100) UNIQUE NOT NULL,
    provider_type VARCHAR(50) NOT NULL, -- 'flights', 'experiences', 'hotels', 'transportation'
    api_version VARCHAR(20),
    
    -- Endpoint configuration
    base_url TEXT NOT NULL,
    auth_type VARCHAR(50) NOT NULL, -- 'api_key', 'oauth2', 'bearer'
    rate_limit_per_second INTEGER DEFAULT 10,
    rate_limit_per_minute INTEGER DEFAULT 100,
    rate_limit_per_hour INTEGER DEFAULT 1000,
    
    -- Data quality and reliability
    reliability_score DECIMAL(3,2) DEFAULT 1.0,
    average_response_time_ms INTEGER DEFAULT 1000,
    uptime_percentage DECIMAL(5,2) DEFAULT 99.9,
    data_freshness_minutes INTEGER DEFAULT 30,
    
    -- Business terms
    cost_per_request DECIMAL(6,4) DEFAULT 0.0001,
    monthly_quota INTEGER,
    priority_level INTEGER DEFAULT 5, -- 1-10, higher is better
    
    -- Technical configuration
    timeout_seconds INTEGER DEFAULT 30,
    retry_attempts INTEGER DEFAULT 3,
    backoff_strategy VARCHAR(20) DEFAULT 'exponential',
    
    -- Status and monitoring
    is_active BOOLEAN DEFAULT TRUE,
    last_health_check TIMESTAMPTZ DEFAULT NOW(),
    health_status VARCHAR(20) DEFAULT 'unknown',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert provider configurations
INSERT INTO api_providers (name, provider_type, base_url, auth_type, rate_limit_per_second, monthly_quota, priority_level) VALUES
    ('amadeus', 'flights', 'https://api.amadeus.com', 'oauth2', 5, 50000, 9),
    ('duffel', 'flights', 'https://api.duffel.com', 'bearer', 10, 100000, 8),
    ('kiwi', 'flights', 'https://api.skypicker.com', 'api_key', 20, 200000, 7),
    ('viator', 'experiences', 'https://api.viator.com', 'api_key', 8, 75000, 9),
    ('openweathermap', 'weather', 'https://api.openweathermap.org', 'api_key', 60, 1000000, 6)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- AMADEUS FLIGHT DATA MODELS
-- =====================================================

-- Amadeus flight search responses
CREATE TABLE IF NOT EXISTS amadeus_flights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Search context
    search_id VARCHAR(255),
    search_hash VARCHAR(64),
    
    -- Flight identification
    amadeus_flight_id VARCHAR(255) NOT NULL,
    validating_airline_codes TEXT[],
    
    -- Route information
    origin_location_code VARCHAR(3) NOT NULL,
    destination_location_code VARCHAR(3) NOT NULL,
    departure_date DATE NOT NULL,
    return_date DATE,
    
    -- Passenger and cabin
    passenger_count INTEGER DEFAULT 1,
    cabin_class VARCHAR(20) DEFAULT 'ECONOMY',
    travel_class VARCHAR(20),
    
    -- Itinerary details
    segments JSONB NOT NULL DEFAULT '[]',
    duration_total VARCHAR(20),
    
    -- Pricing (in original currency)
    total_price DECIMAL(10,2) NOT NULL,
    base_price DECIMAL(10,2),
    currency VARCHAR(3) NOT NULL,
    price_breakdown JSONB DEFAULT '{}',
    
    -- Fees and taxes
    taxes JSONB DEFAULT '[]',
    fees JSONB DEFAULT '[]',
    
    -- Fare details
    fare_basis JSONB DEFAULT '{}',
    fare_type VARCHAR(50),
    fare_category VARCHAR(50),
    
    -- Booking information
    booking_requirements JSONB DEFAULT '{}',
    payment_card_required BOOLEAN DEFAULT FALSE,
    instant_booking_available BOOLEAN DEFAULT FALSE,
    
    -- Traveler pricing breakdown
    traveler_pricings JSONB DEFAULT '[]',
    
    -- Additional services
    included_checked_bags JSONB DEFAULT '{}',
    additional_services JSONB DEFAULT '[]',
    
    -- Data quality
    one_way BOOLEAN DEFAULT TRUE,
    data_source VARCHAR(50) DEFAULT 'amadeus',
    raw_response JSONB,
    
    -- Cache management
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for amadeus_flights
CREATE INDEX idx_amadeus_flights_search_hash ON amadeus_flights(search_hash) WHERE expires_at > NOW();
CREATE INDEX idx_amadeus_flights_route_date ON amadeus_flights(origin_location_code, destination_location_code, departure_date);
CREATE INDEX idx_amadeus_flights_price ON amadeus_flights(total_price) WHERE expires_at > NOW();
CREATE INDEX idx_amadeus_flights_expires_at ON amadeus_flights(expires_at);

-- =====================================================
-- DUFFEL FLIGHT DATA MODELS
-- =====================================================

-- Duffel flight offers
CREATE TABLE IF NOT EXISTS duffel_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Duffel identification
    duffel_offer_id VARCHAR(255) UNIQUE NOT NULL,
    duffel_owner_id VARCHAR(255),
    
    -- Search context
    search_id VARCHAR(255),
    cabin_class VARCHAR(20),
    
    -- Route and timing
    origin VARCHAR(3) NOT NULL,
    destination VARCHAR(3) NOT NULL,
    departure_date DATE NOT NULL,
    return_date DATE,
    
    -- Passenger configuration
    passenger_count INTEGER DEFAULT 1,
    passenger_types JSONB DEFAULT '{}',
    
    -- Pricing
    total_amount DECIMAL(10,2) NOT NULL,
    total_currency VARCHAR(3) NOT NULL,
    tax_amount DECIMAL(10,2),
    
    -- Airline and booking
    owner_airline_iata VARCHAR(3),
    owner_airline_name VARCHAR(255),
    marketing_airline_iata VARCHAR(3),
    
    -- Flight segments
    segments JSONB NOT NULL DEFAULT '[]',
    
    -- Booking conditions
    refundable BOOLEAN DEFAULT FALSE,
    changeable BOOLEAN DEFAULT FALSE,
    partial_refund_allowed BOOLEAN DEFAULT FALSE,
    
    -- Baggage allowances
    baggage_allowances JSONB DEFAULT '[]',
    
    -- Fare conditions
    fare_brand VARCHAR(100),
    fare_basis_code VARCHAR(20),
    conditions JSONB DEFAULT '{}',
    
    -- Payment requirements
    payment_requirements JSONB DEFAULT '{}',
    
    -- Additional data
    booking_reference VARCHAR(50),
    raw_response JSONB,
    
    -- Status and expiry
    available BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for duffel_offers
CREATE INDEX idx_duffel_offers_id ON duffel_offers(duffel_offer_id);
CREATE INDEX idx_duffel_offers_route_date ON duffel_offers(origin, destination, departure_date);
CREATE INDEX idx_duffel_offers_price ON duffel_offers(total_amount) WHERE available = TRUE;
CREATE INDEX idx_duffel_offers_airline ON duffel_offers(owner_airline_iata);
CREATE INDEX idx_duffel_offers_expires_at ON duffel_offers(expires_at);

-- =====================================================
-- KIWI (SKYPICKER) FLIGHT DATA MODELS
-- =====================================================

-- Kiwi flight search results
CREATE TABLE IF NOT EXISTS kiwi_flights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Kiwi identification
    kiwi_booking_token TEXT UNIQUE,
    kiwi_flight_id VARCHAR(255),
    
    -- Search context
    search_id VARCHAR(255),
    search_timestamp TIMESTAMPTZ,
    
    -- Route information
    flyFrom VARCHAR(3) NOT NULL,
    flyTo VARCHAR(3) NOT NULL,
    cityFrom VARCHAR(100),
    cityTo VARCHAR(100),
    countryFrom JSONB,
    countryTo JSONB,
    
    -- Timing
    dTime TIMESTAMPTZ NOT NULL, -- departure time
    aTime TIMESTAMPTZ NOT NULL, -- arrival time
    local_departure VARCHAR(25),
    local_arrival VARCHAR(25),
    utc_departure VARCHAR(25),
    utc_arrival VARCHAR(25),
    
    -- Flight details
    airlines TEXT[], -- array of airline codes
    flight_no INTEGER,
    distance DECIMAL(8,2), -- in km
    duration JSONB, -- departure, return, total
    
    -- Pricing
    price DECIMAL(10,2) NOT NULL,
    conversion JSONB, -- currency conversion rates
    
    -- Route details
    route JSONB NOT NULL DEFAULT '[]', -- detailed route segments
    technical_stops INTEGER DEFAULT 0,
    throw_away_ticketing BOOLEAN DEFAULT FALSE,
    hidden_city_ticketing BOOLEAN DEFAULT FALSE,
    
    -- Booking information
    deep_link TEXT,
    booking_url TEXT,
    booking_fee DECIMAL(8,2),
    
    -- Availability and restrictions
    availability JSONB DEFAULT '{}',
    has_airport_change BOOLEAN DEFAULT FALSE,
    technical_stops_info JSONB DEFAULT '[]',
    
    -- Quality and reliability
    quality DECIMAL(3,2),
    pnr_count INTEGER DEFAULT 1,
    virtual_interlining BOOLEAN DEFAULT FALSE,
    
    -- Baggage information
    baglimit JSONB DEFAULT '{}',
    bags_price JSONB DEFAULT '{}',
    
    -- Additional data
    facilitated_booking_available BOOLEAN DEFAULT FALSE,
    raw_response JSONB,
    
    -- Data management
    data_age_hours INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for kiwi_flights
CREATE INDEX idx_kiwi_flights_booking_token ON kiwi_flights(kiwi_booking_token);
CREATE INDEX idx_kiwi_flights_route_time ON kiwi_flights(flyFrom, flyTo, dTime);
CREATE INDEX idx_kiwi_flights_price ON kiwi_flights(price) WHERE expires_at > NOW();
CREATE INDEX idx_kiwi_flights_quality ON kiwi_flights(quality DESC);
CREATE INDEX idx_kiwi_flights_duration_gin ON kiwi_flights USING gin(duration);

-- =====================================================
-- VIATOR EXPERIENCES DATA MODELS
-- =====================================================

-- Viator product catalog
CREATE TABLE IF NOT EXISTS viator_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Viator identification
    product_code VARCHAR(50) UNIQUE NOT NULL,
    product_title VARCHAR(500) NOT NULL,
    product_url TEXT,
    
    -- Location information
    destination_id INTEGER,
    destination_name VARCHAR(255),
    country_code VARCHAR(2),
    country_name VARCHAR(255),
    city VARCHAR(255),
    
    -- Category and classification
    cat_id INTEGER, -- main category ID
    sub_cat_id INTEGER, -- subcategory ID
    category_name VARCHAR(255),
    subcategory_name VARCHAR(255),
    product_tags JSONB DEFAULT '[]',
    
    -- Description and content
    description TEXT,
    highlights JSONB DEFAULT '[]',
    inclusions JSONB DEFAULT '[]',
    exclusions JSONB DEFAULT '[]',
    additional_info JSONB DEFAULT '[]',
    
    -- Pricing information
    price DECIMAL(10,2),
    price_formatted VARCHAR(50),
    original_price DECIMAL(10,2),
    currency_code VARCHAR(3) DEFAULT 'USD',
    merchant_netprice DECIMAL(10,2),
    merchant_netprice_formatted VARCHAR(50),
    
    -- Special offers and discounts
    special_offer_available BOOLEAN DEFAULT FALSE,
    special_offer JSONB DEFAULT '{}',
    save_amount DECIMAL(10,2),
    save_percentage INTEGER,
    
    -- Duration and schedule
    duration VARCHAR(100),
    duration_minutes INTEGER,
    time_slots JSONB DEFAULT '[]',
    
    -- Ratings and reviews
    rating DECIMAL(3,2),
    total_reviews INTEGER DEFAULT 0,
    percentage_recommended INTEGER,
    
    -- Booking and availability
    booking_engine_id INTEGER,
    merchant_id INTEGER,
    primary_group_id INTEGER,
    
    -- Logistics
    departure_point VARCHAR(500),
    departure_point_address JSONB DEFAULT '{}',
    departure_point_directions TEXT,
    
    -- Supplier information
    supplier JSONB DEFAULT '{}',
    
    -- Media and imagery
    thumbnail_hires_url TEXT,
    thumbnail_url TEXT,
    image_urls JSONB DEFAULT '[]',
    
    -- Age and group restrictions
    min_age INTEGER,
    max_age INTEGER,
    max_travelers INTEGER,
    
    -- Accessibility
    wheelchair_accessible BOOLEAN DEFAULT FALSE,
    
    -- Booking requirements
    hotel_pickup BOOLEAN DEFAULT FALSE,
    language_guides JSONB DEFAULT '[]',
    
    -- Status and data quality
    is_available BOOLEAN DEFAULT TRUE,
    data_last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for viator_products
CREATE INDEX idx_viator_products_code ON viator_products(product_code);
CREATE INDEX idx_viator_products_destination ON viator_products(destination_id, city);
CREATE INDEX idx_viator_products_category ON viator_products(cat_id, sub_cat_id);
CREATE INDEX idx_viator_products_price ON viator_products(price) WHERE is_available = TRUE;
CREATE INDEX idx_viator_products_rating ON viator_products(rating DESC, total_reviews DESC);
CREATE INDEX idx_viator_products_duration ON viator_products(duration_minutes);
CREATE INDEX idx_viator_products_tags_gin ON viator_products USING gin(product_tags);

-- Viator availability and pricing
CREATE TABLE IF NOT EXISTS viator_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Product reference
    product_code VARCHAR(50) REFERENCES viator_products(product_code),
    
    -- Date and time
    available_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    
    -- Pricing for this specific date/time
    adult_price DECIMAL(10,2),
    child_price DECIMAL(10,2),
    infant_price DECIMAL(10,2),
    senior_price DECIMAL(10,2),
    
    -- Availability details
    places_available INTEGER,
    places_remaining INTEGER,
    minimum_travelers INTEGER DEFAULT 1,
    maximum_travelers INTEGER,
    
    -- Booking information
    booking_url TEXT,
    instant_confirmation BOOLEAN DEFAULT FALSE,
    cutoff_hours INTEGER DEFAULT 24,
    
    -- Special conditions
    weather_dependent BOOLEAN DEFAULT FALSE,
    seasonal_operation BOOLEAN DEFAULT FALSE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'available', -- available, limited, sold_out, cancelled
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for viator_availability
CREATE INDEX idx_viator_availability_product_date ON viator_availability(product_code, available_date);
CREATE INDEX idx_viator_availability_date_status ON viator_availability(available_date, status);
CREATE INDEX idx_viator_availability_price ON viator_availability(adult_price);

-- =====================================================
-- WEATHER DATA MODELS
-- =====================================================

-- OpenWeatherMap current and forecast data
CREATE TABLE IF NOT EXISTS weather_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Location identification
    city VARCHAR(255) NOT NULL,
    country VARCHAR(255),
    country_code VARCHAR(2),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    timezone_offset INTEGER,
    
    -- Time information
    forecast_time TIMESTAMPTZ NOT NULL,
    sunrise TIMESTAMPTZ,
    sunset TIMESTAMPTZ,
    
    -- Current weather conditions
    temperature DECIMAL(5,2), -- in Celsius
    feels_like DECIMAL(5,2),
    temperature_min DECIMAL(5,2),
    temperature_max DECIMAL(5,2),
    pressure INTEGER, -- hPa
    humidity INTEGER, -- percentage
    visibility INTEGER, -- meters
    
    -- Weather description
    weather_main VARCHAR(50), -- Rain, Snow, Clear, etc.
    weather_description VARCHAR(255),
    weather_icon VARCHAR(10),
    
    -- Wind conditions
    wind_speed DECIMAL(5,2), -- m/s
    wind_direction INTEGER, -- degrees
    wind_gust DECIMAL(5,2),
    
    -- Precipitation
    rain_1h DECIMAL(5,2), -- mm
    rain_3h DECIMAL(5,2),
    snow_1h DECIMAL(5,2),
    snow_3h DECIMAL(5,2),
    
    -- Cloud coverage
    cloudiness INTEGER, -- percentage
    
    -- UV and air quality
    uv_index DECIMAL(3,1),
    air_quality_index INTEGER,
    
    -- Data source and quality
    data_source VARCHAR(50) DEFAULT 'openweathermap',
    forecast_type VARCHAR(20), -- current, hourly, daily
    
    -- Raw data
    raw_response JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (forecast_time);

-- Create weather data partitions
CREATE TABLE weather_data_current PARTITION OF weather_data 
FOR VALUES FROM (NOW() - INTERVAL '1 day') TO (NOW() + INTERVAL '1 day');

CREATE TABLE weather_data_forecast PARTITION OF weather_data 
FOR VALUES FROM (NOW() + INTERVAL '1 day') TO (NOW() + INTERVAL '7 days');

-- Indexes for weather_data
CREATE INDEX idx_weather_data_city_time ON weather_data(city, forecast_time);
CREATE INDEX idx_weather_data_location ON weather_data(latitude, longitude, forecast_time);
CREATE INDEX idx_weather_data_forecast_time ON weather_data(forecast_time);

-- =====================================================
-- AGGREGATED CROSS-PROVIDER DATA
-- =====================================================

-- Unified flight search results aggregating all providers
CREATE TABLE IF NOT EXISTS unified_flight_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Search identification
    search_id VARCHAR(255) NOT NULL,
    search_hash VARCHAR(64) NOT NULL,
    
    -- Route information
    origin VARCHAR(3) NOT NULL,
    destination VARCHAR(3) NOT NULL,
    departure_date DATE NOT NULL,
    return_date DATE,
    
    -- Aggregated flight data
    provider_results JSONB NOT NULL DEFAULT '{}', -- Results from each provider
    best_price DECIMAL(10,2),
    best_price_provider VARCHAR(50),
    fastest_duration INTEGER, -- minutes
    fastest_provider VARCHAR(50),
    
    -- Layover opportunities
    layover_opportunities JSONB DEFAULT '[]',
    max_layover_score DECIMAL(3,2),
    
    -- Search statistics
    providers_searched TEXT[],
    providers_responded TEXT[],
    total_results_count INTEGER DEFAULT 0,
    search_duration_ms INTEGER,
    
    -- Quality metrics
    price_range JSONB DEFAULT '{}', -- min, max, avg
    duration_range JSONB DEFAULT '{}',
    reliability_scores JSONB DEFAULT '{}',
    
    -- Cache management
    expires_at TIMESTAMPTZ NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for unified_flight_results
CREATE UNIQUE INDEX idx_unified_flight_results_search_hash ON unified_flight_results(search_hash);
CREATE INDEX idx_unified_flight_results_route_date ON unified_flight_results(origin, destination, departure_date);
CREATE INDEX idx_unified_flight_results_best_price ON unified_flight_results(best_price) WHERE expires_at > NOW();
CREATE INDEX idx_unified_flight_results_expires_at ON unified_flight_results(expires_at);

-- =====================================================
-- API RESPONSE CACHE AND OPTIMIZATION
-- =====================================================

-- Generic API response cache for all providers
CREATE TABLE IF NOT EXISTS api_response_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Cache identification
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    provider_name VARCHAR(100) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    
    -- Request parameters
    request_hash VARCHAR(64) NOT NULL,
    request_params JSONB DEFAULT '{}',
    
    -- Response data
    response_data JSONB NOT NULL,
    response_headers JSONB DEFAULT '{}',
    status_code INTEGER NOT NULL,
    
    -- Performance metrics
    response_time_ms INTEGER,
    response_size_bytes INTEGER,
    
    -- Cache management
    ttl_seconds INTEGER DEFAULT 3600,
    expires_at TIMESTAMPTZ NOT NULL,
    hit_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMPTZ DEFAULT NOW(),
    
    -- Data quality
    data_quality_score DECIMAL(3,2) DEFAULT 1.0,
    validation_errors JSONB DEFAULT '[]',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY HASH (provider_name);

-- Create cache partitions for each provider
CREATE TABLE api_response_cache_amadeus PARTITION OF api_response_cache FOR VALUES WITH (modulus 8, remainder 0);
CREATE TABLE api_response_cache_duffel PARTITION OF api_response_cache FOR VALUES WITH (modulus 8, remainder 1);
CREATE TABLE api_response_cache_kiwi PARTITION OF api_response_cache FOR VALUES WITH (modulus 8, remainder 2);
CREATE TABLE api_response_cache_viator PARTITION OF api_response_cache FOR VALUES WITH (modulus 8, remainder 3);
CREATE TABLE api_response_cache_weather PARTITION OF api_response_cache FOR VALUES WITH (modulus 8, remainder 4);
CREATE TABLE api_response_cache_other1 PARTITION OF api_response_cache FOR VALUES WITH (modulus 8, remainder 5);
CREATE TABLE api_response_cache_other2 PARTITION OF api_response_cache FOR VALUES WITH (modulus 8, remainder 6);
CREATE TABLE api_response_cache_other3 PARTITION OF api_response_cache FOR VALUES WITH (modulus 8, remainder 7);

-- Indexes for api_response_cache
CREATE INDEX idx_api_response_cache_key ON api_response_cache(cache_key);
CREATE INDEX idx_api_response_cache_provider_endpoint ON api_response_cache(provider_name, endpoint);
CREATE INDEX idx_api_response_cache_expires_at ON api_response_cache(expires_at);
CREATE INDEX idx_api_response_cache_request_hash ON api_response_cache(request_hash);

-- Comments for documentation
COMMENT ON TABLE api_providers IS 'Configuration and monitoring for all travel API providers';
COMMENT ON TABLE amadeus_flights IS 'Amadeus flight search results with comprehensive fare details';
COMMENT ON TABLE duffel_offers IS 'Duffel flight offers with booking conditions and baggage allowances';
COMMENT ON TABLE kiwi_flights IS 'Kiwi (Skypicker) flight results with virtual interlining support';
COMMENT ON TABLE viator_products IS 'Viator experience products with pricing and availability';
COMMENT ON TABLE weather_data IS 'Weather forecasts and current conditions for travel planning';
COMMENT ON TABLE unified_flight_results IS 'Aggregated flight search results from all providers';
COMMENT ON TABLE api_response_cache IS 'Intelligent caching system for API responses with TTL management';