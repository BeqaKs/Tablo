-- ============================================================
-- Phase 1: Feature Expansion Migration
-- Adds: menu, orders, waitlist, guest_profiles, schedule_overrides, payments
-- Modifies: users, reservations, tables
-- ============================================================

-- Enable earthdistance extensions for geospatial queries
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

-- ============================================================
-- 1. ALTER existing tables
-- ============================================================

-- Users: no-show tracking & penalties
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS no_show_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_penalized BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS penalty_until TIMESTAMPTZ;

-- Reservations: attendance, reminders, walk-in, payment
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS attendance_status TEXT DEFAULT 'pending'
    CHECK (attendance_status IN ('pending', 'arrived', 'cancelled', 'no_show')),
  ADD COLUMN IF NOT EXISTS reminder_sent_24h BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_sent_2h BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS is_walk_in BOOLEAN DEFAULT false;

-- Tables: location type, prepayment
ALTER TABLE public.tables
  ADD COLUMN IF NOT EXISTS location_type TEXT DEFAULT 'dining_room'
    CHECK (location_type IN ('patio', 'bar', 'dining_room', 'private', 'rooftop')),
  ADD COLUMN IF NOT EXISTS requires_prepayment BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS prepayment_amount DECIMAL(10,2) DEFAULT 0;

-- ============================================================
-- 2. Menu System
-- ============================================================

CREATE TABLE IF NOT EXISTS public.menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.menu_categories(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  dietary_tags TEXT[] DEFAULT '{}',
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. Orders (tied to reservations)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  special_instructions TEXT,
  total_amount DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'preparing', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add order_id FK to reservations
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;

-- ============================================================
-- 4. Waitlist
-- ============================================================

CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  party_size INTEGER NOT NULL,
  requested_time TIMESTAMPTZ NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'offered', 'claimed', 'expired', 'cancelled')),
  offered_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  guest_name TEXT,
  guest_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. Guest Profiles (internal staff notes)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.guest_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  internal_notes TEXT,
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT CHECK (flag_reason IN ('rude', 'serial_canceler', 'disruptive', 'other', NULL)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, restaurant_id)
);

-- ============================================================
-- 6. Schedule Overrides
-- ============================================================

CREATE TABLE IF NOT EXISTS public.schedule_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_id UUID REFERENCES public.tables(id) ON DELETE CASCADE,
  override_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  status TEXT DEFAULT 'blocked' CHECK (status IN ('blocked', 'available')),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. Payments
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_menu_categories_restaurant ON public.menu_categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON public.menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_reservation ON public.orders(reservation_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_restaurant_time ON public.waitlist(restaurant_id, requested_time);
CREATE INDEX IF NOT EXISTS idx_waitlist_user ON public.waitlist(user_id);
CREATE INDEX IF NOT EXISTS idx_guest_profiles_restaurant ON public.guest_profiles(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_guest_profiles_user ON public.guest_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_schedule_overrides_restaurant_date ON public.schedule_overrides(restaurant_id, override_date);
CREATE INDEX IF NOT EXISTS idx_payments_reservation ON public.payments(reservation_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe ON public.payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_reservations_reminder ON public.reservations(reservation_time) WHERE reminder_sent_24h = false OR reminder_sent_2h = false;

-- ============================================================
-- 9. RLS Policies
-- ============================================================

-- Menu Categories
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view menu categories" ON public.menu_categories FOR SELECT USING (true);
CREATE POLICY "Owners can manage their menu categories" ON public.menu_categories FOR ALL
  USING (EXISTS (SELECT 1 FROM public.restaurants WHERE id = menu_categories.restaurant_id AND owner_id = auth.uid()));

-- Menu Items
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view available menu items" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Owners can manage their menu items" ON public.menu_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.restaurants WHERE id = menu_items.restaurant_id AND owner_id = auth.uid()));

-- Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.reservations WHERE id = orders.reservation_id AND user_id = auth.uid()));
CREATE POLICY "Owners can view restaurant orders" ON public.orders FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.restaurants WHERE id = orders.restaurant_id AND owner_id = auth.uid()));
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners can update orders" ON public.orders FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.restaurants WHERE id = orders.restaurant_id AND owner_id = auth.uid()));

-- Order Items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their order items" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Users can create order items" ON public.order_items FOR INSERT WITH CHECK (true);

-- Waitlist
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their waitlist entries" ON public.waitlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owners can view restaurant waitlist" ON public.waitlist FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.restaurants WHERE id = waitlist.restaurant_id AND owner_id = auth.uid()));
CREATE POLICY "Users can join waitlist" ON public.waitlist FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can cancel own waitlist" ON public.waitlist FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owners can manage waitlist" ON public.waitlist FOR ALL
  USING (EXISTS (SELECT 1 FROM public.restaurants WHERE id = waitlist.restaurant_id AND owner_id = auth.uid()));

-- Guest Profiles
ALTER TABLE public.guest_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can manage guest profiles" ON public.guest_profiles FOR ALL
  USING (EXISTS (SELECT 1 FROM public.restaurants WHERE id = guest_profiles.restaurant_id AND owner_id = auth.uid()));

-- Schedule Overrides
ALTER TABLE public.schedule_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view schedule overrides" ON public.schedule_overrides FOR SELECT USING (true);
CREATE POLICY "Owners can manage schedule overrides" ON public.schedule_overrides FOR ALL
  USING (EXISTS (SELECT 1 FROM public.restaurants WHERE id = schedule_overrides.restaurant_id AND owner_id = auth.uid()));

-- Payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their payments" ON public.payments FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.reservations WHERE id = payments.reservation_id AND user_id = auth.uid()));
CREATE POLICY "Owners can view restaurant payments" ON public.payments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.reservations r
    JOIN public.restaurants rest ON rest.id = r.restaurant_id
    WHERE r.id = payments.reservation_id AND rest.owner_id = auth.uid()
  ));

-- ============================================================
-- 10. Triggers for updated_at
-- ============================================================

CREATE TRIGGER update_menu_categories_updated_at BEFORE UPDATE ON public.menu_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_waitlist_updated_at BEFORE UPDATE ON public.waitlist FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_guest_profiles_updated_at BEFORE UPDATE ON public.guest_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schedule_overrides_updated_at BEFORE UPDATE ON public.schedule_overrides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
