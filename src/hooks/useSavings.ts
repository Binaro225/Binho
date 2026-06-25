import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { SavingsGoal, SavingsStatus, FilterOptions } from '@/types';
import { useAuth } from './useAuth';

export interface SavingsState {
  savingsGoals: SavingsGoal[];
  isLoading: boolean;
  error: string | null;
  total: number;
}

export const useSavings = () => {
  const { authState } = useAuth();
  const [savingsState, setSavingsState] = useState<SavingsState>({
    savingsGoals: [],
    isLoading: false,
    error: null,
    total: 0,
  });

  const fetchSavingsGoals = useCallback(async (filters?: FilterOptions, page: number = 1, pageSize: number = 10) => {
    if (!authState.user) {
      setSavingsState({
        savingsGoals: [],
        isLoading: false,
        error: 'Utilisateur non connecté',
        total: 0,
      });
      return;
    }

    try {
      setSavingsState((prev) => ({ ...prev, isLoading: true, error: null }));

      let query = supabase
        .from('savings_goals')
        .select('*', { count: 'exact' })
        .eq('user_id', authState.user.id)
        .order('created_at', { ascending: false });

      // Appliquer les filtres
      if (filters) {
        if (filters.search) {
          query = query.or(
            `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
          );
        }
        if (filters.category) {
          query = query.eq('status', filters.category as SavingsStatus);
        }
      }

      // Appliquer la pagination
      const offset = (page - 1) * pageSize;
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      setSavingsState({
        savingsGoals: data || [],
        isLoading: false,
        error: null,
        total: count || 0,
      });
    } catch (error) {
      setSavingsState({
        savingsGoals: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération des objectifs d\'épargne',
        total: 0,
      });
    }
  }, [authState.user]);

  useEffect(() => {
    fetchSavingsGoals();
  }, [fetchSavingsGoals]);

  const createSavingsGoal = async (goalData: {
    name: string;
    target_amount: number;
    target_date: string;
    description?: string;
  }): Promise<SavingsGoal | null> => {
    if (!authState.user) {
      setSavingsState({
        ...savingsState,
        error: 'Utilisateur non connecté',
      });
      return null;
    }

    try {
      setSavingsState((prev) => ({ ...prev, isLoading: true, error: null }));

      const { data, error } = await supabase
        .from('savings_goals')
        .insert({
          user_id: authState.user.id,
          name: goalData.name,
          target_amount: goalData.target_amount,
          current_amount: 0,
          target_date: goalData.target_date,
          description: goalData.description || null,
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Rafraîchir la liste
      await fetchSavingsGoals();

      return data;
    } catch (error) {
      setSavingsState({
        ...savingsState,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la création de l\'objectif d\'épargne',
      });
      return null;
    }
  };

  const updateSavingsGoal = async (id: string, goalData: Partial<Omit<SavingsGoal, 'id' | 'user_id' | 'created_at'>>): Promise<SavingsGoal | null> => {
    if (!authState.user) {
      setSavingsState({
        ...savingsState,
        error: 'Utilisateur non connecté',
      });
      return null;
    }

    try {
      setSavingsState((prev) => ({ ...prev, isLoading: true, error: null }));

      const { data, error } = await supabase
        .from('savings_goals')
        .update({
          ...goalData,
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
      await fetchSavingsGoals();

      return data;
    } catch (error) {
      setSavingsState({
        ...savingsState,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour de l\'objectif d\'épargne',
      });
      return null;
    }
  };

  const deleteSavingsGoal = async (id: string): Promise<boolean> => {
    if (!authState.user) {
      setSavingsState({
        ...savingsState,
        error: 'Utilisateur non connecté',
      });
      return false;
    }

    try {
      setSavingsState((prev) => ({ ...prev, isLoading: true, error: null }));

      const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', id)
        .eq('user_id', authState.user.id);

      if (error) {
        throw error;
      }

      // Rafraîchir la liste
      await fetchSavingsGoals();

      return true;
    } catch (error) {
      setSavingsState({
        ...savingsState,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la suppression de l\'objectif d\'épargne',
      });
      return false;
    }
  };

  const addToSavings = async (goalId: string, amount: number): Promise<SavingsGoal | null> => {
    if (!authState.user) {
      setSavingsState({
        ...savingsState,
        error: 'Utilisateur non connecté',
      });
      return null;
    }

    try {
      setSavingsState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Récupérer l'objectif actuel
      const { data: goal, error: fetchError } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('id', goalId)
        .eq('user_id', authState.user.id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (!goal) {
        throw new Error('Objectif non trouvé');
      }

      // Calculer le nouveau montant
      const newAmount = goal.current_amount + amount;
      const newStatus = newAmount >= goal.target_amount ? 'completed' : goal.status;

      // Mettre à jour l'objectif
      const { data, error } = await supabase
        .from('savings_goals')
        .update({
          current_amount: newAmount,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', goalId)
        .eq('user_id', authState.user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Rafraîchir la liste
      await fetchSavingsGoals();

      return data;
    } catch (error) {
      setSavingsState({
        ...savingsState,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'ajout à l\'épargne',
      });
      return null;
    }
  };

  const getSavingsGoalById = async (id: string): Promise<SavingsGoal | null> => {
    if (!authState.user) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('savings_goals')
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

  const getTotalSavings = async (): Promise<number> => {
    if (!authState.user) {
      return 0;
    }

    try {
      const { data, error } = await supabase
        .from('savings_goals')
        .select('current_amount')
        .eq('user_id', authState.user.id);

      if (error) {
        throw error;
      }

      return data.reduce((sum, goal) => sum + goal.current_amount, 0);
    } catch (error) {
      return 0;
    }
  };

  const getSavingsProgress = async (goalId: string): Promise<number> => {
    if (!authState.user) {
      return 0;
    }

    try {
      const { data, error } = await supabase
        .from('savings_goals')
        .select('current_amount, target_amount')
        .eq('id', goalId)
        .eq('user_id', authState.user.id)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        return 0;
      }

      return (data.current_amount / data.target_amount) * 100;
    } catch (error) {
      return 0;
    }
  };

  const getUpcomingGoals = async (): Promise<SavingsGoal[]> => {
    if (!authState.user) {
      return [];
    }

    try {
      const today = new Date().toISOString();
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', authState.user.id)
        .eq('status', 'active')
        .gte('target_date', today)
        .order('target_date', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      return [];
    }
  };

  return {
    savingsState,
    fetchSavingsGoals,
    createSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    addToSavings,
    getSavingsGoalById,
    getTotalSavings,
    getSavingsProgress,
    getUpcomingGoals,
  };
};

export default useSavings;
