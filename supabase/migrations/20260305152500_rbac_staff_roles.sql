-- Create staff_roles table
CREATE TABLE IF NOT EXISTS public.staff_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('manager', 'host')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(restaurant_id, user_id)
);

ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;

-- Policies for staff_roles
CREATE POLICY "Owners can manage staff roles"
ON public.staff_roles FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.restaurants 
        WHERE id = staff_roles.restaurant_id AND owner_id = auth.uid()
    )
);

CREATE POLICY "Staff can view their own roles"
ON public.staff_roles FOR SELECT
USING (auth.uid() = user_id);

-- Update Restaurants Policies to allow staff to READ
DROP POLICY IF EXISTS "Owners can manage their own restaurants" ON public.restaurants;
CREATE POLICY "Owners and Staff can view restaurant"
ON public.restaurants FOR SELECT
USING (
    auth.uid() = owner_id OR 
    EXISTS (SELECT 1 FROM public.staff_roles WHERE restaurant_id = id AND user_id = auth.uid())
);
CREATE POLICY "Owners can update restaurant"
ON public.restaurants FOR UPDATE
USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete restaurant"
ON public.restaurants FOR DELETE
USING (auth.uid() = owner_id);

-- Update Tables Policies
DROP POLICY IF EXISTS "Owners can manage their restaurant tables" ON public.tables;
CREATE POLICY "Owners and Staff can manage tables"
ON public.tables FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.restaurants 
        WHERE id = tables.restaurant_id AND owner_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM public.staff_roles 
        WHERE restaurant_id = tables.restaurant_id AND user_id = auth.uid()
    )
);

-- Update Reservations Policies
DROP POLICY IF EXISTS "Owners can view reservations for their restaurants" ON public.reservations;
CREATE POLICY "Owners and Staff can view reservations"
ON public.reservations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.restaurants WHERE id = reservations.restaurant_id AND owner_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM public.staff_roles WHERE restaurant_id = reservations.restaurant_id AND user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Owners can update reservations for their restaurants" ON public.reservations;
CREATE POLICY "Owners and Staff can update reservations"
ON public.reservations FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.restaurants WHERE id = reservations.restaurant_id AND owner_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM public.staff_roles WHERE restaurant_id = reservations.restaurant_id AND user_id = auth.uid()
    )
);

-- Note: We also need to update Guest Profiles, Waitlist, etc., if they had Owner-only policies.

-- Update Waitlist Policies
DROP POLICY IF EXISTS "Owners can view restaurant waitlist" ON public.waitlist;
CREATE POLICY "Owners and Staff can view waitlist"
ON public.waitlist FOR SELECT
USING (
    EXISTS (SELECT 1 FROM public.restaurants WHERE id = waitlist.restaurant_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.staff_roles WHERE restaurant_id = waitlist.restaurant_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Owners can manage waitlist" ON public.waitlist;
CREATE POLICY "Owners and Staff can manage waitlist"
ON public.waitlist FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.restaurants WHERE id = waitlist.restaurant_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.staff_roles WHERE restaurant_id = waitlist.restaurant_id AND user_id = auth.uid())
);

-- Update Guest Profiles Policies
DROP POLICY IF EXISTS "Owners can manage guest profiles" ON public.guest_profiles;
CREATE POLICY "Owners and Staff can manage guest profiles"
ON public.guest_profiles FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.restaurants WHERE id = guest_profiles.restaurant_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.staff_roles WHERE restaurant_id = guest_profiles.restaurant_id AND user_id = auth.uid())
);

-- Update Schedule Overrides Policies
DROP POLICY IF EXISTS "Owners can manage schedule overrides" ON public.schedule_overrides;
CREATE POLICY "Owners and Staff can manage schedule overrides"
ON public.schedule_overrides FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.restaurants WHERE id = schedule_overrides.restaurant_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.staff_roles WHERE restaurant_id = schedule_overrides.restaurant_id AND user_id = auth.uid())
);
