import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Debt, DebtType, DebtStatus, FilterOptions } from '@/types';
import { useAuth } from './useAuth';

export interface DebtsState {
  debts: Debt[];
  isLoading: boolean;
  error: string | null;
  total: number;
}

export const useDebts = () => {
  const { authState } = useAuth();
  const [debtsState, setDebtsState] = useState<DebtsState>({
    debts: [],
    isLoading: false,
    error: null,
    total: 0,
  });

  const fetchDebts = useCallback(async (filters?: FilterOptions, page: number = 1, pageSize: number = 10) => {
    if (!authState.user) {
      setDebtsState({
        debts: [],
        isLoading: false,
        error: 'Utilisateur non connecté',
        total: 0,
      });
      return;
    }

    try {
      setDebtsState((prev) => ({ ...prev, isLoading: true, error: null }));

      let query = supabase
        .from('debts')
        .select('*', { count: 'exact' })
        .eq('user_id', authState.user.id)
        .order('date', { ascending: false });

      // Appliquer les filtres
      if (filters) {
        if (filters.search) {
          query = query.or(
            `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
          );
        }
        if (filters.category) {
          query = query.eq('debt_type', filters.category as DebtType);
        }
      }

      // Appliquer la pagination
      const offset = (page - 1) * pageSize;
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      setDebtsState({
        debts: data || [],
        isLoading: false,
        error: null,
        total: count || 0,
      });
    } catch (error) {
      setDebtsState({
        debts: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération des dettes',
        total: 0,
      });
    }
  }, [authState.user]);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  const addDebt = async (debtData: {
    name: string;
    amount: number;
    debt_type: DebtType;
    date: string;
    due_date?: string;
    description?: string;
  }): Promise<Debt | null> => {
    if (!authState.user) {
      setDebtsState({
        ...debtsState,
        error: 'Utilisateur non connecté',
      });
      return null;
    }

    try {
      setDebtsState((prev) => ({ ...prev, isLoading: true, error: null }));

      const { data, error } = await supabase
        .from('debts')
        .insert({
          user_id: authState.user.id,
          name: debtData.name,
          amount: debtData.amount,
          debt_type: debtData.debt_type,
          date: debtData.date,
          due_date: debtData.due_date || null,
          description: debtData.description || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Rafraîchir la liste
      await fetchDebts();

      return data;
    } catch (error) {
      setDebtsState({
        ...debtsState,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'ajout de la dette',
      });
      return null;
    }
  };

  const updateDebt = async (id: string, debtData: Partial<Omit<Debt, 'id' | 'user_id' | 'created_at'>>): Promise<Debt | null> => {
    if (!authState.user) {
      setDebtsState({
        ...debtsState,
        error: 'Utilisateur non connecté',
      });
      return null;
    }

    try {
      setDebtsState((prev) => ({ ...prev, isLoading: true, error: null }));

      const { data, error } = await supabase
        .from('debts')
        .update({
          ...debtData,
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
      await fetchDebts();

      return data;
    } catch (error) {
      setDebtsState({
        ...debtsState,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour de la dette',
      });
      return null;
    }
  };

  const deleteDebt = async (id: string): Promise<boolean> => {
    if (!authState.user) {
      setDebtsState({
        ...debtsState,
        error: 'Utilisateur non connecté',
      });
      return false;
    }

    try {
      setDebtsState((prev) => ({ ...prev, isLoading: true, error: null }));

      const { error } = await supabase
        .from('debts')
        .delete()
        .eq('id', id)
        .eq('user_id', authState.user.id);

      if (error) {
        throw error;
      }

      // Rafraîchir la liste
      await fetchDebts();

      return true;
    } catch (error) {
      setDebtsState({
        ...debtsState,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la suppression de la dette',
      });
      return false;
    }
  };

  const getDebtById = async (id: string): Promise<Debt | null> => {
    if (!authState.user) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('debts')
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

  const addDebtPayment = async (debtId: string, paymentData: {
    amount: number;
    payment_date: string;
    description?: string;
  }): Promise<boolean> => {
    if (!authState.user) {
      setDebtsState({
        ...debtsState,
        error: 'Utilisateur non connecté',
      });
      return false;
    }

    try {
      setDebtsState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Récupérer la dette
      const { data: debt, error: fetchError } = await supabase
        .from('debts')
        .select('*')
        .eq('id', debtId)
        .eq('user_id', authState.user.id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (!debt) {
        throw new Error('Dette non trouvée');
      }

      // Créer le paiement
      const { error: paymentError } = await supabase
        .from('debt_payments')
        .insert({
          debt_id: debtId,
          amount: paymentData.amount,
          payment_date: paymentData.payment_date,
          description: paymentData.description || null,
        });

      if (paymentError) {
        throw paymentError;
      }

      // Calculer le nouveau montant restant
      const remainingAmount = debt.amount - paymentData.amount;
      const newStatus = remainingAmount <= 0 ? 'paid' : debt.status === 'partial' ? 'partial' : 'partial';

      // Mettre à jour la dette
      const { error: updateError } = await supabase
        .from('debts')
        .update({
          amount: remainingAmount,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', debtId)
        .eq('user_id', authState.user.id);

      if (updateError) {
        throw updateError;
      }

      // Rafraîchir la liste
      await fetchDebts();

      return true;
    } catch (error) {
      setDebtsState({
        ...debtsState,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'ajout du paiement',
      });
      return false;
    }
  };

  const getDebtPayments = async (debtId: string): Promise<any[]> => {
    if (!authState.user) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('debt_payments')
        .select('*')
        .eq('debt_id', debtId)
        .order('payment_date', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      return [];
    }
  };

  const getTotalDebt = async (type?: DebtType): Promise<number> => {
    if (!authState.user) {
      return 0;
    }

    try {
      let query = supabase
        .from('debts')
        .select('amount')
        .eq('user_id', authState.user.id);

      if (type) {
        query = query.eq('debt_type', type);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data.reduce((sum, debt) => sum + debt.amount, 0);
    } catch (error) {
      return 0;
    }
  };

  const getUpcomingDebts = async (): Promise<Debt[]> => {
    if (!authState.user) {
      return [];
    }

    try {
      const today = new Date().toISOString();
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .eq('user_id', authState.user.id)
        .eq('status', 'pending')
        .gte('due_date', today)
        .order('due_date', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      return [];
    }
  };

  const getOverdueDebts = async (): Promise<Debt[]> => {
    if (!authState.user) {
      return [];
    }

    try {
      const today = new Date().toISOString();
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .eq('user_id', authState.user.id)
        .eq('status', 'pending')
        .lt('due_date', today)
        .order('due_date', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      return [];
    }
  };

  return {
    debtsState,
    fetchDebts,
    addDebt,
    updateDebt,
    deleteDebt,
    getDebtById,
    addDebtPayment,
    getDebtPayments,
    getTotalDebt,
    getUpcomingDebts,
    getOverdueDebts,
  };
};

export default useDebts;
