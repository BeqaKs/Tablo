-- Migration for Superb UX Features

-- 1. Restaurants Table Additions
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS price_range integer CHECK (price_range BETWEEN 1 AND 4),
ADD COLUMN IF NOT EXISTS vibe_tags text[],
ADD COLUMN IF NOT EXISTS dress_code text,
ADD COLUMN IF NOT EXISTS cancellation_policy text,
ADD COLUMN IF NOT EXISTS gallery_images text[];

-- Provide default values for existing testing data if needed
UPDATE public.restaurants SET 
    price_range = 2,
    vibe_tags = ARRAY['Casual', 'Family Friendly', 'Lively'],
    dress_code = 'Casual. Come as you are!',
    cancellation_policy = 'Please cancel at least 24 hours in advance to avoid a €20 no-show fee.',
    gallery_images = ARRAY[
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=800&fit=crop',
        'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&h=800&fit=crop',
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=800&fit=crop'
    ]
WHERE price_range IS NULL;

-- 2. Bookings Table Additions
ALTER TABLE public.reservations
ADD COLUMN IF NOT EXISTS seating_preference text,
ADD COLUMN IF NOT EXISTS occasion text,
ADD COLUMN IF NOT EXISTS dietary_restrictions text;

-- 3. Guest Profiles Additions
ALTER TABLE public.guest_profiles
ADD COLUMN IF NOT EXISTS global_dietary_preferences text[];
