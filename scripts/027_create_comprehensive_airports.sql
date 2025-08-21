-- Create comprehensive airports table with prioritization
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
  priority_tier INTEGER DEFAULT 3, -- 1=Major Hub, 2=Regional Hub, 3=Standard
  passenger_volume BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast searching
CREATE INDEX IF NOT EXISTS idx_airports_iata ON airports(iata_code);
CREATE INDEX IF NOT EXISTS idx_airports_name ON airports USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_airports_city ON airports USING gin(to_tsvector('english', city));
CREATE INDEX IF NOT EXISTS idx_airports_priority ON airports(priority_tier, passenger_volume DESC);
CREATE INDEX IF NOT EXISTS idx_airports_search ON airports USING gin(to_tsvector('english', name || ' ' || city || ' ' || country));

-- Insert comprehensive airport data with prioritization
INSERT INTO airports (iata_code, icao_code, name, city, country, country_code, timezone, latitude, longitude, elevation, priority_tier, passenger_volume) VALUES
-- Tier 1: Major International Hubs (Top 50 busiest airports globally)
('ATL', 'KATL', 'Hartsfield-Jackson Atlanta International Airport', 'Atlanta', 'United States', 'US', 'America/New_York', 33.6407, -84.4277, 1026, 1, 110000000),
('PEK', 'ZBAA', 'Beijing Capital International Airport', 'Beijing', 'China', 'CN', 'Asia/Shanghai', 40.0799, 116.6031, 116, 1, 100000000),
('LAX', 'KLAX', 'Los Angeles International Airport', 'Los Angeles', 'United States', 'US', 'America/Los_Angeles', 33.9425, -118.4081, 125, 1, 88000000),
('DXB', 'OMDB', 'Dubai International Airport', 'Dubai', 'United Arab Emirates', 'AE', 'Asia/Dubai', 25.2532, 55.3657, 62, 1, 86000000),
('HND', 'RJTT', 'Tokyo Haneda Airport', 'Tokyo', 'Japan', 'JP', 'Asia/Tokyo', 35.5494, 139.7798, 21, 1, 85000000),
('ORD', 'KORD', 'Chicago O''Hare International Airport', 'Chicago', 'United States', 'US', 'America/Chicago', 41.9742, -87.9073, 672, 1, 84000000),
('LHR', 'EGLL', 'London Heathrow Airport', 'London', 'United Kingdom', 'GB', 'Europe/London', 51.4700, -0.4543, 83, 1, 80000000),
('PVG', 'ZSPD', 'Shanghai Pudong International Airport', 'Shanghai', 'China', 'CN', 'Asia/Shanghai', 31.1443, 121.8083, 13, 1, 76000000),
('CDG', 'LFPG', 'Charles de Gaulle Airport', 'Paris', 'France', 'FR', 'Europe/Paris', 49.0097, 2.5479, 392, 1, 72000000),
('DFW', 'KDFW', 'Dallas/Fort Worth International Airport', 'Dallas', 'United States', 'US', 'America/Chicago', 32.8998, -97.0403, 607, 1, 75000000),
('CAN', 'ZGGG', 'Guangzhou Baiyun International Airport', 'Guangzhou', 'China', 'CN', 'Asia/Shanghai', 23.3924, 113.2988, 50, 1, 73000000),
('AMS', 'EHAM', 'Amsterdam Airport Schiphol', 'Amsterdam', 'Netherlands', 'NL', 'Europe/Amsterdam', 52.3105, 4.7683, -11, 1, 71000000),
('FRA', 'EDDF', 'Frankfurt Airport', 'Frankfurt', 'Germany', 'DE', 'Europe/Berlin', 50.0379, 8.5622, 364, 1, 70000000),
('IST', 'LTFM', 'Istanbul Airport', 'Istanbul', 'Turkey', 'TR', 'Europe/Istanbul', 41.2753, 28.7519, 325, 1, 68000000),
('DEL', 'VIDP', 'Indira Gandhi International Airport', 'New Delhi', 'India', 'IN', 'Asia/Kolkata', 28.5562, 77.1000, 777, 1, 69000000),
('ICN', 'RKSI', 'Incheon International Airport', 'Seoul', 'South Korea', 'KR', 'Asia/Seoul', 37.4602, 126.4407, 23, 1, 68000000),
('BKK', 'VTBS', 'Suvarnabhumi Airport', 'Bangkok', 'Thailand', 'TH', 'Asia/Bangkok', 13.6900, 100.7501, 5, 1, 65000000),
('SIN', 'WSSS', 'Singapore Changi Airport', 'Singapore', 'Singapore', 'SG', 'Asia/Singapore', 1.3644, 103.9915, 22, 1, 68000000),
('DEN', 'KDEN', 'Denver International Airport', 'Denver', 'United States', 'US', 'America/Denver', 39.8561, -104.6737, 5431, 1, 64000000),
('JFK', 'KJFK', 'John F. Kennedy International Airport', 'New York', 'United States', 'US', 'America/New_York', 40.6413, -73.7781, 13, 1, 62000000),
('KUL', 'WMKK', 'Kuala Lumpur International Airport', 'Kuala Lumpur', 'Malaysia', 'MY', 'Asia/Kuala_Lumpur', 2.7456, 101.7072, 69, 1, 60000000),
('MAD', 'LEMD', 'Adolfo Suárez Madrid–Barajas Airport', 'Madrid', 'Spain', 'ES', 'Europe/Madrid', 40.4839, -3.5680, 2001, 1, 61000000),
('BOM', 'VABB', 'Chhatrapati Shivaji Maharaj International Airport', 'Mumbai', 'India', 'IN', 'Asia/Kolkata', 19.0896, 72.8656, 39, 1, 49000000),
('NRT', 'RJAA', 'Narita International Airport', 'Tokyo', 'Japan', 'JP', 'Asia/Tokyo', 35.7720, 140.3929, 141, 1, 44000000),
('LAS', 'KLAS', 'McCarran International Airport', 'Las Vegas', 'United States', 'US', 'America/Los_Angeles', 36.0840, -115.1537, 2181, 1, 51000000),
('SEA', 'KSEA', 'Seattle-Tacoma International Airport', 'Seattle', 'United States', 'US', 'America/Los_Angeles', 47.4502, -122.3088, 433, 1, 47000000),
('MIA', 'KMIA', 'Miami International Airport', 'Miami', 'United States', 'US', 'America/New_York', 25.7959, -80.2870, 8, 1, 45000000),
('CLT', 'KCLT', 'Charlotte Douglas International Airport', 'Charlotte', 'United States', 'US', 'America/New_York', 35.2144, -80.9473, 748, 1, 47000000),
('PHX', 'KPHX', 'Phoenix Sky Harbor International Airport', 'Phoenix', 'United States', 'US', 'America/Phoenix', 33.4484, -112.0740, 1135, 1, 44000000),
('SYD', 'YSSY', 'Sydney Kingsford Smith Airport', 'Sydney', 'Australia', 'AU', 'Australia/Sydney', -33.9399, 151.1753, 21, 1, 44000000),
('MEL', 'YMML', 'Melbourne Airport', 'Melbourne', 'Australia', 'AU', 'Australia/Melbourne', -37.6690, 144.8410, 434, 1, 37000000),

