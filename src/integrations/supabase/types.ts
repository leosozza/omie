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
      bitrix_cached_fields: {
        Row: {
          cached_at: string | null
          entity_type: Database["public"]["Enums"]["bitrix_entity"]
          field_code: string
          field_name: string
          field_type: string | null
          id: string
          is_custom: boolean | null
          is_required: boolean | null
          options: Json | null
          spa_type_id: number | null
          tenant_id: string
        }
        Insert: {
          cached_at?: string | null
          entity_type: Database["public"]["Enums"]["bitrix_entity"]
          field_code: string
          field_name: string
          field_type?: string | null
          id?: string
          is_custom?: boolean | null
          is_required?: boolean | null
          options?: Json | null
          spa_type_id?: number | null
          tenant_id: string
        }
        Update: {
          cached_at?: string | null
          entity_type?: Database["public"]["Enums"]["bitrix_entity"]
          field_code?: string
          field_name?: string
          field_type?: string | null
          id?: string
          is_custom?: boolean | null
          is_required?: boolean | null
          options?: Json | null
          spa_type_id?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bitrix_cached_fields_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "bitrix_installations"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "bitrix_cached_fields_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "bitrix_installations_safe"
            referencedColumns: ["member_id"]
          },
        ]
      }
      bitrix_installations: {
        Row: {
          access_token: string | null
          application_token: string | null
          client_endpoint: string | null
          domain: string
          expires_at: string | null
          fields_provisioned: boolean | null
          id: string
          installed_at: string | null
          member_id: string
          placements_registered: boolean | null
          refresh_token: string | null
          robots_registered: boolean | null
          status: Database["public"]["Enums"]["installation_status"]
          updated_at: string | null
        }
        Insert: {
          access_token?: string | null
          application_token?: string | null
          client_endpoint?: string | null
          domain: string
          expires_at?: string | null
          fields_provisioned?: boolean | null
          id?: string
          installed_at?: string | null
          member_id: string
          placements_registered?: boolean | null
          refresh_token?: string | null
          robots_registered?: boolean | null
          status?: Database["public"]["Enums"]["installation_status"]
          updated_at?: string | null
        }
        Update: {
          access_token?: string | null
          application_token?: string | null
          client_endpoint?: string | null
          domain?: string
          expires_at?: string | null
          fields_provisioned?: boolean | null
          id?: string
          installed_at?: string | null
          member_id?: string
          placements_registered?: boolean | null
          refresh_token?: string | null
          robots_registered?: boolean | null
          status?: Database["public"]["Enums"]["installation_status"]
          updated_at?: string | null
        }
        Relationships: []
      }
      field_mappings: {
        Row: {
          bitrix_entity: Database["public"]["Enums"]["bitrix_entity"]
          bitrix_field_code: string
          bitrix_field_name: string | null
          bitrix_field_type: string | null
          created_at: string | null
          direction: Database["public"]["Enums"]["mapping_direction"] | null
          id: string
          is_active: boolean | null
          is_custom_field: boolean | null
          is_required: boolean | null
          omie_entity: string
          omie_field_code: string
          omie_field_name: string | null
          omie_field_type: string | null
          spa_type_id: number | null
          tenant_id: string
          transform_rule: Json | null
          updated_at: string | null
        }
        Insert: {
          bitrix_entity: Database["public"]["Enums"]["bitrix_entity"]
          bitrix_field_code: string
          bitrix_field_name?: string | null
          bitrix_field_type?: string | null
          created_at?: string | null
          direction?: Database["public"]["Enums"]["mapping_direction"] | null
          id?: string
          is_active?: boolean | null
          is_custom_field?: boolean | null
          is_required?: boolean | null
          omie_entity: string
          omie_field_code: string
          omie_field_name?: string | null
          omie_field_type?: string | null
          spa_type_id?: number | null
          tenant_id: string
          transform_rule?: Json | null
          updated_at?: string | null
        }
        Update: {
          bitrix_entity?: Database["public"]["Enums"]["bitrix_entity"]
          bitrix_field_code?: string
          bitrix_field_name?: string | null
          bitrix_field_type?: string | null
          created_at?: string | null
          direction?: Database["public"]["Enums"]["mapping_direction"] | null
          id?: string
          is_active?: boolean | null
          is_custom_field?: boolean | null
          is_required?: boolean | null
          omie_entity?: string
          omie_field_code?: string
          omie_field_name?: string | null
          omie_field_type?: string | null
          spa_type_id?: number | null
          tenant_id?: string
          transform_rule?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "field_mappings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "bitrix_installations"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "field_mappings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "bitrix_installations_safe"
            referencedColumns: ["member_id"]
          },
        ]
      }
      integration_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          error_message: string | null
          execution_time_ms: number | null
          id: string
          request_payload: Json | null
          response_payload: Json | null
          status: string
          tenant_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          request_payload?: Json | null
          response_payload?: Json | null
          status: string
          tenant_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          request_payload?: Json | null
          response_payload?: Json | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "bitrix_installations"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "integration_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "bitrix_installations_safe"
            referencedColumns: ["member_id"]
          },
        ]
      }
      omie_cached_fields: {
        Row: {
          cached_at: string | null
          entity_type: string
          field_code: string
          field_name: string
          field_type: string | null
          id: string
          is_required: boolean | null
          options: Json | null
          tenant_id: string
        }
        Insert: {
          cached_at?: string | null
          entity_type: string
          field_code: string
          field_name: string
          field_type?: string | null
          id?: string
          is_required?: boolean | null
          options?: Json | null
          tenant_id: string
        }
        Update: {
          cached_at?: string | null
          entity_type?: string
          field_code?: string
          field_name?: string
          field_type?: string | null
          id?: string
          is_required?: boolean | null
          options?: Json | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "omie_cached_fields_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "bitrix_installations"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "omie_cached_fields_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "bitrix_installations_safe"
            referencedColumns: ["member_id"]
          },
        ]
      }
      omie_configurations: {
        Row: {
          app_key: string
          app_secret: string
          created_at: string | null
          environment: string | null
          id: string
          is_active: boolean | null
          last_error: string | null
          last_sync: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          app_key: string
          app_secret: string
          created_at?: string | null
          environment?: string | null
          id?: string
          is_active?: boolean | null
          last_error?: string | null
          last_sync?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          app_key?: string
          app_secret?: string
          created_at?: string | null
          environment?: string | null
          id?: string
          is_active?: boolean | null
          last_error?: string | null
          last_sync?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "omie_configurations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "bitrix_installations"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "omie_configurations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "bitrix_installations_safe"
            referencedColumns: ["member_id"]
          },
        ]
      }
      purchase_config: {
        Row: {
          bitrix_field: string | null
          config_type: string
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          omie_code: string
          omie_name: string
          percentual: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          bitrix_field?: string | null
          config_type: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          omie_code: string
          omie_name: string
          percentual?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          bitrix_field?: string | null
          config_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          omie_code?: string
          omie_name?: string
          percentual?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "bitrix_installations"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "purchase_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "bitrix_installations_safe"
            referencedColumns: ["member_id"]
          },
        ]
      }
      robots_registry: {
        Row: {
          created_at: string | null
          entity_type: Database["public"]["Enums"]["bitrix_entity"]
          id: string
          is_registered: boolean | null
          last_error: string | null
          registered_at: string | null
          robot_code: string
          robot_name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          entity_type: Database["public"]["Enums"]["bitrix_entity"]
          id?: string
          is_registered?: boolean | null
          last_error?: string | null
          registered_at?: string | null
          robot_code: string
          robot_name: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          entity_type?: Database["public"]["Enums"]["bitrix_entity"]
          id?: string
          is_registered?: boolean | null
          last_error?: string | null
          registered_at?: string | null
          robot_code?: string
          robot_name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "robots_registry_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "bitrix_installations"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "robots_registry_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "bitrix_installations_safe"
            referencedColumns: ["member_id"]
          },
        ]
      }
      sync_queue: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string
          entity_type: string
          error_message: string | null
          id: string
          max_retries: number | null
          next_retry_at: string | null
          payload: Json
          priority: number | null
          processed_at: string | null
          retry_count: number | null
          status: Database["public"]["Enums"]["sync_status"] | null
          tenant_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          error_message?: string | null
          id?: string
          max_retries?: number | null
          next_retry_at?: string | null
          payload: Json
          priority?: number | null
          processed_at?: string | null
          retry_count?: number | null
          status?: Database["public"]["Enums"]["sync_status"] | null
          tenant_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          error_message?: string | null
          id?: string
          max_retries?: number | null
          next_retry_at?: string | null
          payload?: Json
          priority?: number | null
          processed_at?: string | null
          retry_count?: number | null
          status?: Database["public"]["Enums"]["sync_status"] | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_queue_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "bitrix_installations"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "sync_queue_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "bitrix_installations_safe"
            referencedColumns: ["member_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "bitrix_installations"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "bitrix_installations_safe"
            referencedColumns: ["member_id"]
          },
        ]
      }
    }
    Views: {
      bitrix_installations_safe: {
        Row: {
          domain: string | null
          expires_at: string | null
          fields_provisioned: boolean | null
          id: string | null
          installed_at: string | null
          member_id: string | null
          robots_registered: boolean | null
          status: Database["public"]["Enums"]["installation_status"] | null
          updated_at: string | null
        }
        Insert: {
          domain?: string | null
          expires_at?: string | null
          fields_provisioned?: boolean | null
          id?: string | null
          installed_at?: string | null
          member_id?: string | null
          robots_registered?: boolean | null
          status?: Database["public"]["Enums"]["installation_status"] | null
          updated_at?: string | null
        }
        Update: {
          domain?: string | null
          expires_at?: string | null
          fields_provisioned?: boolean | null
          id?: string | null
          installed_at?: string | null
          member_id?: string | null
          robots_registered?: boolean | null
          status?: Database["public"]["Enums"]["installation_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_tenant: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _tenant_id: string
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "viewer"
      bitrix_entity: "lead" | "deal" | "contact" | "company" | "spa"
      installation_status: "active" | "expired" | "revoked" | "pending"
      mapping_direction: "omie_to_bitrix" | "bitrix_to_omie" | "bidirectional"
      sync_status: "pending" | "processing" | "success" | "error" | "retrying"
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
      app_role: ["admin", "user", "viewer"],
      bitrix_entity: ["lead", "deal", "contact", "company", "spa"],
      installation_status: ["active", "expired", "revoked", "pending"],
      mapping_direction: ["omie_to_bitrix", "bitrix_to_omie", "bidirectional"],
      sync_status: ["pending", "processing", "success", "error", "retrying"],
    },
  },
} as const
