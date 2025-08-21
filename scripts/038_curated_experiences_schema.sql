-- Curated Experiences Schema for AI Search Engine
-- This stores local experiences and attractions curated by our team

-- Create curated_experiences table
CREATE TABLE IF NOT EXISTS curated_experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    
    -- Location details
    location_name VARCHAR(255),
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    district VARCHAR(100),
    transport_time INTEGER DEFAULT 30, -- minutes from airport
    
    -- Experience details
    price DECIMAL(10, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    duration_min DECIMAL(4, 2) DEFAULT 1, -- hours
    duration_max DECIMAL(4, 2) DEFAULT 3,
    duration_recommended DECIMAL(4, 2) DEFAULT 2,
    
    -- Attributes
    tags TEXT[], -- Array of tags for filtering
    highlights TEXT[], -- Key highlights
    requirements TEXT[], -- What visitors need to know
    best_time VARCHAR(100), -- Best time to visit
    accessibility_friendly BOOLEAN DEFAULT false,
    instant_booking BOOLEAN DEFAULT true,
    
    -- AI scoring factors
    popularity_score DECIMAL(3, 2) DEFAULT 0.5,
    quality_score DECIMAL(3, 2) DEFAULT 0.5,
    uniqueness_score DECIMAL(3, 2) DEFAULT 0.5,
    
    -- Operating information
    operating_hours JSONB, -- Store complex schedule data
    seasonal_availability JSONB, -- Seasonal constraints
    booking_info JSONB, -- Booking requirements and links
    
    -- Content
    images TEXT[], -- Array of image URLs
    video_url VARCHAR(500),
    external_links JSONB, -- Website, social media, etc.
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
    
    -- Search optimization
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', title || ' ' || description || ' ' || array_to_string(tags, ' '))
    ) STORED
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_curated_experiences_city ON curated_experiences(city);
CREATE INDEX IF NOT EXISTS idx_curated_experiences_category ON curated_experiences(category);
CREATE INDEX IF NOT EXISTS idx_curated_experiences_price ON curated_experiences(price);
CREATE INDEX IF NOT EXISTS idx_curated_experiences_duration ON curated_experiences(duration_recommended);
CREATE INDEX IF NOT EXISTS idx_curated_experiences_location ON curated_experiences USING GIST(
    ll_to_earth(latitude, longitude)
);
CREATE INDEX IF NOT EXISTS idx_curated_experiences_search ON curated_experiences USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_curated_experiences_tags ON curated_experiences USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_curated_experiences_status ON curated_experiences(status) WHERE status = 'active';

-- Create search categories table
CREATE TABLE IF NOT EXISTS experience_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50), -- Icon name/code
    color VARCHAR(7), -- Hex color code
    parent_category_id UUID REFERENCES experience_categories(id),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create AI search preferences table
CREATE TABLE IF NOT EXISTS ai_search_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    
    -- Learned preferences from search behavior
    preferred_categories TEXT[],
    preferred_price_range JSONB, -- {min: number, max: number}
    preferred_duration JSONB, -- {min: number, max: number}
    preferred_activity_level VARCHAR(20),
    preferred_travel_style VARCHAR(20),
    preferred_mood VARCHAR(20),
    
    -- Behavioral data
    search_history JSONB[], -- Array of recent searches
    booking_history JSONB[], -- Array of booked experiences
    ratings_given JSONB[], -- User ratings for experiences
    
    -- Personalization scores
    adventure_score DECIMAL(3, 2) DEFAULT 0.5,
    culture_score DECIMAL(3, 2) DEFAULT 0.5,
    food_score DECIMAL(3, 2) DEFAULT 0.5,
    nature_score DECIMAL(3, 2) DEFAULT 0.5,
    relaxation_score DECIMAL(3, 2) DEFAULT 0.5,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Create AI search analytics table
CREATE TABLE IF NOT EXISTS ai_search_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    session_id VARCHAR(100),
    
    -- Search query details
    search_query TEXT NOT NULL,
    search_location VARCHAR(100) NOT NULL,
    filters_applied JSONB,
    
    -- Results and performance
    results_count INTEGER,
    search_time_ms INTEGER,
    ai_insights JSONB,
    
    -- User interactions
    results_clicked INTEGER[] DEFAULT '{}', -- Array of result indexes clicked
    experiences_bookmarked UUID[] DEFAULT '{}', -- Array of experience IDs bookmarked
    experiences_booked UUID[] DEFAULT '{}', -- Array of experience IDs booked
    
    -- Context
    layover_duration INTEGER, -- hours
    available_time INTEGER, -- hours
    device_type VARCHAR(20),
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO experience_categories (name, description, icon, color, sort_order) VALUES
('Culture & History', 'Museums, historical sites, cultural attractions', 'museum', '#8B5CF6', 1),
('Food & Drink', 'Restaurants, food tours, culinary experiences', 'utensils', '#F59E0B', 2),
('Adventure & Sports', 'Active experiences, sports, outdoor adventures', 'zap', '#EF4444', 3),
('Nature & Parks', 'Gardens, parks, natural attractions', 'tree-pine', '#10B981', 4),
('Entertainment', 'Shows, performances, nightlife', 'music', '#EC4899', 5),
('Shopping', 'Markets, malls, unique shopping experiences', 'shopping-bag', '#6366F1', 6),
('Relaxation & Wellness', 'Spas, wellness centers, peaceful experiences', 'heart', '#06B6D4', 7),
('Transportation & Tours', 'City tours, transportation experiences', 'bus', '#84CC16', 8),
('Local Experiences', 'Authentic local activities and hidden gems', 'map-pin', '#F97316', 9),
('Family Friendly', 'Activities suitable for families with children', 'users', '#14B8A6', 10)
ON CONFLICT (name) DO NOTHING;

