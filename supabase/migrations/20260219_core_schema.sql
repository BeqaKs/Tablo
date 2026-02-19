-- Core Schema Migration for Tablo

-- 1. Restaurants Table
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    cuisine_type TEXT,
    price_range TEXT CHECK (price_range IN ('$', '$$', '$$$', '$$$$')),
    turn_duration_minutes INTEGER DEFAULT 90,
    preparation_time_minutes INTEGER DEFAULT 15,
    is_open BOOLEAN DEFAULT true,
    images TEXT[] DEFAULT '{}',
    floor_plan_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tables Table
CREATE TABLE IF NOT EXISTS public.tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_number TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 2,
    shape TEXT NOT NULL CHECK (shape IN ('square', 'round', 'rectangle')),
    x_coord INTEGER NOT NULL DEFAULT 0,
    y_coord INTEGER NOT NULL DEFAULT 0,
    rotation INTEGER NOT NULL DEFAULT 0,
    zone_name TEXT DEFAULT 'Main',
    pos_table_id TEXT,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Reservations Table
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
    guest_count INTEGER NOT NULL,
    reservation_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show')),
    guest_name TEXT,
    guest_phone TEXT,
    guest_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Temporal Overlap Protection (Exclusion Constraint)
-- Requires btree_gist extension for UUID and timestamp ranges
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE public.reservations
ADD CONSTRAINT reservations_table_time_overlap_excl
EXCLUDE USING gist (
    table_id WITH =,
    tstzrange(reservation_time, end_time) WITH &&
)
WHERE (status NOT IN ('cancelled', 'no_show') AND table_id IS NOT NULL);

-- 5. RLS Policies

ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Restaurants Policies
CREATE POLICY "Public can view open restaurants" 
ON public.restaurants FOR SELECT USING (is_open = true);

CREATE POLICY "Owners can manage their own restaurants"
ON public.restaurants FOR ALL USING (auth.uid() = owner_id);

-- Tables Policies
CREATE POLICY "Public can view tables for restaurants"
ON public.tables FOR SELECT USING (true);

CREATE POLICY "Owners can manage their restaurant tables"
ON public.tables FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.restaurants 
        WHERE id = tables.restaurant_id AND owner_id = auth.uid()
    )
);

-- Reservations Policies
CREATE POLICY "Users can view their own reservations"
ON public.reservations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Owners can view reservations for their restaurants"
ON public.reservations FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.restaurants 
        WHERE id = reservations.restaurant_id AND owner_id = auth.uid()
    )
);

CREATE POLICY "Users can create reservations"
ON public.reservations FOR INSERT WITH CHECK (true);

CREATE POLICY "Owners can update reservations for their restaurants"
ON public.reservations FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.restaurants 
        WHERE id = reservations.restaurant_id AND owner_id = auth.uid()
    )
);

-- Triggers for updated_at
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON public.tables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
