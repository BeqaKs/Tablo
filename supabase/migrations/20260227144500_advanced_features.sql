-- Yield Management
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS turn_times_config JSONB DEFAULT '{"1": 90, "2": 90, "3": 120, "4": 120, "5": 150, "6": 150, "7": 180, "8": 180, "9": 180, "10": 180}'::jsonb;

-- Advanced CRM
ALTER TABLE public.guest_profiles
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS total_spend DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS visit_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_visit_date TIMESTAMPTZ;

-- Waitlist AI
ALTER TABLE public.waitlist
  ADD COLUMN IF NOT EXISTS quoted_wait_time INTEGER;

-- Marketing Opt In for Users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN DEFAULT true;

-- Marketing Opt In for Guests
ALTER TABLE public.guest_profiles
  ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN DEFAULT true;

-- Automated Campaigns
CREATE TABLE IF NOT EXISTS public.automated_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('lapsed_customer', 'birthday', 'post_dining')),
  message_template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Two-Way SMS
CREATE TABLE IF NOT EXISTS public.sms_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  guest_phone TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'received')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_automated_campaigns_restaurant ON public.automated_campaigns(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_restaurant_phone ON public.sms_messages(restaurant_id, guest_phone);
CREATE INDEX IF NOT EXISTS idx_sms_messages_created_at ON public.sms_messages(created_at);

-- RLS Policies For New Tables
ALTER TABLE public.automated_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can manage their campaigns" ON public.automated_campaigns FOR ALL
  USING (EXISTS (SELECT 1 FROM public.restaurants WHERE id = automated_campaigns.restaurant_id AND owner_id = auth.uid()));

ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can manage their sms messages" ON public.sms_messages FOR ALL
  USING (EXISTS (SELECT 1 FROM public.restaurants WHERE id = sms_messages.restaurant_id AND owner_id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_automated_campaigns_updated_at BEFORE UPDATE ON public.automated_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