-- Tier 2: Regional Hubs and Major Secondary Airports
('DOH', 'OTHH', 'Hamad International Airport', 'Doha', 'Qatar', 'QA', 'Asia/Qatar', 25.2731, 51.6080, 13, 2, 38000000),
('AUH', 'OMAA', 'Abu Dhabi International Airport', 'Abu Dhabi', 'United Arab Emirates', 'AE', 'Asia/Dubai', 24.4330, 54.6511, 88, 2, 23000000),
('ZUR', 'LSZH', 'Zurich Airport', 'Zurich', 'Switzerland', 'CH', 'Europe/Zurich', 47.4647, 8.5492, 1416, 2, 31000000),
('VIE', 'LOWW', 'Vienna International Airport', 'Vienna', 'Austria', 'AT', 'Europe/Vienna', 48.1103, 16.5697, 600, 2, 31000000),
('CPH', 'EKCH', 'Copenhagen Airport', 'Copenhagen', 'Denmark', 'DK', 'Europe/Copenhagen', 55.6181, 12.6561, 17, 2, 30000000),
('ARN', 'ESSA', 'Stockholm Arlanda Airport', 'Stockholm', 'Sweden', 'SE', 'Europe/Stockholm', 59.6519, 17.9186, 137, 2, 27000000),
('HEL', 'EFHK', 'Helsinki-Vantaa Airport', 'Helsinki', 'Finland', 'FI', 'Europe/Helsinki', 60.3172, 24.9633, 179, 2, 21000000),
('OSL', 'ENGM', 'Oslo Airport', 'Oslo', 'Norway', 'NO', 'Europe/Oslo', 60.1939, 11.1004, 681, 2, 28000000),
('KEF', 'BIKF', 'Keflavík International Airport', 'Reykjavik', 'Iceland', 'IS', 'Atlantic/Reykjavik', 63.9850, -22.6056, 171, 2, 7000000),
('YYZ', 'CYYZ', 'Toronto Pearson International Airport', 'Toronto', 'Canada', 'CA', 'America/Toronto', 43.6777, -79.6248, 569, 2, 50000000),
('YVR', 'CYVR', 'Vancouver International Airport', 'Vancouver', 'Canada', 'CA', 'America/Vancouver', 49.1967, -123.1815, 4, 2, 26000000),
('GRU', 'SBGR', 'São Paulo–Guarulhos International Airport', 'São Paulo', 'Brazil', 'BR', 'America/Sao_Paulo', -23.4356, -46.4731, 2459, 2, 42000000),
('GIG', 'SBGL', 'Rio de Janeiro–Galeão International Airport', 'Rio de Janeiro', 'Brazil', 'BR', 'America/Sao_Paulo', -22.8099, -43.2505, 28, 2, 17000000),
('EZE', 'SAEZ', 'Ezeiza International Airport', 'Buenos Aires', 'Argentina', 'AR', 'America/Argentina/Buenos_Aires', -34.8222, -58.5358, 67, 2, 10000000),
('SCL', 'SCEL', 'Santiago International Airport', 'Santiago', 'Chile', 'CL', 'America/Santiago', -33.3930, -70.7858, 1555, 2, 22000000),
('LIM', 'SPJC', 'Jorge Chávez International Airport', 'Lima', 'Peru', 'PE', 'America/Lima', -12.0219, -77.1143, 113, 2, 22000000),
('BOG', 'SKBO', 'El Dorado International Airport', 'Bogotá', 'Colombia', 'CO', 'America/Bogota', 4.7016, -74.1469, 8361, 2, 32000000),
('MEX', 'MMMX', 'Mexico City International Airport', 'Mexico City', 'Mexico', 'MX', 'America/Mexico_City', 19.4363, -99.0721, 7316, 2, 50000000),
('CUN', 'MMUN', 'Cancún International Airport', 'Cancún', 'Mexico', 'MX', 'America/Cancun', 21.0365, -86.8770, 22, 2, 25000000),

