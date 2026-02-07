export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          id: string
          category_id: string
          name: string
          description: string | null
          price: number
          weight_grams: number | null
          image_url: string | null
          active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          category_id: string
          name: string
          description?: string | null
          price: number
          weight_grams?: number | null
          image_url?: string | null
          active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          name?: string
          description?: string | null
          price?: number
          weight_grams?: number | null
          image_url?: string | null
          active?: boolean
          sort_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      pizza_days: {
        Row: {
          id: string
          date: string
          active: boolean
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          active?: boolean
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          active?: boolean
          note?: string | null
          created_at?: string
        }
        Relationships: []
      }
      time_slots: {
        Row: {
          id: string
          pizza_day_id: string
          time_from: string
          time_to: string
          max_pizzas: number
          current_pizza_count: number
          is_open: boolean
          created_at: string
        }
        Insert: {
          id?: string
          pizza_day_id: string
          time_from: string
          time_to: string
          max_pizzas?: number
          current_pizza_count?: number
          is_open?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          pizza_day_id?: string
          time_from?: string
          time_to?: string
          max_pizzas?: number
          current_pizza_count?: number
          is_open?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_slots_pizza_day_id_fkey"
            columns: ["pizza_day_id"]
            isOneToOne: false
            referencedRelation: "pizza_days"
            referencedColumns: ["id"]
          }
        ]
      }
      orders: {
        Row: {
          id: string
          time_slot_id: string
          pizza_day_id: string
          customer_name: string
          customer_phone: string
          customer_email: string | null
          customer_address: string | null
          customer_note: string | null
          status: string
          total_price: number
          pizza_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          time_slot_id: string
          pizza_day_id: string
          customer_name: string
          customer_phone: string
          customer_email?: string | null
          customer_address?: string | null
          customer_note?: string | null
          status?: string
          total_price: number
          pizza_count: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          time_slot_id?: string
          pizza_day_id?: string
          customer_name?: string
          customer_phone?: string
          customer_email?: string | null
          customer_address?: string | null
          customer_note?: string | null
          status?: string
          total_price?: number
          pizza_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_time_slot_id_fkey"
            columns: ["time_slot_id"]
            isOneToOne: false
            referencedRelation: "time_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_pizza_day_id_fkey"
            columns: ["pizza_day_id"]
            isOneToOne: false
            referencedRelation: "pizza_days"
            referencedColumns: ["id"]
          }
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          menu_item_id: string
          item_name: string
          item_price: number
          quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          menu_item_id: string
          item_name: string
          item_price: number
          quantity: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          menu_item_id?: string
          item_name?: string
          item_price?: number
          quantity?: number
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
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          }
        ]
      }
      admin_profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      place_order: {
        Args: {
          p_time_slot_id: string
          p_pizza_day_id: string
          p_customer_name: string
          p_customer_phone: string
          p_customer_email?: string
          p_customer_address?: string
          p_customer_note?: string
          p_items?: Json
          p_pizza_count?: number
        }
        Returns: Json
      }
      cancel_order: {
        Args: {
          p_order_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
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

export type OrderStatus = 'nova' | 'potvrdena' | 'pripravuje_sa' | 'hotova' | 'vydana' | 'zrusena'

export type Category = Database['public']['Tables']['categories']['Row']
export type MenuItem = Database['public']['Tables']['menu_items']['Row']
export type PizzaDay = Database['public']['Tables']['pizza_days']['Row']
export type TimeSlot = Database['public']['Tables']['time_slots']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type AdminProfile = Database['public']['Tables']['admin_profiles']['Row']
