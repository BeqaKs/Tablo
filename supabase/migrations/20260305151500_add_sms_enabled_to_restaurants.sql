ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN DEFAULT false;