-- Tier 3: Standard International and Domestic Airports
('JNB', 'FAJS', 'O.R. Tambo International Airport', 'Johannesburg', 'South Africa', 'ZA', 'Africa/Johannesburg', -26.1367, 28.2411, 5558, 3, 21000000),
('CAI', 'HECA', 'Cairo International Airport', 'Cairo', 'Egypt', 'EG', 'Africa/Cairo', 30.1219, 31.4056, 382, 3, 16000000),
('ADD', 'HAAB', 'Addis Ababa Bole International Airport', 'Addis Ababa', 'Ethiopia', 'ET', 'Africa/Addis_Ababa', 8.9806, 38.7997, 7625, 3, 13000000),
('NBO', 'HKJK', 'Jomo Kenyatta International Airport', 'Nairobi', 'Kenya', 'KE', 'Africa/Nairobi', -1.3192, 36.9278, 5327, 3, 8000000),
('LOS', 'DNMM', 'Murtala Muhammed International Airport', 'Lagos', 'Nigeria', 'NG', 'Africa/Lagos', 6.5774, 3.3212, 135, 3, 8000000),
('CMN', 'GMMN', 'Mohammed V International Airport', 'Casablanca', 'Morocco', 'MA', 'Africa/Casablanca', 33.3675, -7.5898, 656, 3, 10000000),
('TUN', 'DTTA', 'Tunis-Carthage International Airport', 'Tunis', 'Tunisia', 'TN', 'Africa/Tunis', 36.8510, 10.2272, 22, 3, 7000000),
('ALG', 'DAAG', 'Houari Boumediene Airport', 'Algiers', 'Algeria', 'DZ', 'Africa/Algiers', 36.6910, 3.2154, 82, 3, 6000000),
('TPE', 'RCTP', 'Taiwan Taoyuan International Airport', 'Taipei', 'Taiwan', 'TW', 'Asia/Taipei', 25.0797, 121.2342, 106, 3, 48000000),
('HKG', 'VHHH', 'Hong Kong International Airport', 'Hong Kong', 'Hong Kong', 'HK', 'Asia/Hong_Kong', 22.3080, 113.9185, 28, 3, 75000000),
('MNL', 'RPLL', 'Ninoy Aquino International Airport', 'Manila', 'Philippines', 'PH', 'Asia/Manila', 14.5086, 121.0194, 75, 3, 45000000),
('CGK', 'WIII', 'Soekarno-Hatta International Airport', 'Jakarta', 'Indonesia', 'ID', 'Asia/Jakarta', -6.1256, 106.6558, 34, 3, 66000000),
('KIX', 'RJBB', 'Kansai International Airport', 'Osaka', 'Japan', 'JP', 'Asia/Tokyo', 34.4347, 135.2441, 26, 3, 29000000),
('CTS', 'RJCC', 'New Chitose Airport', 'Sapporo', 'Japan', 'JP', 'Asia/Tokyo', 42.7752, 141.6920, 82, 3, 22000000),
('FUK', 'RJFF', 'Fukuoka Airport', 'Fukuoka', 'Japan', 'JP', 'Asia/Tokyo', 33.5859, 130.4510, 32, 3, 24000000);

-- Enable Row Level Security
ALTER TABLE airports ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access to airports" ON airports
  FOR SELECT USING (true);

-- Create policy to allow authenticated users to read
CREATE POLICY "Allow authenticated read access to airports" ON airports
  FOR SELECT TO authenticated USING (true);
