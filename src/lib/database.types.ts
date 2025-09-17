export type Database = {
  public: {
    Tables: {
      candidates: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          notes: string | null
          customer_since: string | null
          total_orders: number
          total_spent: number
          lifetime_value: number
          marketing_consent: boolean
          communication_preferences: any
          customer_segment: string | null
          last_order_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          notes?: string | null
          customer_since?: string | null
          total_orders?: number
          total_spent?: number
          lifetime_value?: number
          marketing_consent?: boolean
          communication_preferences?: any
          customer_segment?: string | null
          last_order_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          notes?: string | null
          customer_since?: string | null
          total_orders?: number
          total_spent?: number
          lifetime_value?: number
          marketing_consent?: boolean
          communication_preferences?: any
          customer_segment?: string | null
          last_order_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      course_templates: {
        Row: {
          id: string
          wset_level: number
          name: string
          description: string | null
          duration_weeks: number
          max_capacity: number
          price: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wset_level: number
          name: string
          description?: string | null
          duration_weeks?: number
          max_capacity?: number
          price?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          wset_level?: number
          name?: string
          description?: string | null
          duration_weeks?: number
          max_capacity?: number
          price?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          id: string
          name: string
          wset_level: number
          description: string | null
          duration_weeks: number
          price: number | null
          max_capacity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          wset_level: number
          description?: string | null
          duration_weeks?: number
          price?: number | null
          max_capacity?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          wset_level?: number
          description?: string | null
          duration_weeks?: number
          price?: number | null
          max_capacity?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversion_events: {
        Row: {
          id: string
          event_type: string
          session_id: string | null
          user_id: string | null
          course_session_id: string | null
          order_id: string | null
          product_id: string | null
          event_value: number | null
          metadata: any
          created_at: string
        }
        Insert: {
          id?: string
          event_type: string
          session_id?: string | null
          user_id?: string | null
          course_session_id?: string | null
          order_id?: string | null
          product_id?: string | null
          event_value?: number | null
          metadata?: any
          created_at?: string
        }
        Update: {
          id?: string
          event_type?: string
          session_id?: string | null
          user_id?: string | null
          course_session_id?: string | null
          order_id?: string | null
          product_id?: string | null
          event_value?: number | null
          metadata?: any
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversion_events_course_session_id_fkey"
            columns: ["course_session_id"]
            isOneToOne: false
            referencedRelation: "course_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversion_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversion_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      course_sessions: {
        Row: {
          id: string
          course_id: string
          start_date: string
          end_date: string
          instructor: string | null
          location: string | null
          status: 'scheduled' | 'active' | 'completed' | 'cancelled'
          current_enrollment: number | null
          product_id: string | null
          base_price: number | null
          early_bird_price: number | null
          early_bird_deadline: string | null
          stripe_price_id: string | null
          available_spots: number | null
          registration_deadline: string | null
          booking_enabled: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          start_date: string
          end_date: string
          instructor?: string | null
          location?: string | null
          status?: 'scheduled' | 'active' | 'completed' | 'cancelled'
          current_enrollment?: number | null
          product_id?: string | null
          base_price?: number | null
          early_bird_price?: number | null
          early_bird_deadline?: string | null
          stripe_price_id?: string | null
          available_spots?: number | null
          registration_deadline?: string | null
          booking_enabled?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          start_date?: string
          end_date?: string
          instructor?: string | null
          location?: string | null
          status?: 'scheduled' | 'active' | 'completed' | 'cancelled'
          current_enrollment?: number | null
          product_id?: string | null
          base_price?: number | null
          early_bird_price?: number | null
          early_bird_deadline?: string | null
          stripe_price_id?: string | null
          available_spots?: number | null
          registration_deadline?: string | null
          booking_enabled?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_sessions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      discount_codes: {
        Row: {
          id: string
          code: string
          name: string | null
          description: string | null
          type: 'percentage' | 'fixed_amount' | 'free_shipping'
          value: number
          minimum_order_amount: number | null
          maximum_discount_amount: number | null
          usage_limit: number | null
          usage_limit_per_customer: number | null
          usage_count: number
          applicable_product_ids: string[] | null
          applicable_course_levels: number[] | null
          starts_at: string | null
          expires_at: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name?: string | null
          description?: string | null
          type: 'percentage' | 'fixed_amount' | 'free_shipping'
          value: number
          minimum_order_amount?: number | null
          maximum_discount_amount?: number | null
          usage_limit?: number | null
          usage_limit_per_customer?: number | null
          usage_count?: number
          applicable_product_ids?: string[] | null
          applicable_course_levels?: number[] | null
          starts_at?: string | null
          expires_at?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string | null
          description?: string | null
          type?: 'percentage' | 'fixed_amount' | 'free_shipping'
          value?: number
          minimum_order_amount?: number | null
          maximum_discount_amount?: number | null
          usage_limit?: number | null
          usage_limit_per_customer?: number | null
          usage_count?: number
          applicable_product_ids?: string[] | null
          applicable_course_levels?: number[] | null
          starts_at?: string | null
          expires_at?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      discount_usage: {
        Row: {
          id: string
          discount_code_id: string
          order_id: string
          customer_email: string
          discount_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          discount_code_id: string
          order_id: string
          customer_email: string
          discount_amount: number
          created_at?: string
        }
        Update: {
          id?: string
          discount_code_id?: string
          order_id?: string
          customer_email?: string
          discount_amount?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_usage_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          }
        ]
      }
      enrollments: {
        Row: {
          id: string
          candidate_id: string
          course_session_id: string
          enrollment_date: string
          payment_status: 'pending' | 'paid' | 'refunded'
          status: 'enrolled' | 'completed' | 'dropped'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          candidate_id: string
          course_session_id: string
          enrollment_date?: string
          payment_status?: 'pending' | 'paid' | 'refunded'
          status?: 'enrolled' | 'completed' | 'dropped'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          candidate_id?: string
          course_session_id?: string
          enrollment_date?: string
          payment_status?: 'pending' | 'paid' | 'refunded'
          status?: 'enrolled' | 'completed' | 'dropped'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_course_session_id_fkey"
            columns: ["course_session_id"]
            isOneToOne: false
            referencedRelation: "course_sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      exams: {
        Row: {
          id: string
          course_id: string
          exam_date: string
          exam_type: 'theory' | 'tasting' | 'practical'
          location: string
          max_candidates: number
          current_registrations: number | null
          instructions: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          exam_date: string
          exam_type: 'theory' | 'tasting' | 'practical'
          location: string
          max_candidates?: number
          current_registrations?: number | null
          instructions?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          exam_date?: string
          exam_type?: 'theory' | 'tasting' | 'practical'
          location?: string
          max_candidates?: number
          current_registrations?: number | null
          instructions?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          }
        ]
      }
      exam_results: {
        Row: {
          id: string
          candidate_id: string
          exam_id: string
          score: number | null
          pass_status: boolean | null
          certification_issued: boolean | null
          certificate_number: string | null
          result_date: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          candidate_id: string
          exam_id: string
          score?: number | null
          pass_status?: boolean | null
          certification_issued?: boolean | null
          certificate_number?: string | null
          result_date?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          candidate_id?: string
          exam_id?: string
          score?: number | null
          pass_status?: boolean | null
          certification_issued?: boolean | null
          certificate_number?: string | null
          result_date?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_results_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          }
        ]
      }
      media_assets: {
        Row: {
          id: string
          filename: string
          original_filename: string
          mime_type: string
          file_size: number | null
          width: number | null
          height: number | null
          alt_text: string | null
          url: string
          folder: string
          tags: string[]
          product_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          filename: string
          original_filename: string
          mime_type: string
          file_size?: number | null
          width?: number | null
          height?: number | null
          alt_text?: string | null
          url: string
          folder?: string
          tags?: string[]
          product_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          filename?: string
          original_filename?: string
          mime_type?: string
          file_size?: number | null
          width?: number | null
          height?: number | null
          alt_text?: string | null
          url?: string
          folder?: string
          tags?: string[]
          product_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          course_session_id: string | null
          name: string
          description: string | null
          sku: string | null
          quantity: number
          unit_price: number
          total_price: number
          product_snapshot: any
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          course_session_id?: string | null
          name: string
          description?: string | null
          sku?: string | null
          quantity?: number
          unit_price: number
          total_price: number
          product_snapshot?: any
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          course_session_id?: string | null
          name?: string
          description?: string | null
          sku?: string | null
          quantity?: number
          unit_price?: number
          total_price?: number
          product_snapshot?: any
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_course_session_id_fkey"
            columns: ["course_session_id"]
            isOneToOne: false
            referencedRelation: "course_sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      orders: {
        Row: {
          id: string
          order_number: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          billing_address: any
          subtotal_amount: number
          tax_amount: number
          discount_amount: number
          total_amount: number
          currency: string
          stripe_payment_intent_id: string | null
          stripe_customer_id: string | null
          status: 'pending' | 'paid' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled'
          payment_status: 'pending' | 'succeeded' | 'failed' | 'canceled' | null
          fulfillment_status: 'unfulfilled' | 'partial' | 'fulfilled' | null
          notes: string | null
          admin_notes: string | null
          discount_code: string | null
          referral_source: string | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          candidate_id: string | null
          created_at: string
          updated_at: string
          paid_at: string | null
          shipped_at: string | null
          delivered_at: string | null
        }
        Insert: {
          id?: string
          order_number: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          billing_address?: any
          subtotal_amount?: number
          tax_amount?: number
          discount_amount?: number
          total_amount: number
          currency?: string
          stripe_payment_intent_id?: string | null
          stripe_customer_id?: string | null
          status?: 'pending' | 'paid' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled'
          payment_status?: 'pending' | 'succeeded' | 'failed' | 'canceled' | null
          fulfillment_status?: 'unfulfilled' | 'partial' | 'fulfilled' | null
          notes?: string | null
          admin_notes?: string | null
          discount_code?: string | null
          referral_source?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          candidate_id?: string | null
          created_at?: string
          updated_at?: string
          paid_at?: string | null
          shipped_at?: string | null
          delivered_at?: string | null
        }
        Update: {
          id?: string
          order_number?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          billing_address?: any
          subtotal_amount?: number
          tax_amount?: number
          discount_amount?: number
          total_amount?: number
          currency?: string
          stripe_payment_intent_id?: string | null
          stripe_customer_id?: string | null
          status?: 'pending' | 'paid' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled'
          payment_status?: 'pending' | 'succeeded' | 'failed' | 'canceled' | null
          fulfillment_status?: 'unfulfilled' | 'partial' | 'fulfilled' | null
          notes?: string | null
          admin_notes?: string | null
          discount_code?: string | null
          referral_source?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          candidate_id?: string | null
          created_at?: string
          updated_at?: string
          paid_at?: string | null
          shipped_at?: string | null
          delivered_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          }
        ]
      }
      page_views: {
        Row: {
          id: string
          page_path: string
          page_title: string | null
          user_agent: string | null
          ip_address: string | null
          referrer: string | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          session_id: string | null
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          page_path: string
          page_title?: string | null
          user_agent?: string | null
          ip_address?: string | null
          referrer?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          session_id?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          page_path?: string
          page_title?: string | null
          user_agent?: string | null
          ip_address?: string | null
          referrer?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          session_id?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          type: string
          stripe_product_id: string | null
          stripe_price_id: string | null
          active: boolean
          metadata: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          type?: string
          stripe_product_id?: string | null
          stripe_price_id?: string | null
          active?: boolean
          metadata?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          type?: string
          stripe_product_id?: string | null
          stripe_price_id?: string | null
          active?: boolean
          metadata?: any
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      shopping_carts: {
        Row: {
          id: string
          session_id: string
          customer_email: string | null
          items: any
          subtotal: number | null
          tax_amount: number | null
          discount_amount: number | null
          total_amount: number | null
          discount_code: string | null
          expires_at: string | null
          last_activity: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          customer_email?: string | null
          items?: any
          subtotal?: number | null
          tax_amount?: number | null
          discount_amount?: number | null
          total_amount?: number | null
          discount_code?: string | null
          expires_at?: string | null
          last_activity?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          customer_email?: string | null
          items?: any
          subtotal?: number | null
          tax_amount?: number | null
          discount_amount?: number | null
          total_amount?: number | null
          discount_code?: string | null
          expires_at?: string | null
          last_activity?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          auth_user_id: string | null
          email: string
          first_name: string
          last_name: string
          role: 'owner' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_user_id?: string | null
          email: string
          first_name: string
          last_name: string
          role?: 'owner' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string | null
          email?: string
          first_name?: string
          last_name?: string
          role?: 'owner' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_auth_user_id_fkey"
            columns: ["auth_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      enrollment_status: 'enrolled' | 'completed' | 'dropped'
      exam_type: 'theory' | 'tasting' | 'practical'
      payment_status: 'pending' | 'paid' | 'refunded'
      session_status: 'scheduled' | 'active' | 'completed' | 'cancelled'
      user_role: 'owner' | 'admin'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}