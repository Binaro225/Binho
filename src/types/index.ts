// Types pour les catégories

export type IncomeCategory = 
  | 'salaire'
  | 'freelance'
  | 'vente'
  | 'cadeau'
  | 'commission'
  | 'autre';

export type ExpenseCategory = 
  | 'nourriture'
  | 'transport'
  | 'internet'
  | 'sante'
  | 'education'
  | 'loyer'
  | 'divertissement'
  | 'autre';

export type ProductCategory = string; // Peut être personnalisé

// Types pour les statuts
export type DebtType = 'given' | 'received';
export type DebtStatus = 'pending' | 'partial' | 'paid' | 'cancelled';
export type SavingsStatus = 'active' | 'completed' | 'cancelled';
export type NotificationType = 'info' | 'warning' | 'error' | 'success';

// Types pour les données financières
export interface Income {
  id: string;
  user_id: string;
  amount: number;
  category: IncomeCategory;
  description: string | null;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: ExpenseCategory;
  description: string | null;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: ProductCategory;
  purchase_price: number;
  selling_price: number;
  quantity: number;
  min_quantity: number;
  supplier: string | null;
  created_at: string;
  updated_at: string;
}

export interface Sale {
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
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  profit: number;
  created_at: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  description: string | null;
  status: SavingsStatus;
  created_at: string;
  updated_at: string;
}

export interface Debt {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  debt_type: DebtType;
  date: string;
  due_date: string | null;
  status: DebtStatus;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface DebtPayment {
  id: string;
  debt_id: string;
  amount: number;
  payment_date: string;
  description: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  related_table: string | null;
  related_id: string | null;
  created_at: string;
}

// Types pour les statistiques du dashboard
export interface DashboardStats {
  total_balance: number;
  monthly_income: number;
  monthly_expenses: number;
  monthly_profit: number;
  current_savings: number;
  current_debt: number;
  total_products: number;
  best_selling_products: Product[];
}

export interface FinancialTrend {
  date: string;
  income: number;
  expenses: number;
  profit: number;
}

export interface StockAlert {
  product_id: string;
  product_name: string;
  current_quantity: number;
  min_quantity: number;
}

// Types pour les rapports
export interface ReportData {
  period: string;
  total_income: number;
  total_expenses: number;
  total_profit: number;
  savings_progress: number;
  debt_status: {
    given: number;
    received: number;
  };
  top_products: Product[];
  stock_summary: {
    total_value: number;
    low_stock_items: number;
  };
}

// Types pour l'IA
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  action?: AIAction;
}

export interface AIAction {
  type: 'add_income' | 'add_expense' | 'add_product' | 'update_product' | 'record_sale' | 'update_stock' | 'create_savings_goal' | 'add_debt' | 'generate_report';
  data: Record<string, any>;
  confirmed: boolean;
}

export interface AIContext {
  user_id: string;
  financial_data: {
    incomes: Income[];
    expenses: Expense[];
    products: Product[];
    sales: Sale[];
    savings_goals: SavingsGoal[];
    debts: Debt[];
  };
  preferences: {
    currency: string;
    language: string;
  };
}

// Types pour les formulaires
export interface IncomeFormData {
  amount: number;
  category: IncomeCategory;
  description?: string;
  date: string;
}

export interface ExpenseFormData {
  amount: number;
  category: ExpenseCategory;
  description?: string;
  date: string;
}

export interface ProductFormData {
  name: string;
  description?: string;
  category: string;
  purchase_price: number;
  selling_price: number;
  quantity: number;
  min_quantity: number;
  supplier?: string;
}

export interface SaleFormData {
  customer_name?: string;
  items: {
    product_id: string;
    quantity: number;
    unit_price: number;
  }[];
  discount: number;
  date: string;
}

// Types pour les filtres
export interface FilterOptions {
  start_date?: string;
  end_date?: string;
  category?: string;
  search?: string;
}

// Types pour la pagination
export interface Pagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

// Types pour les utilisateurs
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile extends User {
  preferences: {
    currency: string;
    language: string;
    notification_settings: {
      stock_alerts: boolean;
      savings_goals: boolean;
      debt_reminders: boolean;
      expense_analysis: boolean;
    };
  };
}
