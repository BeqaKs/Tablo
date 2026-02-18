// types/database.ts

export type UserRole = 'admin' | 'owner' | 'customer';
export type ReservationStatus = 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
export type TableShape = 'square' | 'round' | 'rectangle';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
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
  preparation_time_minutes: number; // Buffer time between reservations
  is_open: boolean; // Service status toggle
  images: string[];
  floor_plan_json: FloorPlanSchema | null;
}

export interface Table {
  id: string;
  restaurant_id: string;
  table_number: string;
  capacity: number;
  shape: TableShape;
  x_coord: number;
  y_coord: number;
  rotation: number; // degrees: 0, 90, 180, 270
  zone_name: string;
  pos_table_id?: string; // For Fina.ge POS integration
  width?: number; // For rectangle tables
  height?: number; // For rectangle tables
}

export interface Reservation {
  id: string;
  restaurant_id: string;
  user_id?: string;
  table_id?: string;
  guest_count: number;
  reservation_time: string; // ISO String
  end_time: string; // ISO String
  status: ReservationStatus;
  guest_name?: string;
  guest_phone?: string;
  guest_notes?: string;
}

// Floor Plan Schema
export interface FloorPlanSchema {
  version: string;
  canvasWidth: number;
  canvasHeight: number;
  gridSize: number;
  zones: Zone[];
}

export interface Zone {
  id: string;
  name: string;
  color: string;
  tables: string[]; // table IDs
}