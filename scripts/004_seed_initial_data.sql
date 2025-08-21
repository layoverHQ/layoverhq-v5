-- Seed initial data for the enterprise system

-- Insert sample airlines
INSERT INTO public.airlines (code, name, country, is_active) VALUES
('QR', 'Qatar Airways', 'Qatar', true),
('EK', 'Emirates', 'UAE', true),
('TK', 'Turkish Airlines', 'Turkey', true),
('SQ', 'Singapore Airlines', 'Singapore', true),
('LH', 'Lufthansa', 'Germany', true)
ON CONFLICT (code) DO NOTHING;

-- Insert sample airports
INSERT INTO public.airports (code, name, city, country, timezone, is_hub, is_active) VALUES
('DOH', 'Hamad International Airport', 'Doha', 'Qatar', 'Asia/Qatar', true, true),
('DXB', 'Dubai International Airport', 'Dubai', 'UAE', 'Asia/Dubai', true, true),
('IST', 'Istanbul Airport', 'Istanbul', 'Turkey', 'Europe/Istanbul', true, true),
('SIN', 'Singapore Changi Airport', 'Singapore', 'Singapore', 'Asia/Singapore', true, true),
('FRA', 'Frankfurt Airport', 'Frankfurt', 'Germany', 'Europe/Berlin', true, true),
('LHR', 'London Heathrow Airport', 'London', 'UK', 'Europe/London', true, true),
('JFK', 'John F. Kennedy International Airport', 'New York', 'USA', 'America/New_York', true, true),
('NRT', 'Narita International Airport', 'Tokyo', 'Japan', 'Asia/Tokyo', true, true)
ON CONFLICT (code) DO NOTHING;

-- Insert sample aircraft types
INSERT INTO public.aircraft_types (model, manufacturer, capacity, range_km) VALUES
('Boeing 777-300ER', 'Boeing', 396, 14685),
('Airbus A350-900', 'Airbus', 325, 15000),
('Boeing 787-9', 'Boeing', 296, 14140),
('Airbus A380-800', 'Airbus', 525, 15200),
('Boeing 737-800', 'Boeing', 189, 5765)
ON CONFLICT DO NOTHING;

-- Insert sample layover packages
INSERT INTO public.layover_packages (name, description, airport_id, duration_hours, price, includes, provider, is_active) VALUES
('Doha City Tour', 'Explore the vibrant city of Doha during your layover', 
 (SELECT id FROM public.airports WHERE code = 'DOH'), 6, 89.99, 
 ARRAY['Transportation', 'City tour', 'Traditional lunch', 'Souq Waqif visit'], 'GetYourGuide', true),
('Dubai Desert Safari', 'Experience the Arabian desert with dune bashing and camel riding', 
 (SELECT id FROM public.airports WHERE code = 'DXB'), 8, 129.99, 
 ARRAY['Desert safari', 'Camel riding', 'BBQ dinner', 'Cultural show'], 'Viator', true),
('Istanbul Historical Tour', 'Discover the rich history of Istanbul', 
 (SELECT id FROM public.airports WHERE code = 'IST'), 7, 79.99, 
 ARRAY['Hagia Sophia visit', 'Blue Mosque tour', 'Grand Bazaar', 'Turkish lunch'], 'GetYourGuide', true),
('Singapore Gardens Tour', 'Visit the famous Gardens by the Bay and Marina Bay', 
 (SELECT id FROM public.airports WHERE code = 'SIN'), 5, 69.99, 
 ARRAY['Gardens by the Bay', 'Marina Bay Sands', 'Local cuisine tasting'], 'Viator', true)
ON CONFLICT DO NOTHING;

-- Insert sample integrations
INSERT INTO public.integrations (name, type, provider, status, config, health_status) VALUES
('Amadeus Flight Data', 'flight_data', 'amadeus', 'active', '{"api_key": "encrypted", "endpoint": "https://api.amadeus.com"}', 'healthy'),
('Duffel Flight API', 'flight_data', 'duffel', 'active', '{"api_key": "encrypted", "endpoint": "https://api.duffel.com"}', 'healthy'),
('Stripe Payments', 'payment', 'stripe', 'active', '{"api_key": "encrypted", "webhook_secret": "encrypted"}', 'healthy'),
('GetYourGuide Experiences', 'experience', 'getyourguide', 'active', '{"api_key": "encrypted", "partner_id": "encrypted"}', 'healthy'),
('Booking.com Hotels', 'hotel', 'booking', 'inactive', '{"api_key": "encrypted"}', 'unknown'),
('PayPal Payments', 'payment', 'paypal', 'active', '{"client_id": "encrypted", "client_secret": "encrypted"}', 'healthy')
ON CONFLICT (name) DO NOTHING;

-- Insert sample AI agents
INSERT INTO public.ai_agents (name, type, status, performance_score) VALUES
('Orchestrator Agent', 'orchestrator', 'active', 0.95),
('Backend Agent', 'backend', 'active', 0.92),
('Frontend Agent', 'frontend', 'active', 0.88),
('DevOps Agent', 'devops', 'active', 0.90),
('QA Agent', 'qa', 'idle', 0.85),
('Database Agent', 'database', 'active', 0.93),
('Security Agent', 'security', 'active', 0.97)
ON CONFLICT (name) DO NOTHING;

-- Insert sample system metrics (last 24 hours simulation)
INSERT INTO public.system_metrics (service_name, metric_type, value, unit, timestamp) VALUES
('api-gateway', 'response_time', 145.5, 'ms', NOW() - INTERVAL '1 hour'),
('api-gateway', 'cpu', 65.2, '%', NOW() - INTERVAL '1 hour'),
('database', 'cpu', 45.8, '%', NOW() - INTERVAL '1 hour'),
('database', 'memory', 78.3, '%', NOW() - INTERVAL '1 hour'),
('redis-cache', 'memory', 34.7, '%', NOW() - INTERVAL '1 hour'),
('flight-service', 'response_time', 89.2, 'ms', NOW() - INTERVAL '1 hour'),
('booking-service', 'response_time', 112.8, 'ms', NOW() - INTERVAL '1 hour'),
('payment-service', 'error_rate', 0.2, '%', NOW() - INTERVAL '1 hour')
ON CONFLICT DO NOTHING;
