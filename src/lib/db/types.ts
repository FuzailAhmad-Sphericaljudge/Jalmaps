export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      admin_areas: {
        Row: {
          boundary: unknown;
          boundary_ref: string | null;
          boundary_simplified: unknown;
          centroid_lat: number | null;
          centroid_lng: number | null;
          code: string;
          created_at: string;
          id: string;
          level: Database["public"]["Enums"]["admin_area_level"];
          names: NonNullable<Json>;
          parent_id: string | null;
          population: number | null;
          updated_at: string;
        };
        Insert: {
          boundary?: unknown;
          boundary_ref?: string | null;
          boundary_simplified?: unknown;
          centroid_lat?: number | null;
          centroid_lng?: number | null;
          code: string;
          created_at?: string;
          id?: string;
          level: Database["public"]["Enums"]["admin_area_level"];
          names: NonNullable<Json>;
          parent_id?: string | null;
          population?: number | null;
          updated_at?: string;
        };
        Update: {
          boundary?: unknown;
          boundary_ref?: string | null;
          boundary_simplified?: unknown;
          centroid_lat?: number | null;
          centroid_lng?: number | null;
          code?: string;
          created_at?: string;
          id?: string;
          level?: Database["public"]["Enums"]["admin_area_level"];
          names?: NonNullable<Json>;
          parent_id?: string | null;
          population?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admin_areas_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "admin_areas";
            referencedColumns: ["id"];
          },
        ];
      };
      advisory_feedback: {
        Row: {
          advice_key: string;
          created_at: string;
          id: string;
          is_helpful: boolean;
          reason: string | null;
          user_id: string;
          well_id: string;
        };
        Insert: {
          advice_key: string;
          created_at?: string;
          id?: string;
          is_helpful: boolean;
          reason?: string | null;
          user_id: string;
          well_id: string;
        };
        Update: {
          advice_key?: string;
          created_at?: string;
          id?: string;
          is_helpful?: boolean;
          reason?: string | null;
          user_id?: string;
          well_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "advisory_feedback_well_id_fkey";
            columns: ["well_id"];
            isOneToOne: false;
            referencedRelation: "wells";
            referencedColumns: ["id"];
          },
        ];
      };
      advisory_rules: {
        Row: {
          advice_key: string;
          conditions: NonNullable<Json>;
          cooldown_days: number;
          created_at: string;
          enabled: boolean;
          id: string;
          priority: number;
          updated_at: string;
          version: number;
        };
        Insert: {
          advice_key: string;
          conditions: NonNullable<Json>;
          cooldown_days?: number;
          created_at?: string;
          enabled?: boolean;
          id: string;
          priority?: number;
          updated_at?: string;
          version?: number;
        };
        Update: {
          advice_key?: string;
          conditions?: NonNullable<Json>;
          cooldown_days?: number;
          created_at?: string;
          enabled?: boolean;
          id?: string;
          priority?: number;
          updated_at?: string;
          version?: number;
        };
        Relationships: [];
      };
      alert_events: {
        Row: {
          alert_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          new_status: Database["public"]["Enums"]["alert_status"];
          previous_status: Database["public"]["Enums"]["alert_status"] | null;
          reason: string | null;
        };
        Insert: {
          alert_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          new_status: Database["public"]["Enums"]["alert_status"];
          previous_status?: Database["public"]["Enums"]["alert_status"] | null;
          reason?: string | null;
        };
        Update: {
          alert_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          new_status?: Database["public"]["Enums"]["alert_status"];
          previous_status?: Database["public"]["Enums"]["alert_status"] | null;
          reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "alert_events_alert_id_fkey";
            columns: ["alert_id"];
            isOneToOne: false;
            referencedRelation: "alerts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "alert_events_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      alert_jobs: {
        Row: {
          attempts: number;
          id: string;
          locked_at: string | null;
          locked_by: string | null;
          max_attempts: number;
          queued_at: string;
          well_id: string;
        };
        Insert: {
          attempts?: number;
          id?: string;
          locked_at?: string | null;
          locked_by?: string | null;
          max_attempts?: number;
          queued_at?: string;
          well_id: string;
        };
        Update: {
          attempts?: number;
          id?: string;
          locked_at?: string | null;
          locked_by?: string | null;
          max_attempts?: number;
          queued_at?: string;
          well_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "alert_jobs_well_id_fkey";
            columns: ["well_id"];
            isOneToOne: false;
            referencedRelation: "wells";
            referencedColumns: ["id"];
          },
        ];
      };
      alert_rules: {
        Row: {
          cooldown_minutes: number;
          created_at: string;
          created_by: string | null;
          enabled: boolean;
          id: string;
          params: NonNullable<Json>;
          rule_type: Database["public"]["Enums"]["alert_rule_type"];
          scope: Database["public"]["Enums"]["alert_rule_scope"];
          severity: Database["public"]["Enums"]["alert_severity"];
          updated_at: string;
          well_id: string | null;
        };
        Insert: {
          cooldown_minutes?: number;
          created_at?: string;
          created_by?: string | null;
          enabled?: boolean;
          id?: string;
          params?: NonNullable<Json>;
          rule_type: Database["public"]["Enums"]["alert_rule_type"];
          scope?: Database["public"]["Enums"]["alert_rule_scope"];
          severity?: Database["public"]["Enums"]["alert_severity"];
          updated_at?: string;
          well_id?: string | null;
        };
        Update: {
          cooldown_minutes?: number;
          created_at?: string;
          created_by?: string | null;
          enabled?: boolean;
          id?: string;
          params?: NonNullable<Json>;
          rule_type?: Database["public"]["Enums"]["alert_rule_type"];
          scope?: Database["public"]["Enums"]["alert_rule_scope"];
          severity?: Database["public"]["Enums"]["alert_severity"];
          updated_at?: string;
          well_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "alert_rules_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "alert_rules_well_id_fkey";
            columns: ["well_id"];
            isOneToOne: false;
            referencedRelation: "wells";
            referencedColumns: ["id"];
          },
        ];
      };
      alerts: {
        Row: {
          acknowledged_at: string | null;
          acknowledged_by: string | null;
          created_at: string;
          dedupe_key: string;
          escalated_at: string | null;
          id: string;
          message_key: string;
          node_id: string | null;
          payload: NonNullable<Json>;
          resolved_at: string | null;
          resolved_reason: Database["public"]["Enums"]["alert_resolved_reason"] | null;
          rule_id: string | null;
          severity: Database["public"]["Enums"]["alert_severity"];
          snoozed_until: string | null;
          status: Database["public"]["Enums"]["alert_status"];
          triggered_at: string;
          updated_at: string;
          well_id: string;
        };
        Insert: {
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          created_at?: string;
          dedupe_key: string;
          escalated_at?: string | null;
          id?: string;
          message_key: string;
          node_id?: string | null;
          payload?: NonNullable<Json>;
          resolved_at?: string | null;
          resolved_reason?: Database["public"]["Enums"]["alert_resolved_reason"] | null;
          rule_id?: string | null;
          severity: Database["public"]["Enums"]["alert_severity"];
          snoozed_until?: string | null;
          status?: Database["public"]["Enums"]["alert_status"];
          triggered_at?: string;
          updated_at?: string;
          well_id: string;
        };
        Update: {
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          created_at?: string;
          dedupe_key?: string;
          escalated_at?: string | null;
          id?: string;
          message_key?: string;
          node_id?: string | null;
          payload?: NonNullable<Json>;
          resolved_at?: string | null;
          resolved_reason?: Database["public"]["Enums"]["alert_resolved_reason"] | null;
          rule_id?: string | null;
          severity?: Database["public"]["Enums"]["alert_severity"];
          snoozed_until?: string | null;
          status?: Database["public"]["Enums"]["alert_status"];
          triggered_at?: string;
          updated_at?: string;
          well_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "alerts_acknowledged_by_fkey";
            columns: ["acknowledged_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "alerts_node_id_fkey";
            columns: ["node_id"];
            isOneToOne: false;
            referencedRelation: "nodes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "alerts_rule_id_fkey";
            columns: ["rule_id"];
            isOneToOne: false;
            referencedRelation: "alert_rules";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "alerts_well_id_fkey";
            columns: ["well_id"];
            isOneToOne: false;
            referencedRelation: "wells";
            referencedColumns: ["id"];
          },
        ];
      };
      api_keys: {
        Row: {
          created_at: string;
          expires_at: string | null;
          id: string;
          key_hash: string;
          label: string;
          last_used_at: string | null;
          profile_id: string;
          requests_per_day: number;
          requests_per_minute: number;
          revoked_at: string | null;
          scopes: string[];
        };
        Insert: {
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          key_hash: string;
          label: string;
          last_used_at?: string | null;
          profile_id: string;
          requests_per_day?: number;
          requests_per_minute?: number;
          revoked_at?: string | null;
          scopes: string[];
        };
        Update: {
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          key_hash?: string;
          label?: string;
          last_used_at?: string | null;
          profile_id?: string;
          requests_per_day?: number;
          requests_per_minute?: number;
          revoked_at?: string | null;
          scopes?: string[];
        };
        Relationships: [
          {
            foreignKeyName: "api_keys_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      api_usage: {
        Row: {
          bytes: number;
          endpoint: string;
          id: string;
          key_id: string | null;
          status: number;
          ts: string;
        };
        Insert: {
          bytes?: number;
          endpoint: string;
          id?: string;
          key_id?: string | null;
          status: number;
          ts?: string;
        };
        Update: {
          bytes?: number;
          endpoint?: string;
          id?: string;
          key_id?: string | null;
          status?: number;
          ts?: string;
        };
        Relationships: [
          {
            foreignKeyName: "api_usage_key_id_fkey";
            columns: ["key_id"];
            isOneToOne: false;
            referencedRelation: "insurer_api_keys";
            referencedColumns: ["id"];
          },
        ];
      };
      aquifer_types: {
        Row: {
          code: string;
          created_at: string;
          default_sy: number;
          default_sy_max: number;
          default_sy_min: number;
          description: string | null;
          id: string;
          name: string;
          source_notes: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          default_sy: number;
          default_sy_max: number;
          default_sy_min: number;
          description?: string | null;
          id?: string;
          name: string;
          source_notes: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          default_sy?: number;
          default_sy_max?: number;
          default_sy_min?: number;
          description?: string | null;
          id?: string;
          name?: string;
          source_notes?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      area_insights: {
        Row: {
          area_id: string;
          as_of: string;
          avg_depletion_rate_m_per_year: number | null;
          avg_health_score: number | null;
          created_at: string;
          dominant_health_band: string | null;
          id: string;
          insights: NonNullable<Json>;
          is_sufficient: boolean;
          total_recharge_volume_mcm: number | null;
          wells_count: number;
          worst_health_score: number | null;
        };
        Insert: {
          area_id: string;
          as_of: string;
          avg_depletion_rate_m_per_year?: number | null;
          avg_health_score?: number | null;
          created_at?: string;
          dominant_health_band?: string | null;
          id?: string;
          insights?: NonNullable<Json>;
          is_sufficient?: boolean;
          total_recharge_volume_mcm?: number | null;
          wells_count?: number;
          worst_health_score?: number | null;
        };
        Update: {
          area_id?: string;
          as_of?: string;
          avg_depletion_rate_m_per_year?: number | null;
          avg_health_score?: number | null;
          created_at?: string;
          dominant_health_band?: string | null;
          id?: string;
          insights?: NonNullable<Json>;
          is_sufficient?: boolean;
          total_recharge_volume_mcm?: number | null;
          wells_count?: number;
          worst_health_score?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "area_insights_area_id_fkey";
            columns: ["area_id"];
            isOneToOne: false;
            referencedRelation: "admin_areas";
            referencedColumns: ["id"];
          },
        ];
      };
      area_notes: {
        Row: {
          area_id: string;
          author_id: string;
          created_at: string;
          due_date: string | null;
          id: string;
          status: Database["public"]["Enums"]["area_note_status"];
          text: string;
          updated_at: string;
        };
        Insert: {
          area_id: string;
          author_id: string;
          created_at?: string;
          due_date?: string | null;
          id?: string;
          status?: Database["public"]["Enums"]["area_note_status"];
          text: string;
          updated_at?: string;
        };
        Update: {
          area_id?: string;
          author_id?: string;
          created_at?: string;
          due_date?: string | null;
          id?: string;
          status?: Database["public"]["Enums"]["area_note_status"];
          text?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "area_notes_area_id_fkey";
            columns: ["area_id"];
            isOneToOne: false;
            referencedRelation: "admin_areas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "area_notes_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      area_risk_scores: {
        Row: {
          area_id: string;
          as_of: string;
          band: string;
          components: NonNullable<Json>;
          confidence: string;
          created_at: string;
          id: string;
          model_version: string;
          score: number;
        };
        Insert: {
          area_id: string;
          as_of?: string;
          band: string;
          components?: NonNullable<Json>;
          confidence?: string;
          created_at?: string;
          id?: string;
          model_version?: string;
          score: number;
        };
        Update: {
          area_id?: string;
          as_of?: string;
          band?: string;
          components?: NonNullable<Json>;
          confidence?: string;
          created_at?: string;
          id?: string;
          model_version?: string;
          score?: number;
        };
        Relationships: [
          {
            foreignKeyName: "area_risk_scores_area_id_fkey";
            columns: ["area_id"];
            isOneToOne: false;
            referencedRelation: "admin_areas";
            referencedColumns: ["id"];
          },
        ];
      };
      area_stats: {
        Row: {
          area_id: string;
          as_of: string;
          avg_change_30d_m: number;
          avg_depth_m: number | null;
          median_depth_m: number | null;
          nodes_online: number;
          pct_critical: number;
          pct_offline: number;
          pct_warning: number;
          updated_at: string;
          wells_count: number;
          worst_well_id: string | null;
        };
        Insert: {
          area_id: string;
          as_of?: string;
          avg_change_30d_m?: number;
          avg_depth_m?: number | null;
          median_depth_m?: number | null;
          nodes_online?: number;
          pct_critical?: number;
          pct_offline?: number;
          pct_warning?: number;
          updated_at?: string;
          wells_count?: number;
          worst_well_id?: string | null;
        };
        Update: {
          area_id?: string;
          as_of?: string;
          avg_change_30d_m?: number;
          avg_depth_m?: number | null;
          median_depth_m?: number | null;
          nodes_online?: number;
          pct_critical?: number;
          pct_offline?: number;
          pct_warning?: number;
          updated_at?: string;
          wells_count?: number;
          worst_well_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "area_stats_area_id_fkey";
            columns: ["area_id"];
            isOneToOne: true;
            referencedRelation: "admin_areas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "area_stats_worst_well_id_fkey";
            columns: ["worst_well_id"];
            isOneToOne: false;
            referencedRelation: "wells";
            referencedColumns: ["id"];
          },
        ];
      };
      area_stats_daily: {
        Row: {
          area_id: string;
          avg_depth_m: number | null;
          created_at: string;
          median_depth_m: number | null;
          pct_critical: number;
          recorded_date: string;
          wells_count: number;
        };
        Insert: {
          area_id: string;
          avg_depth_m?: number | null;
          created_at?: string;
          median_depth_m?: number | null;
          pct_critical?: number;
          recorded_date: string;
          wells_count?: number;
        };
        Update: {
          area_id?: string;
          avg_depth_m?: number | null;
          created_at?: string;
          median_depth_m?: number | null;
          pct_critical?: number;
          recorded_date?: string;
          wells_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "area_stats_daily_area_id_fkey";
            columns: ["area_id"];
            isOneToOne: false;
            referencedRelation: "admin_areas";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_log: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          details: NonNullable<Json>;
          entity_id: string | null;
          entity_type: string;
          id: number;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          details?: NonNullable<Json>;
          entity_id?: string | null;
          entity_type: string;
          id?: number;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          details?: NonNullable<Json>;
          entity_id?: string | null;
          entity_type?: string;
          id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      crop_profiles: {
        Row: {
          created_at: string;
          growth_stages: NonNullable<Json>;
          id: string;
          name_en: string;
          name_hi: string;
          sowing_windows: NonNullable<Json>;
          water_sensitivity: string;
        };
        Insert: {
          created_at?: string;
          growth_stages: NonNullable<Json>;
          id: string;
          name_en: string;
          name_hi: string;
          sowing_windows: NonNullable<Json>;
          water_sensitivity: string;
        };
        Update: {
          created_at?: string;
          growth_stages?: NonNullable<Json>;
          id?: string;
          name_en?: string;
          name_hi?: string;
          sowing_windows?: NonNullable<Json>;
          water_sensitivity?: string;
        };
        Relationships: [];
      };
      ingest_rejects: {
        Row: {
          hardware_id: string | null;
          id: number;
          node_id: string | null;
          payload: NonNullable<Json>;
          reason: string;
          received_at: string;
        };
        Insert: {
          hardware_id?: string | null;
          id?: number;
          node_id?: string | null;
          payload: NonNullable<Json>;
          reason: string;
          received_at?: string;
        };
        Update: {
          hardware_id?: string | null;
          id?: number;
          node_id?: string | null;
          payload?: NonNullable<Json>;
          reason?: string;
          received_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ingest_rejects_node_id_fkey";
            columns: ["node_id"];
            isOneToOne: false;
            referencedRelation: "nodes";
            referencedColumns: ["id"];
          },
        ];
      };
      insurer_api_keys: {
        Row: {
          created_at: string;
          expires_at: string | null;
          id: string;
          is_sandbox: boolean;
          key_hash: string;
          key_prefix: string;
          last_used_at: string | null;
          monthly_quota: number;
          name: string;
          rate_limit_per_min: number;
          revoked_at: string | null;
          scopes: string[];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          is_sandbox?: boolean;
          key_hash: string;
          key_prefix: string;
          last_used_at?: string | null;
          monthly_quota?: number;
          name: string;
          rate_limit_per_min?: number;
          revoked_at?: string | null;
          scopes?: string[];
          user_id: string;
        };
        Update: {
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          is_sandbox?: boolean;
          key_hash?: string;
          key_prefix?: string;
          last_used_at?: string | null;
          monthly_quota?: number;
          name?: string;
          rate_limit_per_min?: number;
          revoked_at?: string | null;
          scopes?: string[];
          user_id?: string;
        };
        Relationships: [];
      };
      insurer_area_grants: {
        Row: {
          area_id: string;
          created_at: string;
          granted_by: string | null;
          id: string;
          insurer_user_id: string;
          scopes: string[];
          valid_from: string;
          valid_to: string | null;
        };
        Insert: {
          area_id: string;
          created_at?: string;
          granted_by?: string | null;
          id?: string;
          insurer_user_id: string;
          scopes?: string[];
          valid_from?: string;
          valid_to?: string | null;
        };
        Update: {
          area_id?: string;
          created_at?: string;
          granted_by?: string | null;
          id?: string;
          insurer_user_id?: string;
          scopes?: string[];
          valid_from?: string;
          valid_to?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "insurer_area_grants_area_id_fkey";
            columns: ["area_id"];
            isOneToOne: false;
            referencedRelation: "admin_areas";
            referencedColumns: ["id"];
          },
        ];
      };
      node_rate_limits: {
        Row: {
          node_id: string;
          request_count: number;
          window_start: string;
        };
        Insert: {
          node_id: string;
          request_count?: number;
          window_start: string;
        };
        Update: {
          node_id?: string;
          request_count?: number;
          window_start?: string;
        };
        Relationships: [
          {
            foreignKeyName: "node_rate_limits_node_id_fkey";
            columns: ["node_id"];
            isOneToOne: true;
            referencedRelation: "nodes";
            referencedColumns: ["id"];
          },
        ];
      };
      nodes: {
        Row: {
          api_key_hash: string | null;
          api_key_prefix: string | null;
          battery_v: number | null;
          calibration_offset_m: number;
          created_at: string;
          firmware_version: string | null;
          hang_depth_m: number | null;
          hardware_id: string;
          id: string;
          is_simulated: boolean;
          last_seen_at: string | null;
          range_m: number | null;
          revoked_at: string | null;
          sensor_model: string | null;
          signal_rssi: number | null;
          status: Database["public"]["Enums"]["node_status"];
          updated_at: string;
          well_id: string;
        };
        Insert: {
          api_key_hash?: string | null;
          api_key_prefix?: string | null;
          battery_v?: number | null;
          calibration_offset_m?: number;
          created_at?: string;
          firmware_version?: string | null;
          hang_depth_m?: number | null;
          hardware_id: string;
          id?: string;
          is_simulated?: boolean;
          last_seen_at?: string | null;
          range_m?: number | null;
          revoked_at?: string | null;
          sensor_model?: string | null;
          signal_rssi?: number | null;
          status?: Database["public"]["Enums"]["node_status"];
          updated_at?: string;
          well_id: string;
        };
        Update: {
          api_key_hash?: string | null;
          api_key_prefix?: string | null;
          battery_v?: number | null;
          calibration_offset_m?: number;
          created_at?: string;
          firmware_version?: string | null;
          hang_depth_m?: number | null;
          hardware_id?: string;
          id?: string;
          is_simulated?: boolean;
          last_seen_at?: string | null;
          range_m?: number | null;
          revoked_at?: string | null;
          sensor_model?: string | null;
          signal_rssi?: number | null;
          status?: Database["public"]["Enums"]["node_status"];
          updated_at?: string;
          well_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "nodes_well_id_fkey";
            columns: ["well_id"];
            isOneToOne: false;
            referencedRelation: "wells";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_outbox: {
        Row: {
          alert_id: string;
          attempts: number;
          channel: Database["public"]["Enums"]["notification_channel"];
          created_at: string;
          error: string | null;
          event: Database["public"]["Enums"]["notification_event"];
          id: string;
          locale: string;
          next_attempt_at: string;
          payload: NonNullable<Json>;
          provider_message_id: string | null;
          sent_at: string | null;
          status: Database["public"]["Enums"]["notification_status"];
          user_id: string;
        };
        Insert: {
          alert_id: string;
          attempts?: number;
          channel: Database["public"]["Enums"]["notification_channel"];
          created_at?: string;
          error?: string | null;
          event: Database["public"]["Enums"]["notification_event"];
          id?: string;
          locale?: string;
          next_attempt_at?: string;
          payload?: NonNullable<Json>;
          provider_message_id?: string | null;
          sent_at?: string | null;
          status?: Database["public"]["Enums"]["notification_status"];
          user_id: string;
        };
        Update: {
          alert_id?: string;
          attempts?: number;
          channel?: Database["public"]["Enums"]["notification_channel"];
          created_at?: string;
          error?: string | null;
          event?: Database["public"]["Enums"]["notification_event"];
          id?: string;
          locale?: string;
          next_attempt_at?: string;
          payload?: NonNullable<Json>;
          provider_message_id?: string | null;
          sent_at?: string | null;
          status?: Database["public"]["Enums"]["notification_status"];
          user_id?: string;
        };
        Relationships: [];
      };
      notification_prefs: {
        Row: {
          channel: Database["public"]["Enums"]["notification_channel"];
          created_at: string;
          destination: string | null;
          enabled: boolean;
          id: string;
          profile_id: string;
          updated_at: string;
        };
        Insert: {
          channel: Database["public"]["Enums"]["notification_channel"];
          created_at?: string;
          destination?: string | null;
          enabled?: boolean;
          id?: string;
          profile_id: string;
          updated_at?: string;
        };
        Update: {
          channel?: Database["public"]["Enums"]["notification_channel"];
          created_at?: string;
          destination?: string | null;
          enabled?: boolean;
          id?: string;
          profile_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_prefs_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      otp_rate_limits: {
        Row: {
          request_count: number;
          subject_hash: string;
          subject_type: string;
          window_started_at: string;
        };
        Insert: {
          request_count: number;
          subject_hash: string;
          subject_type: string;
          window_started_at: string;
        };
        Update: {
          request_count?: number;
          subject_hash?: string;
          subject_type?: string;
          window_started_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          admin_area_id: string | null;
          created_at: string;
          crops: string[];
          data_sharing_consent: boolean;
          data_sharing_consent_at: string | null;
          deleted_at: string | null;
          full_name: string;
          id: string;
          onboarding_completed_at: string | null;
          phone: string | null;
          preferred_high_contrast: boolean;
          preferred_locale: string;
          preferred_text_size: string;
          preferred_theme: string;
          preferred_unit: Database["public"]["Enums"]["unit_preference"];
          role: Database["public"]["Enums"]["user_role"];
          updated_at: string;
        };
        Insert: {
          admin_area_id?: string | null;
          created_at?: string;
          crops?: string[];
          data_sharing_consent?: boolean;
          data_sharing_consent_at?: string | null;
          deleted_at?: string | null;
          full_name: string;
          id: string;
          onboarding_completed_at?: string | null;
          phone?: string | null;
          preferred_high_contrast?: boolean;
          preferred_locale?: string;
          preferred_text_size?: string;
          preferred_theme?: string;
          preferred_unit?: Database["public"]["Enums"]["unit_preference"];
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Update: {
          admin_area_id?: string | null;
          created_at?: string;
          crops?: string[];
          data_sharing_consent?: boolean;
          data_sharing_consent_at?: string | null;
          deleted_at?: string | null;
          full_name?: string;
          id?: string;
          onboarding_completed_at?: string | null;
          phone?: string | null;
          preferred_high_contrast?: boolean;
          preferred_locale?: string;
          preferred_text_size?: string;
          preferred_theme?: string;
          preferred_unit?: Database["public"]["Enums"]["unit_preference"];
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_admin_area_id_fkey";
            columns: ["admin_area_id"];
            isOneToOne: false;
            referencedRelation: "admin_areas";
            referencedColumns: ["id"];
          },
        ];
      };
      readings: {
        Row: {
          battery_v: number | null;
          column_m: number;
          current_ma: number | null;
          depth_to_water_m: number | null;
          id: number;
          node_id: string;
          quality: Database["public"]["Enums"]["reading_quality"];
          raw: NonNullable<Json>;
          received_at: string;
          recorded_at: string;
          rssi: number | null;
        };
        Insert: {
          battery_v?: number | null;
          column_m: number;
          current_ma?: number | null;
          depth_to_water_m?: number | null;
          id?: number;
          node_id: string;
          quality?: Database["public"]["Enums"]["reading_quality"];
          raw?: NonNullable<Json>;
          received_at?: string;
          recorded_at: string;
          rssi?: number | null;
        };
        Update: {
          battery_v?: number | null;
          column_m?: number;
          current_ma?: number | null;
          depth_to_water_m?: number | null;
          id?: number;
          node_id?: string;
          quality?: Database["public"]["Enums"]["reading_quality"];
          raw?: NonNullable<Json>;
          received_at?: string;
          recorded_at?: string;
          rssi?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "readings_node_id_fkey";
            columns: ["node_id"];
            isOneToOne: false;
            referencedRelation: "nodes";
            referencedColumns: ["id"];
          },
        ];
      };
      report_schedules: {
        Row: {
          active: boolean;
          cadence: string;
          channel: string;
          created_at: string;
          day_of_month: number;
          day_of_week: number;
          id: string;
          last_run_at: string | null;
          locale: string;
          scope: NonNullable<Json>;
          time_utc: string;
          type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          active?: boolean;
          cadence?: string;
          channel?: string;
          created_at?: string;
          day_of_month?: number;
          day_of_week?: number;
          id?: string;
          last_run_at?: string | null;
          locale?: string;
          scope?: NonNullable<Json>;
          time_utc?: string;
          type: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          active?: boolean;
          cadence?: string;
          channel?: string;
          created_at?: string;
          day_of_month?: number;
          day_of_week?: number;
          id?: string;
          last_run_at?: string | null;
          locale?: string;
          scope?: NonNullable<Json>;
          time_utc?: string;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      report_shares: {
        Row: {
          access_count: number;
          created_at: string;
          created_by: string;
          expires_at: string;
          id: string;
          last_accessed_at: string | null;
          report_id: string;
          revoked_at: string | null;
          token_hash: string;
        };
        Insert: {
          access_count?: number;
          created_at?: string;
          created_by: string;
          expires_at?: string;
          id?: string;
          last_accessed_at?: string | null;
          report_id: string;
          revoked_at?: string | null;
          token_hash: string;
        };
        Update: {
          access_count?: number;
          created_at?: string;
          created_by?: string;
          expires_at?: string;
          id?: string;
          last_accessed_at?: string | null;
          report_id?: string;
          revoked_at?: string | null;
          token_hash?: string;
        };
        Relationships: [
          {
            foreignKeyName: "report_shares_report_id_fkey";
            columns: ["report_id"];
            isOneToOne: false;
            referencedRelation: "reports";
            referencedColumns: ["id"];
          },
        ];
      };
      reports: {
        Row: {
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          error: string | null;
          expires_at: string;
          file_size_bytes: number | null;
          format: string;
          id: string;
          params: NonNullable<Json>;
          retry_count: number;
          scope: NonNullable<Json>;
          status: string;
          storage_path: string | null;
          type: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          error?: string | null;
          expires_at?: string;
          file_size_bytes?: number | null;
          format?: string;
          id?: string;
          params?: NonNullable<Json>;
          retry_count?: number;
          scope?: NonNullable<Json>;
          status?: string;
          storage_path?: string | null;
          type: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          error?: string | null;
          expires_at?: string;
          file_size_bytes?: number | null;
          format?: string;
          id?: string;
          params?: NonNullable<Json>;
          retry_count?: number;
          scope?: NonNullable<Json>;
          status?: string;
          storage_path?: string | null;
          type?: string;
        };
        Relationships: [];
      };
      saved_views: {
        Row: {
          created_at: string;
          filters: NonNullable<Json>;
          id: string;
          is_default: boolean;
          is_pinned: boolean;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          filters?: NonNullable<Json>;
          id?: string;
          is_default?: boolean;
          is_pinned?: boolean;
          name: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          filters?: NonNullable<Json>;
          id?: string;
          is_default?: boolean;
          is_pinned?: boolean;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_views_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      translation_feedback: {
        Row: {
          audio_url: string | null;
          created_at: string;
          id: string;
          locale: string;
          message_key: string;
          reported_text: string;
          status: Database["public"]["Enums"]["translation_feedback_status"];
          suggested_text: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          audio_url?: string | null;
          created_at?: string;
          id?: string;
          locale: string;
          message_key: string;
          reported_text: string;
          status?: Database["public"]["Enums"]["translation_feedback_status"];
          suggested_text?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          audio_url?: string | null;
          created_at?: string;
          id?: string;
          locale?: string;
          message_key?: string;
          reported_text?: string;
          status?: Database["public"]["Enums"]["translation_feedback_status"];
          suggested_text?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "translation_feedback_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_notification_channels: {
        Row: {
          channel: Database["public"]["Enums"]["notification_channel"];
          created_at: string;
          enabled: boolean;
          id: string;
          provider_token: string | null;
          updated_at: string;
          user_id: string;
          verified_at: string | null;
        };
        Insert: {
          channel: Database["public"]["Enums"]["notification_channel"];
          created_at?: string;
          enabled?: boolean;
          id?: string;
          provider_token?: string | null;
          updated_at?: string;
          user_id: string;
          verified_at?: string | null;
        };
        Update: {
          channel?: Database["public"]["Enums"]["notification_channel"];
          created_at?: string;
          enabled?: boolean;
          id?: string;
          provider_token?: string | null;
          updated_at?: string;
          user_id?: string;
          verified_at?: string | null;
        };
        Relationships: [];
      };
      user_notification_prefs: {
        Row: {
          created_at: string;
          critical_bypasses_quiet_hours: boolean;
          daily_digest: boolean;
          quiet_hours_end: string | null;
          quiet_hours_start: string | null;
          quiet_hours_tz: string;
          severity_routing: NonNullable<Json>;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          critical_bypasses_quiet_hours?: boolean;
          daily_digest?: boolean;
          quiet_hours_end?: string | null;
          quiet_hours_start?: string | null;
          quiet_hours_tz?: string;
          severity_routing?: NonNullable<Json>;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          critical_bypasses_quiet_hours?: boolean;
          daily_digest?: boolean;
          quiet_hours_end?: string | null;
          quiet_hours_start?: string | null;
          quiet_hours_tz?: string;
          severity_routing?: NonNullable<Json>;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      well_crops: {
        Row: {
          created_at: string;
          crop_id: string;
          sowing_date: string;
          well_id: string;
        };
        Insert: {
          created_at?: string;
          crop_id: string;
          sowing_date: string;
          well_id: string;
        };
        Update: {
          created_at?: string;
          crop_id?: string;
          sowing_date?: string;
          well_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "well_crops_crop_id_fkey";
            columns: ["crop_id"];
            isOneToOne: false;
            referencedRelation: "crop_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "well_crops_well_id_fkey";
            columns: ["well_id"];
            isOneToOne: false;
            referencedRelation: "wells";
            referencedColumns: ["id"];
          },
        ];
      };
      well_insights: {
        Row: {
          as_of: string;
          created_at: string;
          depletion: NonNullable<Json>;
          health: NonNullable<Json>;
          health_band: string | null;
          health_score: number | null;
          id: string;
          is_sufficient: boolean;
          monsoon: NonNullable<Json>;
          pumping: NonNullable<Json>;
          recharge: NonNullable<Json>;
          seasonal: NonNullable<Json>;
          sufficiency: NonNullable<Json>;
          updated_at: string;
          well_id: string;
        };
        Insert: {
          as_of: string;
          created_at?: string;
          depletion?: NonNullable<Json>;
          health?: NonNullable<Json>;
          health_band?: string | null;
          health_score?: number | null;
          id?: string;
          is_sufficient?: boolean;
          monsoon?: NonNullable<Json>;
          pumping?: NonNullable<Json>;
          recharge?: NonNullable<Json>;
          seasonal?: NonNullable<Json>;
          sufficiency?: NonNullable<Json>;
          updated_at?: string;
          well_id: string;
        };
        Update: {
          as_of?: string;
          created_at?: string;
          depletion?: NonNullable<Json>;
          health?: NonNullable<Json>;
          health_band?: string | null;
          health_score?: number | null;
          id?: string;
          is_sufficient?: boolean;
          monsoon?: NonNullable<Json>;
          pumping?: NonNullable<Json>;
          recharge?: NonNullable<Json>;
          seasonal?: NonNullable<Json>;
          sufficiency?: NonNullable<Json>;
          updated_at?: string;
          well_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "well_insights_well_id_fkey";
            columns: ["well_id"];
            isOneToOne: false;
            referencedRelation: "wells";
            referencedColumns: ["id"];
          },
        ];
      };
      well_members: {
        Row: {
          created_at: string | null;
          role: string | null;
          user_id: string;
          well_id: string;
        };
        Insert: {
          created_at?: string | null;
          role?: string | null;
          user_id: string;
          well_id: string;
        };
        Update: {
          created_at?: string | null;
          role?: string | null;
          user_id?: string;
          well_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "well_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "well_members_well_id_fkey";
            columns: ["well_id"];
            isOneToOne: false;
            referencedRelation: "wells";
            referencedColumns: ["id"];
          },
        ];
      };
      wells: {
        Row: {
          admin_area_id: string;
          aquifer_type_id: string | null;
          created_at: string;
          geom: unknown;
          id: string;
          installed_at: string | null;
          latitude: number;
          location: unknown;
          longitude: number;
          name: string;
          notes: string | null;
          owner_id: string | null;
          specific_yield_override: number | null;
          status: Database["public"]["Enums"]["well_status"];
          total_depth_m: number | null;
          updated_at: string;
          visibility: Database["public"]["Enums"]["well_visibility"];
          well_type: Database["public"]["Enums"]["well_type"];
        };
        Insert: {
          admin_area_id: string;
          aquifer_type_id?: string | null;
          created_at?: string;
          geom?: unknown;
          id?: string;
          installed_at?: string | null;
          latitude: number;
          location?: never;
          longitude: number;
          name: string;
          notes?: string | null;
          owner_id?: string | null;
          specific_yield_override?: number | null;
          status?: Database["public"]["Enums"]["well_status"];
          total_depth_m?: number | null;
          updated_at?: string;
          visibility?: Database["public"]["Enums"]["well_visibility"];
          well_type: Database["public"]["Enums"]["well_type"];
        };
        Update: {
          admin_area_id?: string;
          aquifer_type_id?: string | null;
          created_at?: string;
          geom?: unknown;
          id?: string;
          installed_at?: string | null;
          latitude?: number;
          location?: never;
          longitude?: number;
          name?: string;
          notes?: string | null;
          owner_id?: string | null;
          specific_yield_override?: number | null;
          status?: Database["public"]["Enums"]["well_status"];
          total_depth_m?: number | null;
          updated_at?: string;
          visibility?: Database["public"]["Enums"]["well_visibility"];
          well_type?: Database["public"]["Enums"]["well_type"];
        };
        Relationships: [
          {
            foreignKeyName: "wells_admin_area_id_fkey";
            columns: ["admin_area_id"];
            isOneToOne: false;
            referencedRelation: "admin_areas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wells_aquifer_type_id_fkey";
            columns: ["aquifer_type_id"];
            isOneToOne: false;
            referencedRelation: "aquifer_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wells_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      latest_reading: {
        Row: {
          battery_v: number | null;
          column_m: number | null;
          current_ma: number | null;
          depth_to_water_m: number | null;
          node_id: string | null;
          quality: Database["public"]["Enums"]["reading_quality"] | null;
          reading_id: number | null;
          received_at: string | null;
          recorded_at: string | null;
          rssi: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "readings_node_id_fkey";
            columns: ["node_id"];
            isOneToOne: false;
            referencedRelation: "nodes";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      auth_role: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Enums"]["user_role"];
      };
      backfill_well_admin_areas: { Args: Record<PropertyKey, never>; Returns: number };
      calculate_depth_to_water_m: {
        Args: { column_m: number; hang_depth_m: number };
        Returns: number;
      };
      can_manage_well: { Args: { target_well_id: string }; Returns: boolean };
      can_read_well: { Args: { target_well_id: string }; Returns: boolean };
      check_node_rate_limit: { Args: { p_max_reqs: number; p_node_id: string }; Returns: boolean };
      claim_notification_outbox: {
        Args: { batch_size: number };
        Returns: {
          alert_id: string;
          attempts: number;
          channel: Database["public"]["Enums"]["notification_channel"];
          created_at: string;
          error: string | null;
          event: Database["public"]["Enums"]["notification_event"];
          id: string;
          locale: string;
          next_attempt_at: string;
          payload: NonNullable<Json>;
          provider_message_id: string | null;
          sent_at: string | null;
          status: Database["public"]["Enums"]["notification_status"];
          user_id: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "notification_outbox";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      claim_report_jobs: {
        Args: { batch_size: number };
        Returns: {
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          error: string | null;
          expires_at: string;
          file_size_bytes: number | null;
          format: string;
          id: string;
          params: NonNullable<Json>;
          retry_count: number;
          scope: NonNullable<Json>;
          status: string;
          storage_path: string | null;
          type: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "reports";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      consume_otp_rate_limit: {
        Args: { p_destination_hash: string; p_destination_type: string; p_ip_hash: string };
        Returns: boolean;
      };
      get_insurer_village_stats: {
        Args: { p_area_id: string; p_min_wells?: number };
        Returns: {
          area_id: string;
          as_of: string;
          avg_depth_m: number;
          consenting_wells_count: number;
          median_depth_m: number;
          nodes_online: number;
          pct_critical: number;
          pct_offline: number;
          pct_warning: number;
          privacy_masked: boolean;
          privacy_reason: string;
        }[];
      };
      get_insurer_village_timeseries: {
        Args: {
          p_area_id: string;
          p_bucket?: string;
          p_end_date: string;
          p_min_wells?: number;
          p_start_date: string;
        };
        Returns: {
          avg_depth_m: number;
          bucket_ts: string;
          consenting_wells_count: number;
          median_depth_m: number;
          privacy_masked: boolean;
        }[];
      };
      get_trend: {
        Args: { p_hours: number; p_well_id: string };
        Returns: {
          depth_to_water_m: number;
          recorded_at: string;
        }[];
      };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      readings_bucketed: {
        Args: {
          p_bucket: Database["public"]["Enums"]["bucket_interval"];
          p_from: string;
          p_node_ids: string[];
          p_to: string;
        };
        Returns: {
          avg_depth: number;
          bucket_time: string;
          max_depth: number;
          min_depth: number;
          node_id: string;
          reading_count: number;
        }[];
      };
      refresh_area_stats: { Args: Record<PropertyKey, never>; Returns: undefined };
      user_area_ids: { Args: Record<PropertyKey, never>; Returns: string[] };
    };
    Enums: {
      admin_area_level: "state" | "district" | "block" | "village";
      alert_metric: "depth_to_water" | "battery" | "node_offline";
      alert_resolved_reason: "auto" | "manual";
      alert_rule_scope: "well" | "area_default" | "global_default";
      alert_rule_type: "level_below" | "drop_rate" | "no_data" | "low_battery" | "sensor_fault";
      alert_severity: "info" | "warning" | "critical";
      alert_status: "open" | "acknowledged" | "snoozed" | "resolved";
      area_note_status: "open" | "in_progress" | "done";
      bucket_interval: "raw" | "hourly" | "daily";
      comparison_operator: "above" | "below";
      node_status: "provisioning" | "active" | "offline" | "fault" | "retired";
      notification_channel: "sms" | "email" | "push" | "whatsapp" | "telegram";
      notification_event: "opened" | "escalated" | "resolved" | "digest";
      notification_status: "pending" | "sending" | "sent" | "failed" | "skipped";
      reading_quality: "good" | "suspect" | "bad";
      translation_feedback_status: "pending" | "reviewed" | "implemented" | "rejected";
      unit_preference: "m" | "ft";
      user_role: "farmer" | "village_admin" | "official" | "insurer" | "admin";
      well_status: "active" | "inactive" | "decommissioned" | "planned" | "dry";
      well_type: "borewell" | "open_well" | "tank" | "pond";
      well_visibility: "private" | "admin_area" | "public";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      admin_area_level: ["state", "district", "block", "village"],
      alert_metric: ["depth_to_water", "battery", "node_offline"],
      alert_resolved_reason: ["auto", "manual"],
      alert_rule_scope: ["well", "area_default", "global_default"],
      alert_rule_type: ["level_below", "drop_rate", "no_data", "low_battery", "sensor_fault"],
      alert_severity: ["info", "warning", "critical"],
      alert_status: ["open", "acknowledged", "snoozed", "resolved"],
      area_note_status: ["open", "in_progress", "done"],
      bucket_interval: ["raw", "hourly", "daily"],
      comparison_operator: ["above", "below"],
      node_status: ["provisioning", "active", "offline", "fault", "retired"],
      notification_channel: ["sms", "email", "push", "whatsapp", "telegram"],
      notification_event: ["opened", "escalated", "resolved", "digest"],
      notification_status: ["pending", "sending", "sent", "failed", "skipped"],
      reading_quality: ["good", "suspect", "bad"],
      translation_feedback_status: ["pending", "reviewed", "implemented", "rejected"],
      unit_preference: ["m", "ft"],
      user_role: ["farmer", "village_admin", "official", "insurer", "admin"],
      well_status: ["active", "inactive", "decommissioned", "planned", "dry"],
      well_type: ["borewell", "open_well", "tank", "pond"],
      well_visibility: ["private", "admin_area", "public"],
    },
  },
} as const;
