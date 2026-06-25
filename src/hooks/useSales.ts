import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Sale, SaleFormData, FilterOptions } from '@/types';
import { useAuth } from './useAuth';
import { v4 as uuidv4 } from 'uuid';

export interface SalesState {
  sales: Sale[];
  isLoading: boolean;
  error: string | null;
  total: number;
}

export const useSales = () => {
  const { authState } = useAuth();
  const [salesState, setSalesState] = useState<SalesState>({
    sales: [],
    isLoading: false,
    error: null,
    total: 0,
  });

  const fetchSales = useCallback(async (filters?: FilterOptions, page: number = 1, pageSize: number = 10) => {
    if (!authState.user) {
      setSalesState({
        sales: [],
        isLoading: false,
        error: 'Utilisateur non connecté',
        total: 0,
      });
      return;
    }

    try {
      setSalesState((prev) => ({ ...prev, isLoading: true, error: null }));

      let query = supabase
        .from('sales')
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
        if (filters.search) {
          query = query.or(
            `sale_number.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%`
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

      setSalesState({
        sales: data || [],
        isLoading: false,
        error: null,
        total: count || 0,
      });
    } catch (error) {
      setSalesState({
        sales: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération des ventes',
        total: 0,
      });
    }
  }, [authState.user]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const recordSale = async (saleData: SaleFormData): Promise<Sale | null> => {
    if (!authState.user) {
      setSalesState({
        ...salesState,
        error: 'Utilisateur non connecté',
      });
      return null;
    }

    try {
      setSalesState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Générer un numéro de vente unique
      const saleNumber = `SALE-${Date.now()}-${uuidv4().slice(0, 4).toUpperCase()}`;

      // Calculer le montant total et le bénéfice
      let totalAmount = 0;
      let totalProfit = 0;

      saleData.items.forEach((item) => {
        totalAmount += item.quantity * item.unit_price;
        totalProfit += item.quantity * (item.unit_price - item.unit_price * 0.7); // Marge estimée à 30%
      });

      // Appliquer la remise
      const discountAmount = totalAmount * (saleData.discount / 100);
      const finalAmount = totalAmount - discountAmount;
      const finalProfit = totalProfit - discountAmount;

      // Créer la vente
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          user_id: authState.user.id,
          sale_number: saleNumber,
          customer_name: saleData.customer_name || null,
          total_amount: finalAmount,
          discount: saleData.discount,
          profit: finalProfit,
          date: saleData.date,
        })
        .select()
        .single();

      if (saleError) {
        throw saleError;
      }

      // Créer les articles de vente
      const saleItems = saleData.items.map((item) => ({
        id: uuidv4(),
        sale_id: sale.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
        profit: item.quantity * (item.unit_price - item.unit_price * 0.7),
        created_at: new Date().toISOString(),
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) {
        throw itemsError;
      }

      // Mettre à jour le stock
      for (const item of saleData.items) {
        const { error: stockError } = await supabase
          .from('products')
          .update({
            quantity: supabase.rpc('decrement', { column: 'quantity', amount: item.quantity }),
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.product_id)
          .eq('user_id', authState.user.id);

        if (stockError) {
          throw stockError;
        }
      }

      // Rafraîchir la liste
      await fetchSales();

      return sale;
    } catch (error) {
      setSalesState({
        ...salesState,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement de la vente',
      });
      return null;
    }
  };

  const getSaleById = async (id: string): Promise<Sale | null> => {
    if (!authState.user) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('sales')
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

  const getSaleItems = async (saleId: string): Promise<any[]> => {
    if (!authState.user) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('sale_items')
        .select('*, products(*)')
        .eq('sale_id', saleId);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      return [];
    }
  };

  const getMonthlySales = async (year: number, month: number): Promise<number> => {
    if (!authState.user) {
      return 0;
    }

    try {
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0).toISOString();

      const { data, error } = await supabase
        .from('sales')
        .select('total_amount')
        .eq('user_id', authState.user.id)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) {
        throw error;
      }

      return data.reduce((sum, sale) => sum + sale.total_amount, 0);
    } catch (error) {
      return 0;
    }
  };

  const getMonthlyProfit = async (year: number, month: number): Promise<number> => {
    if (!authState.user) {
      return 0;
    }

    try {
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0).toISOString();

      const { data, error } = await supabase
        .from('sales')
        .select('profit')
        .eq('user_id', authState.user.id)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) {
        throw error;
      }

      return data.reduce((sum, sale) => sum + sale.profit, 0);
    } catch (error) {
      return 0;
    }
  };

  const getTotalSalesCount = async (): Promise<number> => {
    if (!authState.user) {
      return 0;
    }

    try {
      const { count, error } = await supabase
        .from('sales')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', authState.user.id);

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (error) {
      return 0;
    }
  };

  const deleteSale = async (id: string): Promise<boolean> => {
    if (!authState.user) {
      setSalesState({
        ...salesState,
        error: 'Utilisateur non connecté',
      });
      return false;
    }

    try {
      setSalesState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Récupérer les articles de la vente pour restaurer le stock
      const { data: saleItems, error: itemsError } = await supabase
        .from('sale_items')
        .select('*')
        .eq('sale_id', id);

      if (itemsError) {
        throw itemsError;
      }

      // Restaurer le stock
      for (const item of saleItems) {
        const { error: stockError } = await supabase
          .from('products')
          .update({
            quantity: supabase.rpc('increment', { column: 'quantity', amount: item.quantity }),
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.product_id)
          .eq('user_id', authState.user.id);

        if (stockError) {
          throw stockError;
        }
      }

      // Supprimer les articles de vente
      const { error: deleteItemsError } = await supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', id);

      if (deleteItemsError) {
        throw deleteItemsError;
      }

      // Supprimer la vente
      const { error: deleteSaleError } = await supabase
        .from('sales')
        .delete()
        .eq('id', id)
        .eq('user_id', authState.user.id);

      if (deleteSaleError) {
        throw deleteSaleError;
      }

      // Rafraîchir la liste
      await fetchSales();

      return true;
    } catch (error) {
      setSalesState({
        ...salesState,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la suppression de la vente',
      });
      return false;
    }
  };

  return {
    salesState,
    fetchSales,
    recordSale,
    getSaleById,
    getSaleItems,
    getMonthlySales,
    getMonthlyProfit,
    getTotalSalesCount,
    deleteSale,
  };
};

export default useSales;
