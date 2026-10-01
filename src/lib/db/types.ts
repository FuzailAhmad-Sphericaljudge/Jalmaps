export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      admin_areas: {
        Row: {
          boundary_ref: string | null;
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
          boundary_ref?: string | null;
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
          boundary_ref?: string | null;
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
      alert_rules: {
        Row: {
          admin_area_id: string | null;
          channels: Database["public"]["Enums"]["notification_channel"][];
          cooldown_minutes: number;
          created_at: string;
          created_by: string;
          enabled: boolean;
          id: string;
          metric: Database["public"]["Enums"]["alert_metric"];
          operator: Database["public"]["Enums"]["comparison_operator"] | null;
          severity: Database["public"]["Enums"]["alert_severity"];
          threshold: number | null;
          updated_at: string;
          well_id: string | null;
        };
        Insert: {
          admin_area_id?: string | null;
          channels?: Database["public"]["Enums"]["notification_channel"][];
          cooldown_minutes?: number;
          created_at?: string;
          created_by: string;
          enabled?: boolean;
          id?: string;
          metric: Database["public"]["Enums"]["alert_metric"];
          operator?: Database["public"]["Enums"]["comparison_operator"] | null;
          severity?: Database["public"]["Enums"]["alert_severity"];
          threshold?: number | null;
          updated_at?: string;
          well_id?: string | null;
        };
        Update: {
          admin_area_id?: string | null;
          channels?: Database["public"]["Enums"]["notification_channel"][];
          cooldown_minutes?: number;
          created_at?: string;
          created_by?: string;
          enabled?: boolean;
          id?: string;
          metric?: Database["public"]["Enums"]["alert_metric"];
          operator?: Database["public"]["Enums"]["comparison_operator"] | null;
          severity?: Database["public"]["Enums"]["alert_severity"];
          threshold?: number | null;
          updated_at?: string;
          well_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "alert_rules_admin_area_id_fkey";
            columns: ["admin_area_id"];
            isOneToOne: false;
            referencedRelation: "admin_areas";
            referencedColumns: ["id"];
          },
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
          details: NonNullable<Json>;
          id: string;
          message_key: string;
          metric: Database["public"]["Enums"]["alert_metric"];
          node_id: string | null;
          resolved_at: string | null;
          rule_id: string | null;
          severity: Database["public"]["Enums"]["alert_severity"];
          status: Database["public"]["Enums"]["alert_status"];
          triggered_at: string;
          updated_at: string;
          well_id: string;
        };
        Insert: {
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          created_at?: string;
          details?: NonNullable<Json>;
          id?: string;
          message_key: string;
          metric: Database["public"]["Enums"]["alert_metric"];
          node_id?: string | null;
          resolved_at?: string | null;
          rule_id?: string | null;
          severity: Database["public"]["Enums"]["alert_severity"];
          status?: Database["public"]["Enums"]["alert_status"];
          triggered_at?: string;
          updated_at?: string;
          well_id: string;
        };
        Update: {
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          created_at?: string;
          details?: NonNullable<Json>;
          id?: string;
          message_key?: string;
          metric?: Database["public"]["Enums"]["alert_metric"];
          node_id?: string | null;
          resolved_at?: string | null;
          rule_id?: string | null;
          severity?: Database["public"]["Enums"]["alert_severity"];
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
      nodes: {
        Row: {
          api_key_hash: string | null;
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
          sensor_model: string | null;
          signal_rssi: number | null;
          status: Database["public"]["Enums"]["node_status"];
          updated_at: string;
          well_id: string;
        };
        Insert: {
          api_key_hash?: string | null;
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
          sensor_model?: string | null;
          signal_rssi?: number | null;
          status?: Database["public"]["Enums"]["node_status"];
          updated_at?: string;
          well_id: string;
        };
        Update: {
          api_key_hash?: string | null;
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
      profiles: {
        Row: {
          admin_area_id: string | null;
          created_at: string;
          crops: string[];
          deleted_at: string | null;
          full_name: string;
          id: string;
          onboarding_completed_at: string | null;
          phone: string | null;
          preferred_locale: string;
          preferred_unit: Database["public"]["Enums"]["unit_preference"];
          role: Database["public"]["Enums"]["user_role"];
          updated_at: string;
        };
        Insert: {
          admin_area_id?: string | null;
          created_at?: string;
          crops?: string[];
          deleted_at?: string | null;
          full_name: string;
          id: string;
          onboarding_completed_at?: string | null;
          phone?: string | null;
          preferred_locale?: string;
          preferred_unit?: Database["public"]["Enums"]["unit_preference"];
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Update: {
          admin_area_id?: string | null;
          created_at?: string;
          crops?: string[];
          deleted_at?: string | null;
          full_name?: string;
          id?: string;
          onboarding_completed_at?: string | null;
          phone?: string | null;
          preferred_locale?: string;
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
      wells: {
        Row: {
          admin_area_id: string;
          created_at: string;
          id: string;
          installed_at: string | null;
          latitude: number;
          location: unknown;
          longitude: number;
          name: string;
          notes: string | null;
          owner_id: string | null;
          status: Database["public"]["Enums"]["well_status"];
          total_depth_m: number | null;
          updated_at: string;
          visibility: Database["public"]["Enums"]["well_visibility"];
          well_type: Database["public"]["Enums"]["well_type"];
        };
        Insert: {
          admin_area_id: string;
          created_at?: string;
          id?: string;
          installed_at?: string | null;
          latitude: number;
          location?: never;
          longitude: number;
          name: string;
          notes?: string | null;
          owner_id?: string | null;
          status?: Database["public"]["Enums"]["well_status"];
          total_depth_m?: number | null;
          updated_at?: string;
          visibility?: Database["public"]["Enums"]["well_visibility"];
          well_type: Database["public"]["Enums"]["well_type"];
        };
        Update: {
          admin_area_id?: string;
          created_at?: string;
          id?: string;
          installed_at?: string | null;
          latitude?: number;
          location?: never;
          longitude?: number;
          name?: string;
          notes?: string | null;
          owner_id?: string | null;
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
      calculate_depth_to_water_m: {
        Args: { column_m: number; hang_depth_m: number };
        Returns: number;
      };
      can_manage_well: { Args: { target_well_id: string }; Returns: boolean };
      can_read_well: { Args: { target_well_id: string }; Returns: boolean };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      user_area_ids: { Args: Record<PropertyKey, never>; Returns: string[] };
    };
    Enums: {
      admin_area_level: "state" | "district" | "block" | "village";
      alert_metric: "depth_to_water" | "battery" | "node_offline";
      alert_severity: "info" | "warning" | "critical";
      alert_status: "open" | "acknowledged" | "resolved";
      comparison_operator: "above" | "below";
      node_status: "provisioning" | "active" | "offline" | "fault" | "retired";
      notification_channel: "sms" | "email" | "push" | "whatsapp";
      reading_quality: "good" | "suspect" | "bad";
      unit_preference: "m" | "ft";
      user_role: "farmer" | "village_admin" | "official" | "insurer" | "admin";
      well_status: "active" | "inactive" | "decommissioned";
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
      alert_severity: ["info", "warning", "critical"],
      alert_status: ["open", "acknowledged", "resolved"],
      comparison_operator: ["above", "below"],
      node_status: ["provisioning", "active", "offline", "fault", "retired"],
      notification_channel: ["sms", "email", "push", "whatsapp"],
      reading_quality: ["good", "suspect", "bad"],
      unit_preference: ["m", "ft"],
      user_role: ["farmer", "village_admin", "official", "insurer", "admin"],
      well_status: ["active", "inactive", "decommissioned"],
      well_type: ["borewell", "open_well", "tank", "pond"],
      well_visibility: ["private", "admin_area", "public"],
    },
  },
} as const;
