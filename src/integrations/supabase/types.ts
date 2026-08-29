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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      consumable_costs: {
        Row: {
          key: string
          label: string
          unit: string
          unit_cost: number
          updated_at: string
        }
        Insert: {
          key: string
          label: string
          unit?: string
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          key?: string
          label?: string
          unit?: string
          unit_cost?: number
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string | null
          phone: string | null
          source: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          source?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          source?: string
        }
        Relationships: []
      }
      delivery_mileage: {
        Row: {
          arrival_address: string
          computed_at: string | null
          cost_euros: number | null
          created_at: string
          departure_address: string
          distance_km_one_way: number | null
          distance_km_round_trip: number | null
          duration_min: number | null
          error_message: string | null
          id: string
          order_id: string
          rate_per_km: number
          status: string
          updated_at: string
        }
        Insert: {
          arrival_address: string
          computed_at?: string | null
          cost_euros?: number | null
          created_at?: string
          departure_address: string
          distance_km_one_way?: number | null
          distance_km_round_trip?: number | null
          duration_min?: number | null
          error_message?: string | null
          id?: string
          order_id: string
          rate_per_km?: number
          status?: string
          updated_at?: string
        }
        Update: {
          arrival_address?: string
          computed_at?: string | null
          cost_euros?: number | null
          created_at?: string
          departure_address?: string
          distance_km_one_way?: number | null
          distance_km_round_trip?: number | null
          duration_min?: number | null
          error_message?: string | null
          id?: string
          order_id?: string
          rate_per_km?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_mileage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
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
      fixed_costs_settings: {
        Row: {
          colissimo_domicile: number
          colissimo_relais: number
          essence_per_km: number
          id: number
          updated_at: string
          viva_commission_pct: number
        }
        Insert: {
          colissimo_domicile?: number
          colissimo_relais?: number
          essence_per_km?: number
          id?: number
          updated_at?: string
          viva_commission_pct?: number
        }
        Update: {
          colissimo_domicile?: number
          colissimo_relais?: number
          essence_per_km?: number
          id?: number
          updated_at?: string
          viva_commission_pct?: number
        }
        Relationships: []
      }
      ip_rate_limits: {
        Row: {
          bucket: string
          created_at: string
          id: number
          ip: string
        }
        Insert: {
          bucket: string
          created_at?: string
          id?: number
          ip: string
        }
        Update: {
          bucket?: string
          created_at?: string
          id?: number
          ip?: string
        }
        Relationships: []
      }
      mileage_settings: {
        Row: {
          id: number
          rate_per_km: number
          updated_at: string
        }
        Insert: {
          id?: number
          rate_per_km?: number
          updated_at?: string
        }
        Update: {
          id?: number
          rate_per_km?: number
          updated_at?: string
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
          abandoned_email_24h_sent_at: string | null
          abandoned_email_2h_sent_at: string | null
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
          order_channel: string
          order_number: number
          payment_method: string
          payment_status: string
          promo_code: string | null
          promo_discount_amount: number | null
          promo_discount_percent: number | null
          relay_point_address: string | null
          relay_point_id: string | null
          relay_point_name: string | null
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
          abandoned_email_24h_sent_at?: string | null
          abandoned_email_2h_sent_at?: string | null
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
          order_channel?: string
          order_number?: number
          payment_method?: string
          payment_status?: string
          promo_code?: string | null
          promo_discount_amount?: number | null
          promo_discount_percent?: number | null
          relay_point_address?: string | null
          relay_point_id?: string | null
          relay_point_name?: string | null
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
          abandoned_email_24h_sent_at?: string | null
          abandoned_email_2h_sent_at?: string | null
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
          order_channel?: string
          order_number?: number
          payment_method?: string
          payment_status?: string
          promo_code?: string | null
          promo_discount_amount?: number | null
          promo_discount_percent?: number | null
          relay_point_address?: string | null
          relay_point_id?: string | null
          relay_point_name?: string | null
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
      pro_deposits: {
        Row: {
          created_at: string
          id: string
          invoice_id: string | null
          notes: string | null
          partner_id: string
          product_id: string | null
          product_name: string
          quantity: number
          retail_price_ttc: number
          sold_at: string
          updated_at: string
          weight_grams: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          partner_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          retail_price_ttc: number
          sold_at?: string
          updated_at?: string
          weight_grams?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          partner_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          retail_price_ttc?: number
          sold_at?: string
          updated_at?: string
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pro_deposits_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "pro_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pro_deposits_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "pro_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      pro_invoices: {
        Row: {
          commission_percent: number
          created_at: string
          due_date: string | null
          id: string
          invoice_number: string | null
          issued_at: string
          notes: string | null
          paid_at: string | null
          partner_id: string
          pdf_path: string | null
          status: string
          total_invoiced_ht: number
          total_invoiced_ttc: number
          total_retail_ttc: number
          total_vat: number
          updated_at: string
        }
        Insert: {
          commission_percent?: number
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issued_at?: string
          notes?: string | null
          paid_at?: string | null
          partner_id: string
          pdf_path?: string | null
          status?: string
          total_invoiced_ht?: number
          total_invoiced_ttc?: number
          total_retail_ttc?: number
          total_vat?: number
          updated_at?: string
        }
        Update: {
          commission_percent?: number
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issued_at?: string
          notes?: string | null
          paid_at?: string | null
          partner_id?: string
          pdf_path?: string | null
          status?: string
          total_invoiced_ht?: number
          total_invoiced_ttc?: number
          total_retail_ttc?: number
          total_vat?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pro_invoices_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "pro_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      pro_partners: {
        Row: {
          address_line1: string | null
          city: string | null
          commission_percent: number
          country: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          siret: string | null
          updated_at: string
          vat_number: string | null
        }
        Insert: {
          address_line1?: string | null
          city?: string | null
          commission_percent?: number
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          siret?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Update: {
          address_line1?: string | null
          city?: string | null
          commission_percent?: number
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          siret?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Relationships: []
      }
      pro_price_tiers: {
        Row: {
          gamme: string
          id: string
          price_per_gram: number
          tier_max_g: number
          updated_at: string
        }
        Insert: {
          gamme: string
          id?: string
          price_per_gram: number
          tier_max_g: number
          updated_at?: string
        }
        Update: {
          gamme?: string
          id?: string
          price_per_gram?: number
          tier_max_g?: number
          updated_at?: string
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
      pro_quotes: {
        Row: {
          admin_notes: string | null
          company_name: string | null
          contact_email: string | null
          created_at: string
          expires_at: string | null
          id: string
          items: Json
          notes: string | null
          status: string
          total_ht: number
          total_ttc: number
          total_weight_g: number
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          company_name?: string | null
          contact_email?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          items?: Json
          notes?: string | null
          status?: string
          total_ht?: number
          total_ttc?: number
          total_weight_g?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          company_name?: string | null
          contact_email?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          items?: Json
          notes?: string | null
          status?: string
          total_ht?: number
          total_ttc?: number
          total_weight_g?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pro_settings: {
        Row: {
          delai_paiement_jours: number
          franco_port_seuil_ht: number
          id: number
          updated_at: string
        }
        Insert: {
          delai_paiement_jours?: number
          franco_port_seuil_ht?: number
          id?: number
          updated_at?: string
        }
        Update: {
          delai_paiement_jours?: number
          franco_port_seuil_ht?: number
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      product_costs: {
        Row: {
          cost_per_gram: number
          product_id: string
          updated_at: string
        }
        Insert: {
          cost_per_gram?: number
          product_id: string
          updated_at?: string
        }
        Update: {
          cost_per_gram?: number
          product_id?: string
          updated_at?: string
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
          badge: string | null
          category: string
          cbd_percentage: string | null
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string | null
          intention_match: string[]
          is_active: boolean
          is_force_noire: boolean
          is_nectar_divin: boolean
          mood: string | null
          name: string
          price: number
          price_group: string
          subtitle: string | null
          taste_match: string[]
          terpenes: Json
          updated_at: string
        }
        Insert: {
          badge?: string | null
          category: string
          cbd_percentage?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id: string
          image_url?: string | null
          intention_match?: string[]
          is_active?: boolean
          is_force_noire?: boolean
          is_nectar_divin?: boolean
          mood?: string | null
          name: string
          price: number
          price_group?: string
          subtitle?: string | null
          taste_match?: string[]
          terpenes?: Json
          updated_at?: string
        }
        Update: {
          badge?: string | null
          category?: string
          cbd_percentage?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          intention_match?: string[]
          is_active?: boolean
          is_force_noire?: boolean
          is_nectar_divin?: boolean
          mood?: string | null
          name?: string
          price?: number
          price_group?: string
          subtitle?: string | null
          taste_match?: string[]
          terpenes?: Json
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
      promo_codes: {
        Row: {
          code: string
          created_at: string
          current_uses: number
          discount_percent: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number
          discount_percent: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number
          discount_percent?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
        }
        Relationships: []
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
      cleanup_abandoned_orders: { Args: never; Returns: number }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
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
      is_admin: { Args: never; Returns: boolean }
      is_pro: { Args: never; Returns: boolean }
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
      validate_promo_code: {
        Args: { p_code: string; p_user_id?: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "user" | "pro" | "admin" | "commercial"
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
      app_role: ["user", "pro", "admin", "commercial"],
    },
  },
} as const
