-- Flight Management System
CREATE TABLE IF NOT EXISTS public.airlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE, -- IATA code like 'QR', 'EK'
  name TEXT NOT NULL,
  country TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.airports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE, -- IATA code like 'DOH', 'DXB'
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  timezone TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_hub BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.aircraft_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model TEXT NOT NULL, -- 'Boeing 777-300ER'
  manufacturer TEXT NOT NULL, -- 'Boeing'
  capacity INTEGER NOT NULL,
  range_km INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.flights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_number TEXT NOT NULL,
  airline_id UUID NOT NULL REFERENCES public.airlines(id),
  aircraft_type_id UUID REFERENCES public.aircraft_types(id),
  departure_airport_id UUID NOT NULL REFERENCES public.airports(id),
  arrival_airport_id UUID NOT NULL REFERENCES public.airports(id),
  scheduled_departure TIMESTAMPTZ NOT NULL,
  scheduled_arrival TIMESTAMPTZ NOT NULL,
  actual_departure TIMESTAMPTZ,
  actual_arrival TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'boarding', 'departed', 'arrived', 'delayed', 'cancelled')),
  gate TEXT,
  terminal TEXT,
  price_economy DECIMAL(10, 2),
  price_business DECIMAL(10, 2),
  price_first DECIMAL(10, 2),
  available_seats_economy INTEGER DEFAULT 0,
  available_seats_business INTEGER DEFAULT 0,
  available_seats_first INTEGER DEFAULT 0,
  layover_duration_minutes INTEGER, -- For layover optimization
  is_layover_eligible BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.layover_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  airport_id UUID NOT NULL REFERENCES public.airports(id),
  duration_hours INTEGER NOT NULL, -- Minimum layover duration required
  price DECIMAL(10, 2) NOT NULL,
  includes TEXT[], -- Array of included services
  provider TEXT, -- GetYourGuide, Viator, etc.
  provider_id TEXT, -- External provider's package ID
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  booking_reference TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  total_amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method TEXT,
  payment_provider TEXT, -- stripe, paypal, etc.
  payment_provider_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.booking_flights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  flight_id UUID NOT NULL REFERENCES public.flights(id),
  passenger_name TEXT NOT NULL,
  passenger_email TEXT NOT NULL,
  seat_class TEXT NOT NULL CHECK (seat_class IN ('economy', 'business', 'first')),
  seat_number TEXT,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.booking_layovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  layover_package_id UUID NOT NULL REFERENCES public.layover_packages(id),
  participants INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.airlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aircraft_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.layover_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_layovers ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Admin/Manager can see all, users can see their own bookings
CREATE POLICY "airlines_read_all" ON public.airlines FOR SELECT USING (true);
CREATE POLICY "airlines_admin_write" ON public.airlines FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "airports_read_all" ON public.airports FOR SELECT USING (true);
CREATE POLICY "airports_admin_write" ON public.airports FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "aircraft_read_all" ON public.aircraft_types FOR SELECT USING (true);
CREATE POLICY "aircraft_admin_write" ON public.aircraft_types FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "flights_read_all" ON public.flights FOR SELECT USING (true);
CREATE POLICY "flights_admin_write" ON public.flights FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "layover_packages_read_all" ON public.layover_packages FOR SELECT USING (true);
CREATE POLICY "layover_packages_admin_write" ON public.layover_packages FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "bookings_own_or_admin" ON public.bookings FOR SELECT USING (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);
CREATE POLICY "bookings_own_insert" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookings_admin_write" ON public.bookings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "booking_flights_via_booking" ON public.booking_flights FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.bookings b 
    WHERE b.id = booking_id AND (
      b.user_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
    )
  )
);

CREATE POLICY "booking_layovers_via_booking" ON public.booking_layovers FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.bookings b 
    WHERE b.id = booking_id AND (
      b.user_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
    )
  )
);

-- Add updated_at triggers
CREATE TRIGGER flights_updated_at BEFORE UPDATE ON public.flights FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
