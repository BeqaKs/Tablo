-- Fix infinite recursion in RLS policies by using SECURITY DEFINER functions

CREATE OR REPLACE FUNCTION public.is_restaurant_owner(rest_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE id = rest_id AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_restaurant_staff(rest_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.staff_roles
    WHERE restaurant_id = rest_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update restaurants policy
DROP POLICY IF EXISTS "Owners and Staff can view restaurant" ON public.restaurants;
CREATE POLICY "Owners and Staff can view restaurant"
ON public.restaurants FOR SELECT
USING (
    auth.uid() = owner_id OR 
    public.is_restaurant_staff(id)
);

-- Restore INSERT policy for owners
DROP POLICY IF EXISTS "Owners can insert restaurant" ON public.restaurants;
CREATE POLICY "Owners can insert restaurant"
ON public.restaurants FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- Update staff_roles policy
DROP POLICY IF EXISTS "Owners can manage staff roles" ON public.staff_roles;
CREATE POLICY "Owners can manage staff roles"
ON public.staff_roles FOR ALL 
USING (
    public.is_restaurant_owner(restaurant_id)
);

-- Update tables policy
DROP POLICY IF EXISTS "Owners and Staff can manage tables" ON public.tables;
CREATE POLICY "Owners and Staff can manage tables"
ON public.tables FOR ALL
USING (
    public.is_restaurant_owner(restaurant_id) OR
    public.is_restaurant_staff(restaurant_id)
);

-- Update reservations policy
DROP POLICY IF EXISTS "Owners and Staff can view reservations" ON public.reservations;
CREATE POLICY "Owners and Staff can view reservations"
ON public.reservations FOR SELECT
USING (
    public.is_restaurant_owner(restaurant_id) OR
    public.is_restaurant_staff(restaurant_id)
);

DROP POLICY IF EXISTS "Owners and Staff can update reservations" ON public.reservations;
CREATE POLICY "Owners and Staff can update reservations"
ON public.reservations FOR UPDATE
USING (
    public.is_restaurant_owner(restaurant_id) OR
    public.is_restaurant_staff(restaurant_id)
);

-- Update waitlist policy
DROP POLICY IF EXISTS "Owners and Staff can view waitlist" ON public.waitlist;
CREATE POLICY "Owners and Staff can view waitlist"
ON public.waitlist FOR SELECT
USING (
    public.is_restaurant_owner(restaurant_id) OR
    public.is_restaurant_staff(restaurant_id)
);

DROP POLICY IF EXISTS "Owners and Staff can manage waitlist" ON public.waitlist;
CREATE POLICY "Owners and Staff can manage waitlist"
ON public.waitlist FOR ALL
USING (
    public.is_restaurant_owner(restaurant_id) OR
    public.is_restaurant_staff(restaurant_id)
);

-- Update guest profiles policy
DROP POLICY IF EXISTS "Owners and Staff can manage guest profiles" ON public.guest_profiles;
CREATE POLICY "Owners and Staff can manage guest profiles"
ON public.guest_profiles FOR ALL
USING (
    public.is_restaurant_owner(restaurant_id) OR
    public.is_restaurant_staff(restaurant_id)
);

-- Update schedule overrides policy
DROP POLICY IF EXISTS "Owners and Staff can manage schedule overrides" ON public.schedule_overrides;
CREATE POLICY "Owners and Staff can manage schedule overrides"
ON public.schedule_overrides FOR ALL
USING (
    public.is_restaurant_owner(restaurant_id) OR
    public.is_restaurant_staff(restaurant_id)
);
