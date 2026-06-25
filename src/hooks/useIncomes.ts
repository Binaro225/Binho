import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Income, IncomeFormData, FilterOptions, PaginatedResponse } from '@/types';
import { useAuth } from './useAuth';

export interface IncomesState {
  incomes: Income[];
  isLoading: boolean;
  error: string | null;
  total: number;
}

export const useIncomes = () => {
  const { authState } = useAuth();
  const [incomesState, setIncomesState] = useState<IncomesState>({
    incomes: [],
    isLoading: false,
    error: null,
    total: 0,
  });

  const fetchIncomes = useCallback(async (filters?: FilterOptions, page: number = 1, pageSize: number = 10) => {
    if (!authState.user) {
      setIncomesState({
        incomes: [],
        isLoading: false,
        error: 'Utilisateur non connecté',
        total: 0,
      });
      return;
    }

    try {
      setIncomesState((prev) => ({ ...prev, isLoading: true, error: null }));

      let query = supabase
        .from('incomes')
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

      setIncomesState({
        incomes: data || [],
        isLoading: false,
        error: null,
        total: count || 0,
      });
    } catch (error) {
      setIncomesState({
        incomes: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération des revenus',
        total: 0,
      });
    }
  }, [authState.user]);

  useEffect(() => {
    fetchIncomes();
  }, [fetchIncomes]);

  const addIncome = async (incomeData: IncomeFormData): Promise<Income | null> => {
    if (!authState.user) {
      setIncomesState({
        ...incomesState,
        error: 'Utilisateur non connecté',
      });
      return null;
    }

    try {
      setIncomesState((prev) => ({ ...prev, isLoading: true, error: null }));

      const { data, error } = await supabase
        .from('incomes')
        .insert({
          user_id: authState.user.id,
          amount: incomeData.amount,
          category: incomeData.category,
          description: incomeData.description || null,
          date: incomeData.date,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Rafraîchir la liste
      await fetchIncomes();

      return data;
    } catch (error) {
      setIncomesState({
        ...incomesState,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'ajout du revenu',
      });
      return null;
    }
  };

  const updateIncome = async (id: string, incomeData: Partial<IncomeFormData>): Promise<Income | null> => {
    if (!authState.user) {
      setIncomesState({
        ...incomesState,
        error: 'Utilisateur non connecté',
      });
      return null;
    }

    try {
      setIncomesState((prev) => ({ ...prev, isLoading: true, error: null }));

      const { data, error } = await supabase
        .from('incomes')
        .update({
          ...incomeData,
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
      await fetchIncomes();

      return data;
    } catch (error) {
      setIncomesState({
        ...incomesState,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour du revenu',
      });
      return null;
    }
  };

  const deleteIncome = async (id: string): Promise<boolean> => {
    if (!authState.user) {
      setIncomesState({
        ...incomesState,
        error: 'Utilisateur non connecté',
      });
      return false;
    }

    try {
      setIncomesState((prev) => ({ ...prev, isLoading: true, error: null }));

      const { error } = await supabase
        .from('incomes')
        .delete()
        .eq('id', id)
        .eq('user_id', authState.user.id);

      if (error) {
        throw error;
      }

      // Rafraîchir la liste
      await fetchIncomes();

      return true;
    } catch (error) {
      setIncomesState({
        ...incomesState,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la suppression du revenu',
      });
      return false;
    }
  };

  const getIncomeById = async (id: string): Promise<Income | null> => {
    if (!authState.user) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('incomes')
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

  const getMonthlyIncomes = async (year: number, month: number): Promise<number> => {
    if (!authState.user) {
      return 0;
    }

    try {
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0).toISOString();

      const { data, error } = await supabase
        .from('incomes')
        .select('amount')
        .eq('user_id', authState.user.id)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) {
        throw error;
      }

      return data.reduce((sum, income) => sum + income.amount, 0);
    } catch (error) {
      return 0;
    }
  };

  const getIncomesByCategory = async (year?: number, month?: number): Promise<Record<string, number>> => {
    if (!authState.user) {
      return {};
    }

    try {
      let query = supabase
        .from('incomes')
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
      data.forEach((income) => {
        result[income.category] = (result[income.category] || 0) + income.amount;
      });

      return result;
    } catch (error) {
      return {};
    }
  };

  return {
    incomesState,
    fetchIncomes,
    addIncome,
    updateIncome,
    deleteIncome,
    getIncomeById,
    getMonthlyIncomes,
    getIncomesByCategory,
  };
};

export default useIncomes;
