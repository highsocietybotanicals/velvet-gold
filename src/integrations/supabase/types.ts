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
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          product_id: string
          product_name: string
          product_type: string
          quantity: number | null
          total_price: number
          unit_price: number
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          product_id: string
          product_name: string
          product_type: string
          quantity?: number | null
          total_price: number
          unit_price: number
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          product_type?: string
          quantity?: number | null
          total_price?: number
          unit_price?: number
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_status: string
          old_status: string | null
          order_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status: string
          old_status?: string | null
          order_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: string
          old_status?: string | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          contact_phone: string | null
          created_at: string | null
          delivery_address: string | null
          delivery_date: string | null
          delivery_time: string | null
          delivery_type: string
          display_order_number: string | null
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          id: string
          order_number: number
          payment_status: string
          status: string
          total_amount: number
          total_flower_weight: number
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string | null
          user_id: string | null
          viva_order_code: string | null
        }
        Insert: {
          contact_phone?: string | null
          created_at?: string | null
          delivery_address?: string | null
          delivery_date?: string | null
          delivery_time?: string | null
          delivery_type: string
          display_order_number?: string | null
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          order_number?: number
          payment_status?: string
          status?: string
          total_amount: number
          total_flower_weight?: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
          user_id?: string | null
          viva_order_code?: string | null
        }
        Update: {
          contact_phone?: string | null
          created_at?: string | null
          delivery_address?: string | null
          delivery_date?: string | null
          delivery_time?: string | null
          delivery_type?: string
          display_order_number?: string | null
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          order_number?: number
          payment_status?: string
          status?: string
          total_amount?: number
          total_flower_weight?: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
          user_id?: string | null
          viva_order_code?: string | null
        }
        Relationships: []
      }
      pro_prices: {
        Row: {
          created_at: string | null
          id: string
          pro_price: number
          product_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          pro_price: number
          product_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          pro_price?: number
          product_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      product_reviews: {
        Row: {
          author_name: string
          comment: string
          created_at: string | null
          id: string
          order_id: string | null
          product_id: string
          rating: number
          status: string
          user_id: string | null
        }
        Insert: {
          author_name: string
          comment: string
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_id: string
          rating?: number
          status?: string
          user_id?: string | null
        }
        Update: {
          author_name?: string
          comment?: string
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string
          rating?: number
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          price: number
          pro_price: number | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id: string
          is_active?: boolean
          name: string
          price: number
          pro_price?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          pro_price?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          company_name: string | null
          created_at: string | null
          email: string
          free_grams_available: number | null
          full_name: string | null
          id: string
          is_pro_validated: boolean | null
          is_vat_validated: boolean
          phone: string | null
          postal_code: string | null
          qualifying_orders_count: number | null
          siret: string | null
          updated_at: string | null
          vat_number: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string | null
          email: string
          free_grams_available?: number | null
          full_name?: string | null
          id: string
          is_pro_validated?: boolean | null
          is_vat_validated?: boolean
          phone?: string | null
          postal_code?: string | null
          qualifying_orders_count?: number | null
          siret?: string | null
          updated_at?: string | null
          vat_number?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string
          free_grams_available?: number | null
          full_name?: string | null
          id?: string
          is_pro_validated?: boolean | null
          is_vat_validated?: boolean
          phone?: string | null
          postal_code?: string | null
          qualifying_orders_count?: number | null
          siret?: string | null
          updated_at?: string | null
          vat_number?: string | null
        }
        Relationships: []
      }
      promo_code_usage: {
        Row: {
          code: string
          created_at: string
          discount_amount: number
          discount_percent: number
          id: string
          order_id: string | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          discount_amount?: number
          discount_percent: number
          id?: string
          order_id?: string | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          discount_amount?: number
          discount_percent?: number
          id?: string
          order_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string | null
          post_type: string | null
          product_id: string | null
          published_at: string | null
          published_to: string[] | null
          series_id: string | null
          series_position: number | null
          status: string
          theme: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          post_type?: string | null
          product_id?: string | null
          published_at?: string | null
          published_to?: string[] | null
          series_id?: string | null
          series_position?: number | null
          status?: string
          theme?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          post_type?: string | null
          product_id?: string | null
          published_at?: string | null
          published_to?: string[] | null
          series_id?: string | null
          series_position?: number | null
          status?: string
          theme?: string | null
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_pro: { Args: { _user_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "user" | "pro" | "admin"
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
      app_role: ["user", "pro", "admin"],
    },
  },
} as const
