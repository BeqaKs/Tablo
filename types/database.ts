// types/database.ts

export type UserRole = 'admin' | 'owner' | 'customer';
export type ReservationStatus = 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
export type AttendanceStatus = 'pending' | 'arrived' | 'cancelled' | 'no_show';
export type TableShape = 'square' | 'round' | 'rectangle';
export type LocationType = 'indoor' | 'patio' | 'bar' | 'dining_room' | 'private' | 'rooftop';
export type OrderStatus = 'draft' | 'submitted' | 'preparing' | 'completed' | 'cancelled';
export type WaitlistStatus = 'waiting' | 'offered' | 'claimed' | 'expired' | 'cancelled';
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';
export type FlagReason = 'rude' | 'serial_canceler' | 'disruptive' | 'other';
export type OverrideStatus = 'blocked' | 'available';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  dietary_restrictions: string[];
  preferred_cuisines: string[];
  email_notifications: boolean;
  sms_notifications: boolean;
  no_show_count: number;
  is_penalized: boolean;
  penalty_until: string | null;
  marketing_opt_in: boolean;
  global_dietary_preferences?: string[];
  created_at: string;
  updated_at: string;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  city: string;
  cuisine_type: string;
  price_range: '$' | '$$' | '$$$' | '$$$$';
  turn_duration_minutes: number;
  preparation_time_minutes: number;
  is_open: boolean;
  images: string[];
  floor_plan_json: FloorPlanSchema | null;
  rating?: number;
  review_count?: number;
  lat?: number;
  lng?: number;
  owner_id?: string;
  turn_times_config?: Record<string, number>;
  vibe_tags?: string[];
  dress_code?: string;
  cancellation_policy?: string;
  gallery_images?: string[];
  // Computed field from geo queries
  distance_miles?: number;
}

export interface Table {
  id: string;
  restaurant_id: string;
  table_number: string;
  capacity: number;
  shape: TableShape;
  x_coord: number;
  y_coord: number;
  rotation: number;
  zone_name: string;
  pos_table_id?: string;
  width?: number;
  height?: number;
  location_type: LocationType;
  requires_prepayment: boolean;
  prepayment_amount?: number;
}

export interface Reservation {
  id: string;
  restaurant_id: string;
  user_id?: string;
  table_id?: string;
  guest_count: number;
  reservation_time: string;
  end_time: string;
  status: ReservationStatus;
  guest_name?: string;
  guest_phone?: string;
  guest_notes?: string;
  attendance_status: AttendanceStatus;
  reminder_sent_24h: boolean;
  reminder_sent_2h: boolean;
  payment_intent_id?: string;
  is_walk_in: boolean;
  order_id?: string;
  seating_preference?: string;
  occasion?: string;
  dietary_restrictions?: string;
  created_at?: string;
  updated_at?: string;
}

// Floor Plan Schema
export interface FloorPlanSchema {
  version: string;
  canvasWidth: number;
  canvasHeight: number;
  gridSize: number;
  backgroundImage?: string | null;
  zones: Zone[];
}

export interface Zone {
  id: string;
  name: string;
  color: string;
  tables: string[];
}

// ========================
// Menu System
// ========================

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
  // Joined
  menu_items?: MenuItem[];
}

export interface MenuItem {
  id: string;
  category_id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  dietary_tags: string[];
  is_available: boolean;
  created_at?: string;
  updated_at?: string;
}

// ========================
// Orders
// ========================

export interface Order {
  id: string;
  reservation_id: string | null;
  restaurant_id: string;
  special_instructions: string | null;
  total_amount: number;
  status: OrderStatus;
  created_at?: string;
  updated_at?: string;
  // Joined
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  created_at?: string;
  // Joined
  menu_item?: MenuItem;
}

// ========================
// Waitlist
// ========================

export interface WaitlistEntry {
  id: string;
  user_id: string | null;
  restaurant_id: string;
  party_size: number;
  requested_time: string;
  position: number;
  status: WaitlistStatus;
  offered_at: string | null;
  expires_at: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  quoted_wait_time?: number | null;
  created_at?: string;
  updated_at?: string;
  // Joined
  restaurants?: Restaurant;
}

// ========================
// Guest Profiles
// ========================

export interface GuestProfile {
  id: string;
  user_id: string | null;
  restaurant_id: string;
  internal_notes: string | null;
  is_flagged: boolean;
  flag_reason: FlagReason | null;
  tags: string[];
  total_spend: number;
  visit_count: number;
  last_visit_date: string | null;
  marketing_opt_in: boolean;
  created_at?: string;
  updated_at?: string;
}

// ========================
// Schedule Overrides
// ========================

export interface ScheduleOverride {
  id: string;
  restaurant_id: string;
  table_id: string | null;
  override_date: string;
  start_time: string | null;
  end_time: string | null;
  status: OverrideStatus;
  reason: string | null;
  created_at?: string;
  updated_at?: string;
}

// ========================
// Payments
// ========================

export interface Payment {
  id: string;
  reservation_id: string | null;
  stripe_payment_intent_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  created_at?: string;
  updated_at?: string;
}

// ========================
// Automated Marketing
// ========================

export type CampaignTrigger = 'lapsed_customer' | 'birthday' | 'post_dining';

export interface AutomatedCampaign {
  id: string;
  restaurant_id: string;
  trigger_type: CampaignTrigger;
  message_template: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// ========================
// Two-Way SMS
// ========================

export type SMSSourceDirection = 'inbound' | 'outbound';
export type SMSStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'received';

export interface SMSMessage {
  id: string;
  restaurant_id: string;
  guest_phone: string;
  direction: SMSSourceDirection;
  content: string;
  status: SMSStatus;
  created_at?: string;
}