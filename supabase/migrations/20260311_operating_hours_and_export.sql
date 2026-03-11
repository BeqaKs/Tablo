-- ============================================================
-- Operating Hours, Booking Rules & Export Enhancements
-- ============================================================

-- Operating hours: per-day open/close times
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS operating_hours JSONB DEFAULT '{
    "mon": {"open": "10:00", "close": "23:00", "is_closed": false},
    "tue": {"open": "10:00", "close": "23:00", "is_closed": false},
    "wed": {"open": "10:00", "close": "23:00", "is_closed": false},
    "thu": {"open": "10:00", "close": "23:00", "is_closed": false},
    "fri": {"open": "10:00", "close": "00:00", "is_closed": false},
    "sat": {"open": "10:00", "close": "00:00", "is_closed": false},
    "sun": {"open": "12:00", "close": "22:00", "is_closed": false}
  }'::jsonb;

-- Booking rules
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS booking_rules JSONB DEFAULT '{
    "max_party_size": 20,
    "max_advance_days": 90,
    "min_lead_time_hours": 2,
    "buffer_minutes": 15,
    "auto_confirm": false
  }'::jsonb;
