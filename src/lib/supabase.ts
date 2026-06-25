import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types pour les tables de la base de données
export type Database = {
  public: {
    Tables: {
      // Table des utilisateurs
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      // Table des revenus
      incomes: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          category: string;
          description: string | null;
          date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          category: string;
          description?: string | null;
          date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          category?: string;
          description?: string | null;
          date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };

      // Table des dépenses
      expenses: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          category: string;
          description: string | null;
          date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          category: string;
          description?: string | null;
          date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          category?: string;
          description?: string | null;
          date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };

      // Table des produits
      products: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          category: string;
          purchase_price: number;
          selling_price: number;
          quantity: number;
          min_quantity: number;
          supplier: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          category: string;
          purchase_price: number;
          selling_price: number;
          quantity: number;
          min_quantity: number;
          supplier?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          category?: string;
          purchase_price?: number;
          selling_price?: number;
          quantity?: number;
          min_quantity?: number;
          supplier?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      // Table des ventes
      sales: {
        Row: {
          id: string;
          user_id: string;
          sale_number: string;
          customer_name: string | null;
          total_amount: number;
          discount: number;
          profit: number;
          date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          sale_number: string;
          customer_name?: string | null;
          total_amount: number;
          discount: number;
          profit: number;
          date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          sale_number?: string;
          customer_name?: string | null;
          total_amount?: number;
          discount?: number;
          profit?: number;
          date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };

      // Table des articles vendus
      sale_items: {
        Row: {
          id: string;
          sale_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          profit: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          sale_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          profit: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          sale_id?: string;
          product_id?: string;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
          profit?: number;
          created_at?: string;
        };
      };

      // Table des objectifs d'épargne
      savings_goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          target_amount: number;
          current_amount: number;
          target_date: string;
          description: string | null;
          status: 'active' | 'completed' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          target_amount: number;
          current_amount?: number;
          target_date: string;
          description?: string | null;
          status?: 'active' | 'completed' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          target_amount?: number;
          current_amount?: number;
          target_date?: string;
          description?: string | null;
          status?: 'active' | 'completed' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
      };

      // Table des dettes
      debts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          amount: number;
          debt_type: 'given' | 'received';
          date: string;
          due_date: string | null;
          status: 'pending' | 'partial' | 'paid' | 'cancelled';
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          amount: number;
          debt_type: 'given' | 'received';
          date: string;
          due_date?: string | null;
          status?: 'pending' | 'partial' | 'paid' | 'cancelled';
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          amount?: number;
          debt_type?: 'given' | 'received';
          date?: string;
          due_date?: string | null;
          status?: 'pending' | 'partial' | 'paid' | 'cancelled';
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      // Table des remboursements de dettes
      debt_payments: {
        Row: {
          id: string;
          debt_id: string;
          amount: number;
          payment_date: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          debt_id: string;
          amount: number;
          payment_date: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          debt_id?: string;
          amount?: number;
          payment_date?: string;
          description?: string | null;
          created_at?: string;
        };
      };

      // Table des notifications
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: 'info' | 'warning' | 'error' | 'success';
          is_read: boolean;
          related_table: string | null;
          related_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type?: 'info' | 'warning' | 'error' | 'success';
          is_read?: boolean;
          related_table?: string | null;
          related_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: 'info' | 'warning' | 'error' | 'success';
          is_read?: boolean;
          related_table?: string | null;
          related_id?: string | null;
          created_at?: string;
        };
      };

      // Table des logs d'actions
      action_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          table_name: string;
          record_id: string | null;
          old_values: any | null;
          new_values: any | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          table_name: string;
          record_id?: string | null;
          old_values?: any | null;
          new_values?: any | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          table_name?: string;
          record_id?: string | null;
          old_values?: any | null;
          new_values?: any | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTypes<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTypes<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
