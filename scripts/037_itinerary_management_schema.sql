-- Itinerary Management System Schema
-- This schema supports complete trip planning, multi-city coordination, 
-- real-time sync, and automatic rebooking for the travel buddy feature

-- Main itineraries table
CREATE TABLE IF NOT EXISTS itineraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    total_duration INTEGER NOT NULL DEFAULT 0, -- in days
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'active', 'completed', 'cancelled')),
    trip_type VARCHAR(20) NOT NULL DEFAULT 'leisure' CHECK (trip_type IN ('business', 'leisure', 'mixed')),
    traveler_count INTEGER NOT NULL DEFAULT 1,
    
    -- Budget information (stored as JSONB for flexibility)
    budget JSONB DEFAULT '{}', -- {total, spent, currency, breakdown: {flights, accommodation, activities, transport, dining, misc}}
    
    -- Preferences (stored as JSONB for flexibility)
    preferences JSONB DEFAULT '{}', -- {notifications, rebookingPreferences}
    
    -- Emergency contacts (stored as JSONB array)
    emergency_contacts JSONB DEFAULT '[]',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT fk_itineraries_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Trip segments table - represents each part of the journey
CREATE TABLE IF NOT EXISTS trip_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_id UUID NOT NULL,
    segment_number INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('flight', 'layover', 'accommodation', 'local_activity')),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    
    -- Location information
    location JSONB NOT NULL, -- {airport?, city, country, coordinates?}
    
    -- Segment-specific booking data (JSONB for flexibility)
    booking JSONB, -- FlightBooking, AccommodationBooking, or ActivityBooking
    
    -- Layover planning data
    layover_plan JSONB, -- LayoverPlan data structure
    
    -- Additional notes and status
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled', 'delayed')),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_trip_segments_itinerary FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE,
    CONSTRAINT unique_segment_number UNIQUE (itinerary_id, segment_number)
);

-- Travel documents table
CREATE TABLE IF NOT EXISTS travel_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_id UUID NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('passport', 'visa', 'boarding_pass', 'hotel_reservation', 'insurance', 'vaccination_certificate')),
    document_number VARCHAR(255),
    issued_by VARCHAR(255),
    valid_until TIMESTAMPTZ,
    attachment_url TEXT,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_travel_documents_itinerary FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE
);

-- Travel alerts table
CREATE TABLE IF NOT EXISTS travel_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_id UUID NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('delay', 'cancellation', 'gate_change', 'weather', 'rebooking_suggestion', 'document_reminder')),
    severity VARCHAR(10) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    action_required BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    acknowledged BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_travel_alerts_itinerary FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE
);

-- Rebooking options table
CREATE TABLE IF NOT EXISTS rebooking_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_id UUID NOT NULL,
    original_segment_id UUID NOT NULL,
    reason VARCHAR(30) NOT NULL CHECK (reason IN ('cancellation', 'delay', 'missed_connection', 'schedule_change', 'user_request')),
    
    -- New flight options (stored as JSONB array)
    new_flights JSONB NOT NULL, -- Array of FlightBooking objects
    
    -- Impact analysis (stored as JSONB)
    impact_analysis JSONB NOT NULL, -- RebookingImpactAnalysis object
    
    recommendation VARCHAR(20) NOT NULL CHECK (recommendation IN ('accept', 'decline', 'manual_review')),
    confidence DECIMAL(3,2) NOT NULL DEFAULT 0.5,
    valid_until TIMESTAMPTZ NOT NULL,
    action_required BOOLEAN DEFAULT FALSE,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    executed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_rebooking_options_itinerary FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE,
    CONSTRAINT fk_rebooking_options_segment FOREIGN KEY (original_segment_id) REFERENCES trip_segments(id) ON DELETE CASCADE
);

-- Sync status table for real-time synchronization
CREATE TABLE IF NOT EXISTS itinerary_sync_status (
    itinerary_id UUID PRIMARY KEY,
    last_sync TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'synced' CHECK (status IN ('synced', 'syncing', 'error', 'outdated')),
    errors JSONB DEFAULT '[]', -- Array of error messages
    next_sync TIMESTAMPTZ,
    sync_sources JSONB DEFAULT '{}', -- {airlines: [], hotels: [], activities: [], weather: false, alerts: false}
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_sync_status_itinerary FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE
);

