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
      achievement_definitions: {
        Row: {
          category: string
          created_at: string | null
          criteria: Json
          description: string
          icon_name: string
          id: string
          name: string
          tier: string
        }
        Insert: {
          category: string
          created_at?: string | null
          criteria: Json
          description: string
          icon_name: string
          id?: string
          name: string
          tier: string
        }
        Update: {
          category?: string
          created_at?: string | null
          criteria?: Json
          description?: string
          icon_name?: string
          id?: string
          name?: string
          tier?: string
        }
        Relationships: []
      }
      athlete_achievements: {
        Row: {
          achievement_id: string
          athlete_id: string
          context: Json | null
          earned_at: string | null
          id: string
        }
        Insert: {
          achievement_id: string
          athlete_id: string
          context?: Json | null
          earned_at?: string | null
          id?: string
        }
        Update: {
          achievement_id?: string
          athlete_id?: string
          context?: Json | null
          earned_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievement_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_achievements_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          current_phase: string | null
          date_of_birth: string | null
          display_name: string | null
          equipment_available: string[] | null
          goal_time_minutes: number | null
          height_cm: number | null
          hyrox_division: string | null
          hyrox_race_count: number | null
          id: string
          injuries_limitations: string[] | null
          preferences: Json | null
          profile_complete: boolean | null
          race_date: string | null
          sex: string | null
          training_history: Json | null
          units_preference: string | null
          updated_at: string | null
          user_id: string
          weekly_availability_hours: number | null
          weight_kg: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          current_phase?: string | null
          date_of_birth?: string | null
          display_name?: string | null
          equipment_available?: string[] | null
          goal_time_minutes?: number | null
          height_cm?: number | null
          hyrox_division?: string | null
          hyrox_race_count?: number | null
          id?: string
          injuries_limitations?: string[] | null
          preferences?: Json | null
          profile_complete?: boolean | null
          race_date?: string | null
          sex?: string | null
          training_history?: Json | null
          units_preference?: string | null
          updated_at?: string | null
          user_id: string
          weekly_availability_hours?: number | null
          weight_kg?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          current_phase?: string | null
          date_of_birth?: string | null
          display_name?: string | null
          equipment_available?: string[] | null
          goal_time_minutes?: number | null
          height_cm?: number | null
          hyrox_division?: string | null
          hyrox_race_count?: number | null
          id?: string
          injuries_limitations?: string[] | null
          preferences?: Json | null
          profile_complete?: boolean | null
          race_date?: string | null
          sex?: string | null
          training_history?: Json | null
          units_preference?: string | null
          updated_at?: string | null
          user_id?: string
          weekly_availability_hours?: number | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      benchmark_tests: {
        Row: {
          athlete_id: string
          created_at: string | null
          id: string
          notes: string | null
          results: Json
          station_id: string | null
          test_date: string
          test_type: string
        }
        Insert: {
          athlete_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          results: Json
          station_id?: string | null
          test_date: string
          test_type: string
        }
        Update: {
          athlete_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          results?: Json
          station_id?: string | null
          test_date?: string
          test_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "benchmark_tests_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benchmark_tests_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "hyrox_stations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          athlete_id: string
          id: string
          started_at: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          athlete_id: string
          id?: string
          started_at?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          athlete_id?: string
          id?: string
          started_at?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_library: {
        Row: {
          category: string
          created_at: string | null
          description: string
          difficulty: string
          equipment_needed: string[] | null
          hyrox_station_id: string | null
          id: string
          is_active: boolean | null
          muscle_groups: string[] | null
          name: string
          subcategory: string | null
          video_url: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          difficulty: string
          equipment_needed?: string[] | null
          hyrox_station_id?: string | null
          id?: string
          is_active?: boolean | null
          muscle_groups?: string[] | null
          name: string
          subcategory?: string | null
          video_url?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          difficulty?: string
          equipment_needed?: string[] | null
          hyrox_station_id?: string | null
          id?: string
          is_active?: boolean | null
          muscle_groups?: string[] | null
          name?: string
          subcategory?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_library_hyrox_station_id_fkey"
            columns: ["hyrox_station_id"]
            isOneToOne: false
            referencedRelation: "hyrox_stations"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          athlete_id: string
          completed_at: string | null
          created_at: string | null
          current_value: number | null
          deleted_at: string | null
          description: string | null
          goal_type: string
          id: string
          station_id: string | null
          status: string | null
          target_date: string | null
          target_unit: string | null
          target_value: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          athlete_id: string
          completed_at?: string | null
          created_at?: string | null
          current_value?: number | null
          deleted_at?: string | null
          description?: string | null
          goal_type: string
          id?: string
          station_id?: string | null
          status?: string | null
          target_date?: string | null
          target_unit?: string | null
          target_value?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          athlete_id?: string
          completed_at?: string | null
          created_at?: string | null
          current_value?: number | null
          deleted_at?: string | null
          description?: string | null
          goal_type?: string
          id?: string
          station_id?: string | null
          status?: string | null
          target_date?: string | null
          target_unit?: string | null
          target_value?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "hyrox_stations"
            referencedColumns: ["id"]
          },
        ]
      }
      hyrox_stations: {
        Row: {
          common_mistakes: Json | null
          created_at: string | null
          description: string
          distance_or_reps: string
          exercise_type: string
          id: string
          muscles_worked: string[] | null
          station_name: string
          station_number: number
          tips: Json | null
          weights_by_division: Json | null
        }
        Insert: {
          common_mistakes?: Json | null
          created_at?: string | null
          description: string
          distance_or_reps: string
          exercise_type: string
          id?: string
          muscles_worked?: string[] | null
          station_name: string
          station_number: number
          tips?: Json | null
          weights_by_division?: Json | null
        }
        Update: {
          common_mistakes?: Json | null
          created_at?: string | null
          description?: string
          distance_or_reps?: string
          exercise_type?: string
          id?: string
          muscles_worked?: string[] | null
          station_name?: string
          station_number?: number
          tips?: Json | null
          weights_by_division?: Json | null
        }
        Relationships: []
      }
      knowledge_chunks: {
        Row: {
          chunk_index: number | null
          content: string
          created_at: string | null
          embedding: string | null
          est_tokens: number | null
          fts: unknown
          id: string
          section: string | null
          source_doc: string
          source_name: string | null
          topic_tags: string[] | null
          word_count: number | null
        }
        Insert: {
          chunk_index?: number | null
          content: string
          created_at?: string | null
          embedding?: string | null
          est_tokens?: number | null
          fts?: unknown
          id: string
          section?: string | null
          source_doc: string
          source_name?: string | null
          topic_tags?: string[] | null
          word_count?: number | null
        }
        Update: {
          chunk_index?: number | null
          content?: string
          created_at?: string | null
          embedding?: string | null
          est_tokens?: number | null
          fts?: unknown
          id?: string
          section?: string | null
          source_doc?: string
          source_name?: string | null
          topic_tags?: string[] | null
          word_count?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          feedback: string | null
          id: string
          latency_ms: number | null
          pinned: boolean | null
          rag_chunks_used: string[] | null
          role: string
          suggested_actions: Json | null
          tokens_in: number | null
          tokens_out: number | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          feedback?: string | null
          id?: string
          latency_ms?: number | null
          pinned?: boolean | null
          rag_chunks_used?: string[] | null
          role: string
          suggested_actions?: Json | null
          tokens_in?: number | null
          tokens_out?: number | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          feedback?: string | null
          id?: string
          latency_ms?: number | null
          pinned?: boolean | null
          rag_chunks_used?: string[] | null
          role?: string
          suggested_actions?: Json | null
          tokens_in?: number | null
          tokens_out?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_records: {
        Row: {
          athlete_id: string
          context: string | null
          created_at: string | null
          date_achieved: string
          exercise_id: string | null
          exercise_name: string | null
          id: string
          notes: string | null
          previous_value: number | null
          record_type: string
          station_id: string | null
          value: number
          value_unit: string
        }
        Insert: {
          athlete_id: string
          context?: string | null
          created_at?: string | null
          date_achieved: string
          exercise_id?: string | null
          exercise_name?: string | null
          id?: string
          notes?: string | null
          previous_value?: number | null
          record_type: string
          station_id?: string | null
          value: number
          value_unit: string
        }
        Update: {
          athlete_id?: string
          context?: string | null
          created_at?: string | null
          date_achieved?: string
          exercise_id?: string | null
          exercise_name?: string | null
          id?: string
          notes?: string | null
          previous_value?: number | null
          record_type?: string
          station_id?: string | null
          value?: number
          value_unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_records_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_records_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercise_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_records_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "hyrox_stations"
            referencedColumns: ["id"]
          },
        ]
      }
      race_results: {
        Row: {
          athlete_id: string
          conditions: string | null
          created_at: string | null
          division: string | null
          format: string | null
          id: string
          is_simulation: boolean | null
          location: string | null
          notes: string | null
          race_date: string
          race_name: string | null
          total_time_seconds: number
          updated_at: string | null
        }
        Insert: {
          athlete_id: string
          conditions?: string | null
          created_at?: string | null
          division?: string | null
          format?: string | null
          id?: string
          is_simulation?: boolean | null
          location?: string | null
          notes?: string | null
          race_date: string
          race_name?: string | null
          total_time_seconds: number
          updated_at?: string | null
        }
        Update: {
          athlete_id?: string
          conditions?: string | null
          created_at?: string | null
          division?: string | null
          format?: string | null
          id?: string
          is_simulation?: boolean | null
          location?: string | null
          notes?: string | null
          race_date?: string
          race_name?: string | null
          total_time_seconds?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "race_results_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      race_splits: {
        Row: {
          created_at: string | null
          heart_rate_avg: number | null
          id: string
          notes: string | null
          race_result_id: string
          split_number: number
          split_type: string
          station_id: string | null
          time_seconds: number
          transition_time_seconds: number | null
        }
        Insert: {
          created_at?: string | null
          heart_rate_avg?: number | null
          id?: string
          notes?: string | null
          race_result_id: string
          split_number: number
          split_type: string
          station_id?: string | null
          time_seconds: number
          transition_time_seconds?: number | null
        }
        Update: {
          created_at?: string | null
          heart_rate_avg?: number | null
          id?: string
          notes?: string | null
          race_result_id?: string
          split_number?: number
          split_type?: string
          station_id?: string | null
          time_seconds?: number
          transition_time_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "race_splits_race_result_id_fkey"
            columns: ["race_result_id"]
            isOneToOne: false
            referencedRelation: "race_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "race_splits_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "hyrox_stations"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_level_benchmarks: {
        Row: {
          created_at: string | null
          gender: string
          id: string
          max_seconds: number
          median_seconds: number | null
          min_seconds: number
          notes: string | null
          segment_type: string
          skill_level: string
          station_id: string | null
        }
        Insert: {
          created_at?: string | null
          gender: string
          id?: string
          max_seconds: number
          median_seconds?: number | null
          min_seconds: number
          notes?: string | null
          segment_type: string
          skill_level: string
          station_id?: string | null
        }
        Update: {
          created_at?: string | null
          gender?: string
          id?: string
          max_seconds?: number
          median_seconds?: number | null
          min_seconds?: number
          notes?: string | null
          segment_type?: string
          skill_level?: string
          station_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_level_benchmarks_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "hyrox_stations"
            referencedColumns: ["id"]
          },
        ]
      }
      training_plan_days: {
        Row: {
          created_at: string | null
          day_of_week: number
          estimated_duration_minutes: number | null
          id: string
          is_completed: boolean | null
          is_rest_day: boolean | null
          linked_workout_log_id: string | null
          notes: string | null
          session_type: string | null
          training_plan_week_id: string
          workout_description: string | null
          workout_details: Json | null
          workout_title: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          estimated_duration_minutes?: number | null
          id?: string
          is_completed?: boolean | null
          is_rest_day?: boolean | null
          linked_workout_log_id?: string | null
          notes?: string | null
          session_type?: string | null
          training_plan_week_id: string
          workout_description?: string | null
          workout_details?: Json | null
          workout_title?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          estimated_duration_minutes?: number | null
          id?: string
          is_completed?: boolean | null
          is_rest_day?: boolean | null
          linked_workout_log_id?: string | null
          notes?: string | null
          session_type?: string | null
          training_plan_week_id?: string
          workout_description?: string | null
          workout_details?: Json | null
          workout_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_training_plan_days_workout_log"
            columns: ["linked_workout_log_id"]
            isOneToOne: false
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_plan_days_training_plan_week_id_fkey"
            columns: ["training_plan_week_id"]
            isOneToOne: false
            referencedRelation: "training_plan_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      training_plan_weeks: {
        Row: {
          created_at: string | null
          focus: string | null
          id: string
          notes: string | null
          target_volume_hours: number | null
          training_plan_id: string
          week_number: number
        }
        Insert: {
          created_at?: string | null
          focus?: string | null
          id?: string
          notes?: string | null
          target_volume_hours?: number | null
          training_plan_id: string
          week_number: number
        }
        Update: {
          created_at?: string | null
          focus?: string | null
          id?: string
          notes?: string | null
          target_volume_hours?: number | null
          training_plan_id?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "training_plan_weeks_training_plan_id_fkey"
            columns: ["training_plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      training_plans: {
        Row: {
          athlete_id: string
          created_at: string | null
          deleted_at: string | null
          difficulty: string | null
          duration_weeks: number
          end_date: string | null
          goal: string | null
          id: string
          is_ai_generated: boolean | null
          plan_name: string
          source_conversation_id: string | null
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          athlete_id: string
          created_at?: string | null
          deleted_at?: string | null
          difficulty?: string | null
          duration_weeks: number
          end_date?: string | null
          goal?: string | null
          id?: string
          is_ai_generated?: boolean | null
          plan_name: string
          source_conversation_id?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          athlete_id?: string
          created_at?: string | null
          deleted_at?: string | null
          difficulty?: string | null
          duration_weeks?: number
          end_date?: string | null
          goal?: string | null
          id?: string
          is_ai_generated?: boolean | null
          plan_name?: string
          source_conversation_id?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_training_plans_conversation"
            columns: ["source_conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_plans_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_logs: {
        Row: {
          athlete_id: string
          calories_estimated: number | null
          completed_workout: Json | null
          completion_status: string | null
          conversation_id: string | null
          created_at: string | null
          date: string
          deleted_at: string | null
          duration_minutes: number | null
          heart_rate_avg: number | null
          id: string
          notes: string | null
          prescribed_workout: Json | null
          rpe_post: number | null
          rpe_pre: number | null
          session_type: string | null
          training_plan_day_id: string | null
          updated_at: string | null
        }
        Insert: {
          athlete_id: string
          calories_estimated?: number | null
          completed_workout?: Json | null
          completion_status?: string | null
          conversation_id?: string | null
          created_at?: string | null
          date: string
          deleted_at?: string | null
          duration_minutes?: number | null
          heart_rate_avg?: number | null
          id?: string
          notes?: string | null
          prescribed_workout?: Json | null
          rpe_post?: number | null
          rpe_pre?: number | null
          session_type?: string | null
          training_plan_day_id?: string | null
          updated_at?: string | null
        }
        Update: {
          athlete_id?: string
          calories_estimated?: number | null
          completed_workout?: Json | null
          completion_status?: string | null
          conversation_id?: string | null
          created_at?: string | null
          date?: string
          deleted_at?: string | null
          duration_minutes?: number | null
          heart_rate_avg?: number | null
          id?: string
          notes?: string | null
          prescribed_workout?: Json | null
          rpe_post?: number | null
          rpe_pre?: number | null
          session_type?: string | null
          training_plan_day_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_workout_logs_conversation"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_workout_logs_training_plan_day"
            columns: ["training_plan_day_id"]
            isOneToOne: false
            referencedRelation: "training_plan_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_logs_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_athlete_id_for_user: { Args: never; Returns: string }
      hybrid_search_chunks: {
        Args: {
          full_text_weight?: number
          match_count?: number
          query_embedding: string
          query_text: string
          rrf_k?: number
          semantic_weight?: number
        }
        Returns: {
          content: string
          id: string
          score: number
          section: string
          source_name: string
          topic_tags: string[]
        }[]
      }
      match_chunks: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          section: string
          similarity: number
          source_name: string
          topic_tags: string[]
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
