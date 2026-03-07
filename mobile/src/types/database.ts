export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      automated_campaigns: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          message_template: string
          restaurant_id: string
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message_template: string
          restaurant_id: string
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message_template?: string
          restaurant_id?: string
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automated_campaigns_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      friends: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      guest_profiles: {
        Row: {
          created_at: string | null
          flag_reason: string | null
          global_dietary_preferences: string[] | null
          id: string
          internal_notes: string | null
          is_flagged: boolean | null
          last_visit_date: string | null
          marketing_opt_in: boolean | null
          restaurant_id: string
          tags: string[] | null
          total_spend: number | null
          updated_at: string | null
          user_id: string | null
          visit_count: number | null
        }
        Insert: {
          created_at?: string | null
          flag_reason?: string | null
          global_dietary_preferences?: string[] | null
          id?: string
          internal_notes?: string | null
          is_flagged?: boolean | null
          last_visit_date?: string | null
          marketing_opt_in?: boolean | null
          restaurant_id: string
          tags?: string[] | null
          total_spend?: number | null
          updated_at?: string | null
          user_id?: string | null
          visit_count?: number | null
        }
        Update: {
          created_at?: string | null
          flag_reason?: string | null
          global_dietary_preferences?: string[] | null
          id?: string
          internal_notes?: string | null
          is_flagged?: boolean | null
          last_visit_date?: string | null
          marketing_opt_in?: boolean | null
          restaurant_id?: string
          tags?: string[] | null
          total_spend?: number | null
          updated_at?: string | null
          user_id?: string | null
          visit_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "guest_profiles_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          restaurant_id: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          restaurant_id: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          restaurant_id?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          category_id: string
          created_at: string | null
          description: string | null
          dietary_tags: string[] | null
          id: string
          image_url: string | null
          is_available: boolean | null
          name: string
          price: number
          restaurant_id: string
          updated_at: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          description?: string | null
          dietary_tags?: string[] | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name: string
          price: number
          restaurant_id: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          description?: string | null
          dietary_tags?: string[] | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name?: string
          price?: number
          restaurant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          menu_item_id: string
          order_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          menu_item_id: string
          order_id: string
          quantity?: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          menu_item_id?: string
          order_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          id: string
          reservation_id: string | null
          restaurant_id: string
          special_instructions: string | null
          status: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          reservation_id?: string | null
          restaurant_id: string
          special_instructions?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          reservation_id?: string | null
          restaurant_id?: string
          special_instructions?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          reservation_id: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          reservation_id?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          reservation_id?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          phone: string | null
          push_token: string | null
          role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          push_token?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          push_token?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: []
      }
      reservations: {
        Row: {
          attendance_status: string | null
          created_at: string | null
          dietary_restrictions: string | null
          end_time: string
          guest_count: number
          guest_name: string | null
          guest_notes: string | null
          guest_phone: string | null
          id: string
          is_walk_in: boolean | null
          occasion: string | null
          order_id: string | null
          payment_intent_id: string | null
          reminder_sent_24h: boolean | null
          reminder_sent_2h: boolean | null
          reservation_time: string
          restaurant_id: string
          review_email_sent: boolean | null
          seating_preference: string | null
          status: Database["public"]["Enums"]["reservation_status"] | null
          table_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          attendance_status?: string | null
          created_at?: string | null
          dietary_restrictions?: string | null
          end_time: string
          guest_count: number
          guest_name?: string | null
          guest_notes?: string | null
          guest_phone?: string | null
          id?: string
          is_walk_in?: boolean | null
          occasion?: string | null
          order_id?: string | null
          payment_intent_id?: string | null
          reminder_sent_24h?: boolean | null
          reminder_sent_2h?: boolean | null
          reservation_time: string
          restaurant_id: string
          review_email_sent?: boolean | null
          seating_preference?: string | null
          status?: Database["public"]["Enums"]["reservation_status"] | null
          table_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          attendance_status?: string | null
          created_at?: string | null
          dietary_restrictions?: string | null
          end_time?: string
          guest_count?: number
          guest_name?: string | null
          guest_notes?: string | null
          guest_phone?: string | null
          id?: string
          is_walk_in?: boolean | null
          occasion?: string | null
          order_id?: string | null
          payment_intent_id?: string | null
          reminder_sent_24h?: boolean | null
          reminder_sent_2h?: boolean | null
          reservation_time?: string
          restaurant_id?: string
          review_email_sent?: boolean | null
          seating_preference?: string | null
          status?: Database["public"]["Enums"]["reservation_status"] | null
          table_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_owners: {
        Row: {
          profile_id: string
          restaurant_id: string
        }
        Insert: {
          profile_id: string
          restaurant_id: string
        }
        Update: {
          profile_id?: string
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_owners_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_owners_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          cancellation_policy: string | null
          city: string | null
          created_at: string | null
          cuisine_type: string | null
          description: string | null
          dress_code: string | null
          floor_plan_json: Json | null
          gallery_images: string[] | null
          id: string
          images: string[] | null
          is_open: boolean | null
          lat: number | null
          lng: number | null
          name: string
          owner_id: string | null
          preparation_time_minutes: number | null
          price_range: string | null
          slug: string
          sms_enabled: boolean | null
          turn_duration_minutes: number | null
          turn_times_config: Json | null
          updated_at: string | null
          vibe_tags: string[] | null
          video_url: string | null
        }
        Insert: {
          address?: string | null
          cancellation_policy?: string | null
          city?: string | null
          created_at?: string | null
          cuisine_type?: string | null
          description?: string | null
          dress_code?: string | null
          floor_plan_json?: Json | null
          gallery_images?: string[] | null
          id?: string
          images?: string[] | null
          is_open?: boolean | null
          lat?: number | null
          lng?: number | null
          name: string
          owner_id?: string | null
          preparation_time_minutes?: number | null
          price_range?: string | null
          slug: string
          sms_enabled?: boolean | null
          turn_duration_minutes?: number | null
          turn_times_config?: Json | null
          updated_at?: string | null
          vibe_tags?: string[] | null
          video_url?: string | null
        }
        Update: {
          address?: string | null
          cancellation_policy?: string | null
          city?: string | null
          created_at?: string | null
          cuisine_type?: string | null
          description?: string | null
          dress_code?: string | null
          floor_plan_json?: Json | null
          gallery_images?: string[] | null
          id?: string
          images?: string[] | null
          is_open?: boolean | null
          lat?: number | null
          lng?: number | null
          name?: string
          owner_id?: string | null
          preparation_time_minutes?: number | null
          price_range?: string | null
          slug?: string
          sms_enabled?: boolean | null
          turn_duration_minutes?: number | null
          turn_times_config?: Json | null
          updated_at?: string | null
          vibe_tags?: string[] | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          created_at: string
          guest_name: string
          id: string
          images: string[] | null
          rating: number
          restaurant_id: string
          review_text: string | null
          user_id: string | null
          visited_date: string | null
        }
        Insert: {
          created_at?: string
          guest_name?: string
          id?: string
          images?: string[] | null
          rating: number
          restaurant_id: string
          review_text?: string | null
          user_id?: string | null
          visited_date?: string | null
        }
        Update: {
          created_at?: string
          guest_name?: string
          id?: string
          images?: string[] | null
          rating?: number
          restaurant_id?: string
          review_text?: string | null
          user_id?: string | null
          visited_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_overrides: {
        Row: {
          created_at: string | null
          end_time: string | null
          id: string
          override_date: string
          reason: string | null
          restaurant_id: string
          start_time: string | null
          status: string | null
          table_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_time?: string | null
          id?: string
          override_date: string
          reason?: string | null
          restaurant_id: string
          start_time?: string | null
          status?: string | null
          table_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_time?: string | null
          id?: string
          override_date?: string
          reason?: string | null
          restaurant_id?: string
          start_time?: string | null
          status?: string | null
          table_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_overrides_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_overrides_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_messages: {
        Row: {
          content: string
          created_at: string | null
          direction: string
          guest_phone: string
          id: string
          restaurant_id: string
          status: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          direction: string
          guest_phone: string
          id?: string
          restaurant_id: string
          status?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          direction?: string
          guest_phone?: string
          id?: string
          restaurant_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_messages_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_roles: {
        Row: {
          created_at: string | null
          id: string
          restaurant_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          restaurant_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          restaurant_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_roles_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tables: {
        Row: {
          capacity: number
          height: number | null
          id: string
          location_type: string | null
          pos_table_id: string | null
          prepayment_amount: number | null
          requires_prepayment: boolean | null
          restaurant_id: string
          rotation: number
          rotation_deg: number | null
          shape: Database["public"]["Enums"]["table_shape"] | null
          table_number: string
          updated_at: string | null
          width: number | null
          x_coord: number | null
          y_coord: number | null
          zone_name: string | null
        }
        Insert: {
          capacity: number
          height?: number | null
          id?: string
          location_type?: string | null
          pos_table_id?: string | null
          prepayment_amount?: number | null
          requires_prepayment?: boolean | null
          restaurant_id: string
          rotation?: number
          rotation_deg?: number | null
          shape?: Database["public"]["Enums"]["table_shape"] | null
          table_number: string
          updated_at?: string | null
          width?: number | null
          x_coord?: number | null
          y_coord?: number | null
          zone_name?: string | null
        }
        Update: {
          capacity?: number
          height?: number | null
          id?: string
          location_type?: string | null
          pos_table_id?: string | null
          prepayment_amount?: number | null
          requires_prepayment?: boolean | null
          restaurant_id?: string
          rotation?: number
          rotation_deg?: number | null
          shape?: Database["public"]["Enums"]["table_shape"] | null
          table_number?: string
          updated_at?: string | null
          width?: number | null
          x_coord?: number | null
          y_coord?: number | null
          zone_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tables_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          dietary_restrictions: string[] | null
          dining_dna: Json | null
          email: string
          email_notifications: boolean | null
          full_name: string | null
          id: string
          is_penalized: boolean | null
          marketing_opt_in: boolean | null
          no_show_count: number | null
          penalty_until: string | null
          phone: string | null
          preferred_cuisines: string[] | null
          role: string
          sms_notifications: boolean | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          dietary_restrictions?: string[] | null
          dining_dna?: Json | null
          email: string
          email_notifications?: boolean | null
          full_name?: string | null
          id: string
          is_penalized?: boolean | null
          marketing_opt_in?: boolean | null
          no_show_count?: number | null
          penalty_until?: string | null
          phone?: string | null
          preferred_cuisines?: string[] | null
          role?: string
          sms_notifications?: boolean | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          dietary_restrictions?: string[] | null
          dining_dna?: Json | null
          email?: string
          email_notifications?: boolean | null
          full_name?: string | null
          id?: string
          is_penalized?: boolean | null
          marketing_opt_in?: boolean | null
          no_show_count?: number | null
          penalty_until?: string | null
          phone?: string | null
          preferred_cuisines?: string[] | null
          role?: string
          sms_notifications?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string | null
          expires_at: string | null
          guest_name: string | null
          guest_phone: string | null
          id: string
          offered_at: string | null
          party_size: number
          position: number
          quoted_wait_time: number | null
          requested_time: string
          restaurant_id: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          offered_at?: string | null
          party_size: number
          position?: number
          quoted_wait_time?: number | null
          requested_time: string
          restaurant_id: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          offered_at?: string | null
          party_size?: number
          position?: number
          quoted_wait_time?: number | null
          requested_time?: string
          restaurant_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_staff_member: {
        Args: { p_email: string; p_restaurant_id: string; p_role: string }
        Returns: Json
      }
      earth: { Args: never; Returns: number }
      get_restaurants_nearby: {
        Args: { radius_meters?: number; user_lat: number; user_lng: number }
        Returns: {
          address: string
          city: string
          created_at: string
          cuisine_type: string
          description: string
          distance_miles: number
          floor_plan_json: Json
          id: string
          images: string[]
          is_open: boolean
          lat: number
          lng: number
          name: string
          owner_id: string
          preparation_time_minutes: number
          price_range: string
          slug: string
          turn_duration_minutes: number
          updated_at: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_restaurant_owner: { Args: { rest_id: string }; Returns: boolean }
      is_restaurant_staff: { Args: { rest_id: string }; Returns: boolean }
    }
    Enums: {
      reservation_status:
      | "pending"
      | "confirmed"
      | "seated"
      | "completed"
      | "cancelled"
      | "no_show"
      table_shape: "square" | "round" | "rectangle"
      user_role: "admin" | "owner" | "customer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      reservation_status: [
        "pending",
        "confirmed",
        "seated",
        "completed",
        "cancelled",
        "no_show",
      ],
      table_shape: ["square", "round", "rectangle"],
      user_role: ["admin", "owner", "customer"],
    },
  },
} as const

export type Restaurant = Tables<'restaurants'>;
export type Reservation = Tables<'reservations'>;
export type Profile = Tables<'users'>;
export type Table = Tables<'tables'>;
export type FloorPlanSchema = any;
