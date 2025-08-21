-- Create comprehensive airports and cities database
CREATE TABLE IF NOT EXISTS airports (
  id SERIAL PRIMARY KEY,
  iata_code VARCHAR(3) UNIQUE NOT NULL,
  icao_code VARCHAR(4),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  country_code VARCHAR(2) NOT NULL,
  timezone TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  elevation INTEGER,
  type VARCHAR(20) DEFAULT 'airport',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast searching
CREATE INDEX IF NOT EXISTS idx_airports_search ON airports USING GIN (
  to_tsvector('english', name || ' ' || city || ' ' || country || ' ' || iata_code || ' ' || COALESCE(icao_code, ''))
);

CREATE INDEX IF NOT EXISTS idx_airports_iata ON airports (iata_code);
CREATE INDEX IF NOT EXISTS idx_airports_city ON airports (city);
CREATE INDEX IF NOT EXISTS idx_airports_country ON airports (country);

-- Insert comprehensive airport data
INSERT INTO airports (iata_code, icao_code, name, city, country, country_code, timezone, latitude, longitude, elevation) VALUES
-- Major International Hubs
('JFK', 'KJFK', 'John F. Kennedy International Airport', 'New York', 'United States', 'US', 'America/New_York', 40.6413, -73.7781, 13),
('LAX', 'KLAX', 'Los Angeles International Airport', 'Los Angeles', 'United States', 'US', 'America/Los_Angeles', 33.9425, -118.4081, 38),
('LHR', 'EGLL', 'London Heathrow Airport', 'London', 'United Kingdom', 'GB', 'Europe/London', 51.4700, -0.4543, 25),
('CDG', 'LFPG', 'Charles de Gaulle Airport', 'Paris', 'France', 'FR', 'Europe/Paris', 49.0097, 2.5479, 119),
('DXB', 'OMDB', 'Dubai International Airport', 'Dubai', 'United Arab Emirates', 'AE', 'Asia/Dubai', 25.2532, 55.3657, 62),
('IST', 'LTFM', 'Istanbul Airport', 'Istanbul', 'Turkey', 'TR', 'Europe/Istanbul', 41.2619, 28.7279, 325),
('DOH', 'OTHH', 'Hamad International Airport', 'Doha', 'Qatar', 'QA', 'Asia/Qatar', 25.2731, 51.6080, 13),
('SIN', 'WSSS', 'Singapore Changi Airport', 'Singapore', 'Singapore', 'SG', 'Asia/Singapore', 1.3644, 103.9915, 22),
('AMS', 'EHAM', 'Amsterdam Airport Schiphol', 'Amsterdam', 'Netherlands', 'NL', 'Europe/Amsterdam', 52.3105, 4.7683, -11),
('KEF', 'BIKF', 'Keflavik International Airport', 'Reykjavik', 'Iceland', 'IS', 'Atlantic/Reykjavik', 63.9850, -22.6056, 171),

-- European Hubs
('FRA', 'EDDF', 'Frankfurt Airport', 'Frankfurt', 'Germany', 'DE', 'Europe/Berlin', 50.0379, 8.5622, 364),
('MAD', 'LEMD', 'Adolfo Suárez Madrid–Barajas Airport', 'Madrid', 'Spain', 'ES', 'Europe/Madrid', 40.4839, -3.5680, 610),
('FCO', 'LIRF', 'Leonardo da Vinci International Airport', 'Rome', 'Italy', 'IT', 'Europe/Rome', 41.8003, 12.2389, 13),
('ZUR', 'LSZH', 'Zurich Airport', 'Zurich', 'Switzerland', 'CH', 'Europe/Zurich', 47.4647, 8.5492, 1416),
('VIE', 'LOWW', 'Vienna International Airport', 'Vienna', 'Austria', 'AT', 'Europe/Vienna', 48.1103, 16.5697, 600),
('CPH', 'EKCH', 'Copenhagen Airport', 'Copenhagen', 'Denmark', 'DK', 'Europe/Copenhagen', 55.6181, 12.6561, 17),
('ARN', 'ESSA', 'Stockholm Arlanda Airport', 'Stockholm', 'Sweden', 'SE', 'Europe/Stockholm', 59.6519, 17.9186, 137),
('OSL', 'ENGM', 'Oslo Airport', 'Oslo', 'Norway', 'NO', 'Europe/Oslo', 60.1939, 11.1004, 681),
('HEL', 'EFHK', 'Helsinki Airport', 'Helsinki', 'Finland', 'FI', 'Europe/Helsinki', 60.3172, 24.9633, 179),

-- Asian Hubs
('NRT', 'RJAA', 'Narita International Airport', 'Tokyo', 'Japan', 'JP', 'Asia/Tokyo', 35.7647, 140.3864, 141),
('HND', 'RJTT', 'Tokyo Haneda Airport', 'Tokyo', 'Japan', 'JP', 'Asia/Tokyo', 35.5494, 139.7798, 21),
('ICN', 'RKSI', 'Incheon International Airport', 'Seoul', 'South Korea', 'KR', 'Asia/Seoul', 37.4602, 126.4407, 23),
('HKG', 'VHHH', 'Hong Kong International Airport', 'Hong Kong', 'Hong Kong', 'HK', 'Asia/Hong_Kong', 22.3080, 113.9185, 28),
('PVG', 'ZSPD', 'Shanghai Pudong International Airport', 'Shanghai', 'China', 'CN', 'Asia/Shanghai', 31.1443, 121.8083, 13),
('PEK', 'ZBAA', 'Beijing Capital International Airport', 'Beijing', 'China', 'CN', 'Asia/Shanghai', 40.0801, 116.5846, 116),
('BOM', 'VABB', 'Chhatrapati Shivaji Maharaj International Airport', 'Mumbai', 'India', 'IN', 'Asia/Kolkata', 19.0896, 72.8656, 11),
('DEL', 'VIDP', 'Indira Gandhi International Airport', 'Delhi', 'India', 'IN', 'Asia/Kolkata', 28.5562, 77.1000, 777),
('BKK', 'VTBS', 'Suvarnabhumi Airport', 'Bangkok', 'Thailand', 'TH', 'Asia/Bangkok', 13.6900, 100.7501, 5),
('KUL', 'WMKK', 'Kuala Lumpur International Airport', 'Kuala Lumpur', 'Malaysia', 'MY', 'Asia/Kuala_Lumpur', 2.7456, 101.7072, 69),

-- Middle Eastern Hubs
('AUH', 'OMAA', 'Abu Dhabi International Airport', 'Abu Dhabi', 'United Arab Emirates', 'AE', 'Asia/Dubai', 24.4330, 54.6511, 88),
('KWI', 'OKBK', 'Kuwait International Airport', 'Kuwait City', 'Kuwait', 'KW', 'Asia/Kuwait', 29.2267, 47.9689, 206),
('RUH', 'OERK', 'King Khalid International Airport', 'Riyadh', 'Saudi Arabia', 'SA', 'Asia/Riyadh', 24.9576, 46.6988, 2049),
('JED', 'OEJN', 'King Abdulaziz International Airport', 'Jeddah', 'Saudi Arabia', 'SA', 'Asia/Riyadh', 21.6796, 39.1565, 48),

-- North American Hubs
('ORD', 'KORD', 'O''Hare International Airport', 'Chicago', 'United States', 'US', 'America/Chicago', 41.9742, -87.9073, 672),
('ATL', 'KATL', 'Hartsfield-Jackson Atlanta International Airport', 'Atlanta', 'United States', 'US', 'America/New_York', 33.6407, -84.4277, 1026),
('DFW', 'KDFW', 'Dallas/Fort Worth International Airport', 'Dallas', 'United States', 'US', 'America/Chicago', 32.8998, -97.0403, 607),
('DEN', 'KDEN', 'Denver International Airport', 'Denver', 'United States', 'US', 'America/Denver', 39.8561, -104.6737, 5431),
('SFO', 'KSFO', 'San Francisco International Airport', 'San Francisco', 'United States', 'US', 'America/Los_Angeles', 37.6213, -122.3790, 13),
('SEA', 'KSEA', 'Seattle-Tacoma International Airport', 'Seattle', 'United States', 'US', 'America/Los_Angeles', 47.4502, -122.3088, 131),
('YYZ', 'CYYZ', 'Toronto Pearson International Airport', 'Toronto', 'Canada', 'CA', 'America/Toronto', 43.6777, -79.6248, 569),
('YVR', 'CYVR', 'Vancouver International Airport', 'Vancouver', 'Canada', 'CA', 'America/Vancouver', 49.1967, -123.1815, 4),

-- South American Hubs
('GRU', 'SBGR', 'São Paulo/Guarulhos International Airport', 'São Paulo', 'Brazil', 'BR', 'America/Sao_Paulo', -23.4356, -46.4731, 2459),
('EZE', 'SAEZ', 'Ezeiza International Airport', 'Buenos Aires', 'Argentina', 'AR', 'America/Argentina/Buenos_Aires', -34.8222, -58.5358, 67),
('BOG', 'SKBO', 'El Dorado International Airport', 'Bogotá', 'Colombia', 'CO', 'America/Bogota', 4.7016, -74.1469, 8361),
('LIM', 'SPJC', 'Jorge Chávez International Airport', 'Lima', 'Peru', 'PE', 'America/Lima', -12.0219, -77.1143, 113),

-- African Hubs
('CAI', 'HECA', 'Cairo International Airport', 'Cairo', 'Egypt', 'EG', 'Africa/Cairo', 30.1219, 31.4056, 382),
('JNB', 'FAJS', 'O.R. Tambo International Airport', 'Johannesburg', 'South Africa', 'ZA', 'Africa/Johannesburg', -26.1367, 28.2411, 5558),
('ADD', 'HAAB', 'Addis Ababa Bole International Airport', 'Addis Ababa', 'Ethiopia', 'ET', 'Africa/Addis_Ababa', 8.9806, 38.7997, 7625),
('LOS', 'DNMM', 'Murtala Muhammed International Airport', 'Lagos', 'Nigeria', 'NG', 'Africa/Lagos', 6.5774, 3.3212, 135),

-- Oceania Hubs
('SYD', 'YSSY', 'Sydney Kingsford Smith Airport', 'Sydney', 'Australia', 'AU', 'Australia/Sydney', -33.9399, 151.1753, 21),
('MEL', 'YMML', 'Melbourne Airport', 'Melbourne', 'Australia', 'AU', 'Australia/Melbourne', -37.6690, 144.8410, 434),
('AKL', 'NZAA', 'Auckland Airport', 'Auckland', 'New Zealand', 'NZ', 'Pacific/Auckland', -37.0082, 174.7850, 23),

-- Additional Popular Destinations
('BCN', 'LEBL', 'Barcelona-El Prat Airport', 'Barcelona', 'Spain', 'ES', 'Europe/Madrid', 41.2974, 2.0833, 12),
('MUC', 'EDDM', 'Munich Airport', 'Munich', 'Germany', 'DE', 'Europe/Berlin', 48.3537, 11.7750, 1487),
('LGW', 'EGKK', 'London Gatwick Airport', 'London', 'United Kingdom', 'GB', 'Europe/London', 51.1537, -0.1821, 202),
('MAN', 'EGCC', 'Manchester Airport', 'Manchester', 'United Kingdom', 'GB', 'Europe/London', 53.3537, -2.2750, 257),
('EDI', 'EGPH', 'Edinburgh Airport', 'Edinburgh', 'United Kingdom', 'GB', 'Europe/London', 55.9500, -3.3725, 135),
('DUB', 'EIDW', 'Dublin Airport', 'Dublin', 'Ireland', 'IE', 'Europe/Dublin', 53.4213, -6.2701, 242),
('BRU', 'EBBR', 'Brussels Airport', 'Brussels', 'Belgium', 'BE', 'Europe/Brussels', 50.9014, 4.4844, 184),
('LIS', 'LPPT', 'Lisbon Airport', 'Lisbon', 'Portugal', 'PT', 'Europe/Lisbon', 38.7813, -9.1357, 374),
('ATH', 'LGAV', 'Athens International Airport', 'Athens', 'Greece', 'GR', 'Europe/Athens', 37.9364, 23.9445, 308),
('WAW', 'EPWA', 'Warsaw Chopin Airport', 'Warsaw', 'Poland', 'PL', 'Europe/Warsaw', 52.1657, 20.9671, 362);

-- Enable RLS
ALTER TABLE airports ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access to airports" ON airports
  FOR SELECT USING (true);

-- Create policy to allow authenticated users to read
CREATE POLICY "Allow authenticated read access to airports" ON airports
  FOR SELECT TO authenticated USING (true);