-- Multi-city trip plans table (for coordinating complex routes)
CREATE TABLE IF NOT EXISTS multi_city_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    cities JSONB NOT NULL, -- Array of city codes/names
    request_data JSONB NOT NULL, -- MultiCityRequest object
    generated_options JSONB NOT NULL, -- Array of MultiCityItinerary objects
    selected_option_index INTEGER,
    created_itinerary_id UUID,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    
    CONSTRAINT fk_multi_city_plans_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_multi_city_plans_itinerary FOREIGN KEY (created_itinerary_id) REFERENCES itineraries(id) ON DELETE SET NULL
);

-- User travel preferences table
CREATE TABLE IF NOT EXISTS user_travel_preferences (
    user_id UUID PRIMARY KEY,
    
    -- Notification preferences
    notifications JSONB DEFAULT '{"email": true, "sms": true, "push": true, "advanceNotice": 120}',
    
    -- Rebooking preferences
    rebooking_preferences JSONB DEFAULT '{"automaticRebooking": false, "maxPriceIncrease": 100, "preferredAirlines": [], "flexibleDates": true, "flexibleAirports": false}',
    
    -- General travel preferences
    travel_style VARCHAR(20) DEFAULT 'balanced' CHECK (travel_style IN ('budget', 'balanced', 'luxury')),
    preferred_airlines JSONB DEFAULT '[]',
    preferred_airports JSONB DEFAULT '[]',
    avoid_red_eye BOOLEAN DEFAULT TRUE,
    minimize_connections BOOLEAN DEFAULT FALSE,
    layover_preferences JSONB DEFAULT '{"minTime": 4, "maxTime": 12, "preferExploration": true}',
    
    -- Accessibility and dietary requirements
    accessibility_needs JSONB DEFAULT '[]',
    dietary_restrictions JSONB DEFAULT '[]',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_user_travel_preferences_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Travel statistics and metrics table
CREATE TABLE IF NOT EXISTS user_travel_stats (
    user_id UUID PRIMARY KEY,
    total_trips INTEGER DEFAULT 0,
    completed_trips INTEGER DEFAULT 0,
    total_distance DECIMAL(12,2) DEFAULT 0, -- in miles
    total_savings DECIMAL(10,2) DEFAULT 0,
    favorite_cities JSONB DEFAULT '[]',
    average_trip_duration DECIMAL(5,2) DEFAULT 0, -- in days
    last_trip_date TIMESTAMPTZ,
    
    -- Layover statistics
    total_layovers INTEGER DEFAULT 0,
    layover_cities_visited JSONB DEFAULT '[]',
    total_layover_time INTEGER DEFAULT 0, -- in hours
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_user_travel_stats_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Notification queue table for real-time alerts
CREATE TABLE IF NOT EXISTS notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    itinerary_id UUID,
    alert_id UUID,
    type VARCHAR(30) NOT NULL,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'sms', 'push', 'in_app')),
    
    subject VARCHAR(255),
    message TEXT NOT NULL,
    data JSONB, -- Additional data for rich notifications
    
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_notification_queue_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_notification_queue_itinerary FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE,
    CONSTRAINT fk_notification_queue_alert FOREIGN KEY (alert_id) REFERENCES travel_alerts(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_itineraries_user_id ON itineraries(user_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_status ON itineraries(status);
CREATE INDEX IF NOT EXISTS idx_itineraries_start_date ON itineraries(start_date);
CREATE INDEX IF NOT EXISTS idx_itineraries_updated_at ON itineraries(updated_at);

CREATE INDEX IF NOT EXISTS idx_trip_segments_itinerary_id ON trip_segments(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_trip_segments_type ON trip_segments(type);
CREATE INDEX IF NOT EXISTS idx_trip_segments_start_time ON trip_segments(start_time);
CREATE INDEX IF NOT EXISTS idx_trip_segments_status ON trip_segments(status);

CREATE INDEX IF NOT EXISTS idx_travel_alerts_itinerary_id ON travel_alerts(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_travel_alerts_acknowledged ON travel_alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_travel_alerts_severity ON travel_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_travel_alerts_created_at ON travel_alerts(created_at);

CREATE INDEX IF NOT EXISTS idx_rebooking_options_itinerary_id ON rebooking_options(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_rebooking_options_status ON rebooking_options(status);
CREATE INDEX IF NOT EXISTS idx_rebooking_options_valid_until ON rebooking_options(valid_until);

CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id ON notification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled_for ON notification_queue(scheduled_for);

-- Create updated_at triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_itineraries_updated_at BEFORE UPDATE ON itineraries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trip_segments_updated_at BEFORE UPDATE ON trip_segments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_travel_documents_updated_at BEFORE UPDATE ON travel_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_travel_preferences_updated_at BEFORE UPDATE ON user_travel_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_travel_stats_updated_at BEFORE UPDATE ON user_travel_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sync_status_updated_at BEFORE UPDATE ON itinerary_sync_status 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rebooking_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_city_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_travel_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_travel_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for data security
-- Itineraries: Users can only access their own itineraries
CREATE POLICY "Users can view own itineraries" ON itineraries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own itineraries" ON itineraries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own itineraries" ON itineraries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own itineraries" ON itineraries
    FOR DELETE USING (auth.uid() = user_id);

-- Trip segments: Users can access segments of their itineraries
CREATE POLICY "Users can view own trip segments" ON trip_segments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM itineraries 
            WHERE itineraries.id = trip_segments.itinerary_id 
            AND itineraries.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own trip segments" ON trip_segments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM itineraries 
            WHERE itineraries.id = trip_segments.itinerary_id 
            AND itineraries.user_id = auth.uid()
        )
    );

-- Similar policies for other tables
CREATE POLICY "Users can manage own travel documents" ON travel_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM itineraries 
            WHERE itineraries.id = travel_documents.itinerary_id 
            AND itineraries.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own travel alerts" ON travel_alerts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM itineraries 
            WHERE itineraries.id = travel_alerts.itinerary_id 
            AND itineraries.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own rebooking options" ON rebooking_options
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM itineraries 
            WHERE itineraries.id = rebooking_options.itinerary_id 
            AND itineraries.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own sync status" ON itinerary_sync_status
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM itineraries 
            WHERE itineraries.id = itinerary_sync_status.itinerary_id 
            AND itineraries.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own multi-city plans" ON multi_city_plans
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own travel preferences" ON user_travel_preferences
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own travel stats" ON user_travel_stats
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notifications" ON notification_queue
    FOR ALL USING (auth.uid() = user_id);

-- Add some helpful views
CREATE OR REPLACE VIEW active_itineraries AS
SELECT i.*, 
       COUNT(ts.id) as segment_count,
       COUNT(CASE WHEN ta.acknowledged = false THEN 1 END) as unread_alerts_count
FROM itineraries i
LEFT JOIN trip_segments ts ON i.id = ts.itinerary_id
LEFT JOIN travel_alerts ta ON i.id = ta.itinerary_id
WHERE i.status IN ('confirmed', 'active')
  AND i.end_date > NOW()
GROUP BY i.id;

CREATE OR REPLACE VIEW upcoming_segments AS
SELECT ts.*, i.user_id, i.title as itinerary_title
FROM trip_segments ts
JOIN itineraries i ON ts.itinerary_id = i.id
WHERE ts.start_time > NOW()
  AND ts.start_time <= NOW() + INTERVAL '7 days'
  AND ts.status = 'upcoming'
ORDER BY ts.start_time;

-- Grant appropriate permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON active_itineraries TO authenticated;
GRANT SELECT ON upcoming_segments TO authenticated;

-- Add some sample data for testing (optional)
-- This would be uncommented for development/testing environments
/*
INSERT INTO user_travel_preferences (user_id) 
SELECT id FROM auth.users WHERE email = 'test@layoverhq.com';

INSERT INTO user_travel_stats (user_id)
SELECT id FROM auth.users WHERE email = 'test@layoverhq.com';
*/