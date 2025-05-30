export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      creator_gifts: {
        Row: {
          amount: number
          brand_name: string
          created_at: string
          creator_email: string
          creator_id: string
          draft_order_shopify_id: string | null
          id: string
          order_shopify_id: string | null
          page_campaign_fixed_subdomain: string | null
          page_campaign_name: string | null
          page_campaign_subdomain: string | null
          products: Json | null
          quantity: number
          updated_at: string
          user_id: string
          webhook_created_at: string | null
          webhook_updated_at: string | null
        }
        Insert: {
          amount: number
          brand_name: string
          created_at?: string
          creator_email: string
          creator_id: string
          draft_order_shopify_id?: string | null
          id?: string
          order_shopify_id?: string | null
          page_campaign_fixed_subdomain?: string | null
          page_campaign_name?: string | null
          page_campaign_subdomain?: string | null
          products?: Json | null
          quantity?: number
          updated_at?: string
          user_id: string
          webhook_created_at?: string | null
          webhook_updated_at?: string | null
        }
        Update: {
          amount?: number
          brand_name?: string
          created_at?: string
          creator_email?: string
          creator_id?: string
          draft_order_shopify_id?: string | null
          id?: string
          order_shopify_id?: string | null
          page_campaign_fixed_subdomain?: string | null
          page_campaign_name?: string | null
          page_campaign_subdomain?: string | null
          products?: Json | null
          quantity?: number
          updated_at?: string
          user_id?: string
          webhook_created_at?: string | null
          webhook_updated_at?: string | null
        }
        Relationships: []
      }
      customer_orders: {
        Row: {
          created_at: string
          customer_email: string
          customer_name: string | null
          id: string
          order_date: string
          order_id: string
          order_total: number
          shopify_client_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_email: string
          customer_name?: string | null
          id?: string
          order_date: string
          order_id: string
          order_total?: number
          shopify_client_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          customer_email?: string
          customer_name?: string | null
          id?: string
          order_date?: string
          order_id?: string
          order_total?: number
          shopify_client_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_orders_shopify_client_id_fkey"
            columns: ["shopify_client_id"]
            isOneToOne: false
            referencedRelation: "shopify_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_spending_analysis: {
        Row: {
          analysis_date: string
          created_at: string
          customer_email: string
          customer_name: string | null
          customer_order_id: string | null
          id: string
          influencer_id: string | null
          shopify_client_id: string | null
          total_spent: number | null
          user_id: string
        }
        Insert: {
          analysis_date?: string
          created_at?: string
          customer_email: string
          customer_name?: string | null
          customer_order_id?: string | null
          id?: string
          influencer_id?: string | null
          shopify_client_id?: string | null
          total_spent?: number | null
          user_id: string
        }
        Update: {
          analysis_date?: string
          created_at?: string
          customer_email?: string
          customer_name?: string | null
          customer_order_id?: string | null
          id?: string
          influencer_id?: string | null
          shopify_client_id?: string | null
          total_spent?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "influencer_spending_analysis_customer_order_id_fkey"
            columns: ["customer_order_id"]
            isOneToOne: false
            referencedRelation: "customer_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_spending_analysis_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_spending_analysis_shopify_client_id_fkey"
            columns: ["shopify_client_id"]
            isOneToOne: false
            referencedRelation: "shopify_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      influencers: {
        Row: {
          category: string | null
          created_at: string
          email: string
          engagement_rate: number | null
          follower_count: number | null
          id: string
          instagram_handle: string | null
          name: string | null
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          email: string
          engagement_rate?: number | null
          follower_count?: number | null
          id?: string
          instagram_handle?: string | null
          name?: string | null
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          email?: string
          engagement_rate?: number | null
          follower_count?: number | null
          id?: string
          instagram_handle?: string | null
          name?: string | null
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      shopify_clients: {
        Row: {
          admin_api_key: string
          client_name: string
          created_at: string
          id: string
          shopify_url: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_api_key: string
          client_name: string
          created_at?: string
          id?: string
          shopify_url: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_api_key?: string
          client_name?: string
          created_at?: string
          id?: string
          shopify_url?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
