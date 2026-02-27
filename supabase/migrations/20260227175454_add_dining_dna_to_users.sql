ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS dining_dna jsonb DEFAULT '{}'::jsonb;