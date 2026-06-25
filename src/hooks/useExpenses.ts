import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Expense, ExpenseFormData, FilterOptions } from '@/types';
import { useAuth } from './useAuth';

export interface ExpensesState {
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;
  total: number;
}

export const useExpenses = () => {
  const { authState } = useAuth();
  const [expensesState, setExpensesState] = useState<ExpensesState>({
    expenses: [],
    isLoading: false,
    error: null,
    total: 0,
  });

  const fetchExpenses = useCallback(async (filters?: FilterOptions, page: number = 1, pageSize: number = 10) => {
    if (!authState.user) {
      setExpensesState({
        expenses: [],
        isLoading: false,
        error: 'Utilisateur non connecté',
        total: 0,
      });
      return;
    }

    try {
      setExpensesState((prev) => ({ ...prev, isLoading: true, error: null }));

      let query = supabase
        .from('expenses')
        .select('*', { count: 'exact' })
        .eq('user_id', authState.user.id)
        .order('date', { ascending: false });

      // Appliquer les filtres
      if (filters) {
        if (filters.start_date) {
          query = query.gte('date', filters.start_date);
        }
        if (filters.end_date) {
          query = query.lte('date', filters.end_date);
        }
        if (filters.category) {
          query = query.eq('category', filters.category);
        }
        if (filters.search) {
          query = query.or(
            `description.ilike.%${filters.search}%,category.ilike.%${filters.search}%`
          );
        }
      }

      // Appliquer la pagination
      const offset = (page - 1) * pageSize;
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      setExpensesState({
        expenses: data || [],
        isLoading: false,
        error: null,
        total: count || 0,
      });
    } catch (error) {
      setExpensesState({
        expenses: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération des dépenses',
        total: 0,
      });
    }
  }, [authState.user]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const addExpense = async (expenseData: ExpenseFormData): Promise<Expense | null> => {
    if (!authState.user) {
      setExpensesState({
        ...expensesState,
        error: 'Utilisateur non connecté',
      });
      return null;
    }

    try {
      setExpensesState((prev) => ({ ...prev, isLoading: true, error: null }));

      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: authState.user.id,
          amount: expenseData.amount,
          category: expenseData.category,
          description: expenseData.description || null,
          date: expenseData.date,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Rafraîchir la liste
      await fetchExpenses();

      return data;
    } catch (error) {
      setExpensesState({
        ...expensesState,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'ajout de la dépense',
      });
      return null;
    }
  };

  const updateExpense = async (id: string, expenseData: Partial<ExpenseFormData>): Promise<Expense | null> => {
    if (!authState.user) {
      setExpensesState({
        ...expensesState,
        error: 'Utilisateur non connecté',
      });
      return null;
    }

    try {
      setExpensesState((prev) => ({ ...prev, isLoading: true, error: null }));

      const { data, error } = await supabase
        .from('expenses')
        .update({
          ...expenseData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', authState.user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Rafraîchir la liste
      await fetchExpenses();

      return data;
    } catch (error) {
      setExpensesState({
        ...expensesState,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour de la dépense',
      });
      return null;
    }
  };

  const deleteExpense = async (id: string): Promise<boolean> => {
    if (!authState.user) {
      setExpensesState({
        ...expensesState,
        error: 'Utilisateur non connecté',
      });
      return false;
    }

    try {
      setExpensesState((prev) => ({ ...prev, isLoading: true, error: null }));

      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', authState.user.id);

      if (error) {
        throw error;
      }

      // Rafraîchir la liste
      await fetchExpenses();

      return true;
    } catch (error) {
      setExpensesState({
        ...expensesState,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la suppression de la dépense',
      });
      return false;
    }
  };

  const getExpenseById = async (id: string): Promise<Expense | null> => {
    if (!authState.user) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', id)
        .eq('user_id', authState.user.id)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      return null;
    }
  };

  const getMonthlyExpenses = async (year: number, month: number): Promise<number> => {
    if (!authState.user) {
      return 0;
    }

    try {
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0).toISOString();

      const { data, error } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', authState.user.id)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) {
        throw error;
      }

      return data.reduce((sum, expense) => sum + expense.amount, 0);
    } catch (error) {
      return 0;
    }
  };

  const getExpensesByCategory = async (year?: number, month?: number): Promise<Record<string, number>> => {
    if (!authState.user) {
      return {};
    }

    try {
      let query = supabase
        .from('expenses')
        .select('category, amount')
        .eq('user_id', authState.user.id);

      if (year && month) {
        const startDate = new Date(year, month - 1, 1).toISOString();
        const endDate = new Date(year, month, 0).toISOString();
        query = query.gte('date', startDate).lte('date', endDate);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const result: Record<string, number> = {};
      data.forEach((expense) => {
        result[expense.category] = (result[expense.category] || 0) + expense.amount;
      });

      return result;
    } catch (error) {
      return {};
    }
  };

  const detectAnomalies = async (threshold: number = 2): Promise<Expense[]> => {
    if (!authState.user) {
      return [];
    }

    try {
      // Calculer la moyenne des dépenses par catégorie
      const { data: expenses, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', authState.user.id)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) {
        throw error;
      }

      // Calculer la moyenne et l'écart-type pour chaque catégorie
      const categoryStats: Record<string, { sum: number; count: number; avg: number; stdDev: number }> = {};

      expenses.forEach((expense) => {
        if (!categoryStats[expense.category]) {
          categoryStats[expense.category] = { sum: 0, count: 0, avg: 0, stdDev: 0 };
        }
        categoryStats[expense.category].sum += expense.amount;
        categoryStats[expense.category].count += 1;
      });

      // Calculer la moyenne
      Object.keys(categoryStats).forEach((category) => {
        categoryStats[category].avg = categoryStats[category].sum / categoryStats[category].count;
      });

      // Calculer l'écart-type
      expenses.forEach((expense) => {
        const category = expense.category;
        const diff = expense.amount - categoryStats[category].avg;
        categoryStats[category].stdDev += diff * diff;
      });

      Object.keys(categoryStats).forEach((category) => {
        categoryStats[category].stdDev = Math.sqrt(
          categoryStats[category].stdDev / categoryStats[category].count
        );
      });

      // Détecter les anomalies (dépenses > moyenne + threshold * écart-type)
      const anomalies: Expense[] = [];
      expenses.forEach((expense) => {
        const category = expense.category;
        const thresholdValue = categoryStats[category].avg + threshold * categoryStats[category].stdDev;
        if (expense.amount > thresholdValue) {
          anomalies.push(expense);
        }
      });

      return anomalies;
    } catch (error) {
      return [];
    }
  };

  return {
    expensesState,
    fetchExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpenseById,
    getMonthlyExpenses,
    getExpensesByCategory,
    detectAnomalies,
  };
};

export default useExpenses;
