import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DashboardStats, FinancialTrend, StockAlert } from '@/types';
import { useAuth } from './useAuth';
import { useIncomes } from './useIncomes';
import { useExpenses } from './useExpenses';
import { useProducts } from './useProducts';
import { useSales } from './useSales';
import { useSavings } from './useSavings';
import { useDebts } from './useDebts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export interface DashboardState {
  stats: DashboardStats;
  trends: FinancialTrend[];
  stockAlerts: StockAlert[];
  isLoading: boolean;
  error: string | null;
}

export const useDashboard = () => {
  const { authState } = useAuth();
  const { getMonthlyIncomes, getIncomesByCategory } = useIncomes();
  const { getMonthlyExpenses, getExpensesByCategory, detectAnomalies } = useExpenses();
  const { getTotalStockValue, getLowStockProducts, getBestSellingProducts } = useProducts();
  const { getMonthlySales, getMonthlyProfit, getTotalSalesCount } = useSales();
  const { getTotalSavings } = useSavings();
  const { getTotalDebt } = useDebts();

  const [dashboardState, setDashboardState] = useState<DashboardState>({
    stats: {
      total_balance: 0,
      monthly_income: 0,
      monthly_expenses: 0,
      monthly_profit: 0,
      current_savings: 0,
      current_debt: 0,
      total_products: 0,
      best_selling_products: [],
    },
    trends: [],
    stockAlerts: [],
    isLoading: false,
    error: null,
  });

  const fetchDashboardData = useCallback(async (year?: number, month?: number) => {
    if (!authState.user) {
      setDashboardState({
        stats: {
          total_balance: 0,
          monthly_income: 0,
          monthly_expenses: 0,
          monthly_profit: 0,
          current_savings: 0,
          current_debt: 0,
          total_products: 0,
          best_selling_products: [],
        },
        trends: [],
        stockAlerts: [],
        isLoading: false,
        error: 'Utilisateur non connecté',
      });
      return;
    }

    try {
      setDashboardState((prev) => ({ ...prev, isLoading: true, error: null }));

      const now = new Date();
      const targetYear = year || now.getFullYear();
      const targetMonth = month || now.getMonth() + 1;

      // Récupérer les données en parallèle
      const [
        monthlyIncome,
        monthlyExpenses,
        monthlySales,
        monthlyProfit,
        totalSavings,
        totalDebtGiven,
        totalDebtReceived,
        totalStockValue,
        lowStockProducts,
        bestSellingProducts,
        totalProducts,
        totalSalesCount,
      ] = await Promise.all([
        getMonthlyIncomes(targetYear, targetMonth),
        getMonthlyExpenses(targetYear, targetMonth),
        getMonthlySales(targetYear, targetMonth),
        getMonthlyProfit(targetYear, targetMonth),
        getTotalSavings(),
        getTotalDebt('given'),
        getTotalDebt('received'),
        getTotalStockValue(),
        getLowStockProducts(),
        getBestSellingProducts(5),
        supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', authState.user.id)
          .then(({ count }) => count || 0),
        getTotalSalesCount(),
      ]);

      // Calculer le solde total
      const totalBalance = (monthlyIncome - monthlyExpenses) + totalSavings - (totalDebtGiven - totalDebtReceived);

      // Calculer le bénéfice mensuel
      const monthlyProfitValue = monthlyProfit + (monthlyIncome - monthlyExpenses);

      // Récupérer les tendances des 6 derniers mois
      const trends: FinancialTrend[] = [];
      for (let i = 5; i >= 0; i--) {
        const currentDate = subMonths(now, i);
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;

        const [income, expense, sale, profit] = await Promise.all([
          getMonthlyIncomes(currentYear, currentMonth),
          getMonthlyExpenses(currentYear, currentMonth),
          getMonthlySales(currentYear, currentMonth),
          getMonthlyProfit(currentYear, currentMonth),
        ]);

        trends.push({
          date: format(currentDate, 'yyyy-MM'),
          income,
          expenses: expense,
          profit: profit + (income - expense),
        });
      }

      // Formater les alertes de stock
      const stockAlerts: StockAlert[] = lowStockProducts.map((product) => ({
        product_id: product.id,
        product_name: product.name,
        current_quantity: product.quantity,
        min_quantity: product.min_quantity,
      }));

      setDashboardState({
        stats: {
          total_balance: totalBalance,
          monthly_income: monthlyIncome,
          monthly_expenses: monthlyExpenses,
          monthly_profit: monthlyProfitValue,
          current_savings: totalSavings,
          current_debt: totalDebtGiven - totalDebtReceived,
          total_products: totalProducts,
          best_selling_products: bestSellingProducts,
        },
        trends,
        stockAlerts,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setDashboardState({
        stats: {
          total_balance: 0,
          monthly_income: 0,
          monthly_expenses: 0,
          monthly_profit: 0,
          current_savings: 0,
          current_debt: 0,
          total_products: 0,
          best_selling_products: [],
        },
        trends: [],
        stockAlerts: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors du chargement du tableau de bord',
      });
    }
  }, [
    authState.user,
    getMonthlyIncomes,
    getMonthlyExpenses,
    getMonthlySales,
    getMonthlyProfit,
    getTotalSavings,
    getTotalDebt,
    getTotalStockValue,
    getLowStockProducts,
    getBestSellingProducts,
  ]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const refreshDashboard = async () => {
    await fetchDashboardData();
  };

  return {
    dashboardState,
    fetchDashboardData,
    refreshDashboard,
  };
};

export default useDashboard;