-- Sample curated experiences data
INSERT INTO curated_experiences (
    title, description, category, city, country,
    location_name, address, latitude, longitude, district,
    price, duration_recommended, tags, highlights,
    accessibility_friendly, operating_hours
) VALUES
(
    'Louvre Museum Express Tour',
    'Skip-the-line access to the world''s most famous museum with highlights tour',
    'Culture & History',
    'Paris',
    'France',
    'Louvre Museum',
    'Rue de Rivoli, 75001 Paris',
    48.8606,
    2.3376,
    '1st Arrondissement',
    25.00,
    2.5,
    ARRAY['museum', 'art', 'culture', 'skip-line', 'guided'],
    ARRAY['Mona Lisa viewing', 'Venus de Milo', 'Egyptian antiquities', 'Skip-the-line access'],
    true,
    '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"closed": true}, "wednesday": {"open": "09:00", "close": "21:45"}}'::jsonb
),
(
    'Central Park Horse Carriage Ride',
    'Romantic horse-drawn carriage tour through Central Park''s scenic routes',
    'Nature & Parks',
    'New York',
    'USA',
    'Central Park',
    'Central Park South, New York, NY 10019',
    40.7829,
    -73.9654,
    'Midtown Manhattan',
    60.00,
    1.0,
    ARRAY['nature', 'romantic', 'carriage', 'park', 'scenic'],
    ARRAY['Bethesda Fountain', 'Bow Bridge', 'Strawberry Fields', 'Professional driver'],
    false,
    '{"daily": {"open": "09:00", "close": "17:00"}}'::jsonb
),
(
    'Tsukiji Outer Market Food Tour',
    'Authentic sushi and street food experience at Tokyo''s famous market',
    'Food & Drink',
    'Tokyo',
    'Japan',
    'Tsukiji Outer Market',
    'Tsukiji, Chuo City, Tokyo 104-0045',
    35.6657,
    139.7707,
    'Chuo',
    45.00,
    3.0,
    ARRAY['food', 'sushi', 'market', 'authentic', 'guided'],
    ARRAY['Fresh sushi tasting', 'Tamagoyaki demonstration', 'Green tea ceremony', 'Local guide'],
    true,
    '{"daily": {"open": "05:00", "close": "14:00"}}'::jsonb
),
(
    'Sydney Harbour Bridge Climb',
    'Climb the iconic Sydney Harbour Bridge for spectacular city views',
    'Adventure & Sports',
    'Sydney',
    'Australia',
    'Sydney Harbour Bridge',
    'Sydney Harbour Bridge, Sydney NSW',
    -33.8523,
    151.2108,
    'Sydney CBD',
    250.00,
    3.5,
    ARRAY['adventure', 'climbing', 'views', 'iconic', 'city'],
    ARRAY['360-degree city views', 'Professional guide', 'Safety equipment included', 'Certificate of completion'],
    false,
    '{"daily": {"open": "08:00", "close": "17:00"}}'::jsonb
);

-- Enable Row Level Security
ALTER TABLE curated_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_search_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_search_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view active experiences" ON curated_experiences
    FOR SELECT USING (status = 'active');

CREATE POLICY "Public can view categories" ON experience_categories
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their search preferences" ON ai_search_preferences
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their search analytics" ON ai_search_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their search analytics" ON ai_search_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_curated_experiences_updated_at 
    BEFORE UPDATE ON curated_experiences
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_search_preferences_updated_at 
    BEFORE UPDATE ON ai_search_preferences
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create search function for better performance
CREATE OR REPLACE FUNCTION search_curated_experiences(
    p_query TEXT,
    p_city TEXT DEFAULT NULL,
    p_category TEXT DEFAULT NULL,
    p_min_price DECIMAL DEFAULT NULL,
    p_max_price DECIMAL DEFAULT NULL,
    p_min_duration DECIMAL DEFAULT NULL,
    p_max_duration DECIMAL DEFAULT NULL,
    p_tags TEXT[] DEFAULT NULL,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    description TEXT,
    category VARCHAR(100),
    price DECIMAL(10, 2),
    duration_recommended DECIMAL(4, 2),
    popularity_score DECIMAL(3, 2),
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ce.id,
        ce.title,
        ce.description,
        ce.category,
        ce.price,
        ce.duration_recommended,
        ce.popularity_score,
        ts_rank(ce.search_vector, plainto_tsquery('english', p_query)) as rank
    FROM curated_experiences ce
    WHERE 
        ce.status = 'active'
        AND (p_city IS NULL OR ce.city ILIKE '%' || p_city || '%')
        AND (p_category IS NULL OR ce.category = p_category)
        AND (p_min_price IS NULL OR ce.price >= p_min_price)
        AND (p_max_price IS NULL OR ce.price <= p_max_price)
        AND (p_min_duration IS NULL OR ce.duration_recommended >= p_min_duration)
        AND (p_max_duration IS NULL OR ce.duration_recommended <= p_max_duration)
        AND (p_tags IS NULL OR ce.tags && p_tags)
        AND (p_query = '' OR ce.search_vector @@ plainto_tsquery('english', p_query))
    ORDER BY rank DESC, ce.popularity_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;