-- Function to securely look up users by email and add them as staff
-- This runs with elevated privileges (SECURITY DEFINER) but explicitly checks authorization first
CREATE OR REPLACE FUNCTION public.add_staff_member(
    p_restaurant_id UUID,
    p_email TEXT,
    p_role TEXT
) RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_owner_id UUID;
BEGIN
    -- Check if caller is the owner of the restaurant
    SELECT owner_id INTO v_owner_id FROM public.restaurants WHERE id = p_restaurant_id;
    
    IF v_owner_id IS NULL OR v_owner_id != auth.uid() THEN
        RETURN jsonb_build_object('error', 'Not authorized -> Only the owner can add staff');
    END IF;

    -- Validate role
    IF p_role NOT IN ('manager', 'host') THEN
        RETURN jsonb_build_object('error', 'Invalid role. Must be manager or host.');
    END IF;

    -- Find the user by email
    SELECT id INTO v_user_id FROM public.users WHERE email = p_email;

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('error', 'User with this email not found. They must sign up first.');
    END IF;

    -- Check if they are already staff
    IF EXISTS (SELECT 1 FROM public.staff_roles WHERE restaurant_id = p_restaurant_id AND user_id = v_user_id) THEN
        -- Update role instead
        UPDATE public.staff_roles SET role = p_role WHERE restaurant_id = p_restaurant_id AND user_id = v_user_id;
        RETURN jsonb_build_object('success', true, 'message', 'Staff role updated');
    END IF;

    -- Insert new staff role
    INSERT INTO public.staff_roles (restaurant_id, user_id, role)
    VALUES (p_restaurant_id, v_user_id, p_role);

    RETURN jsonb_build_object('success', true, 'message', 'Staff member added successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
