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
      drink: {
        Row: {
          category_id: number
          created_at: string
          id: number
          name: string
          price: number
        }
        Insert: {
          category_id: number
          created_at?: string
          id?: number
          name: string
          price: number
        }
        Update: {
          category_id?: number
          created_at?: string
          id?: number
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "drink_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "drinkcategory"
            referencedColumns: ["id"]
          },
        ]
      }
      drinkcategory: {
        Row: {
          category_image_url: string
          created_at: string
          id: number
          name: string
          slug: string
        }
        Insert: {
          category_image_url: string
          created_at?: string
          id?: number
          name: string
          slug?: string
        }
        Update: {
          category_image_url?: string
          created_at?: string
          id?: number
          name?: string
          slug?: string
        }
        Relationships: []
      }
      order: {
        Row: {
          created_at: string
          id: number
          staff_id: string
          status: string
          table_number: number
        }
        Insert: {
          created_at?: string
          id?: number
          staff_id: string
          status: string
          table_number: number
        }
        Update: {
          created_at?: string
          id?: number
          staff_id?: string
          status?: string
          table_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["userId"]
          },
        ]
      }
      order_detail: {
        Row: {
          created_at: string
          drink_id: number
          id: number
          note: string
          order_id: number
          quantity: number
        }
        Insert: {
          created_at?: string
          drink_id: number
          id?: number
          note: string
          order_id: number
          quantity: number
        }
        Update: {
          created_at?: string
          drink_id?: number
          id?: number
          note?: string
          order_id?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_detail_drink_id_fkey"
            columns: ["drink_id"]
            isOneToOne: false
            referencedRelation: "drink"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_detail_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          created_at: string
          role: string
          staffName: string
          userId: string
        }
        Insert: {
          created_at?: string
          role: string
          staffName: string
          userId: string
        }
        Update: {
          created_at?: string
          role?: string
          staffName?: string
          userId?: string
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
