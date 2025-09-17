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