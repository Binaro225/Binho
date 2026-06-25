import { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useIncomes } from '@/hooks/useIncomes';
import { useExpenses } from '@/hooks/useExpenses';
import { useProducts } from '@/hooks/useProducts';
import { useSales } from '@/hooks/useSales';
import { useSavings } from '@/hooks/useSavings';
import { useDebts } from '@/hooks/useDebts';
import {
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingCart,
  PiggyBank,
  FileText,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Users,
  Calendar,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { formatCurrency, formatDate, getCategoryColor } from '@/utils';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import StatCard from '@/components/dashboard/StatCard';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import StockAlerts from '@/components/dashboard/StockAlerts';
import QuickActions from '@/components/dashboard/QuickActions';

const DashboardPage = () => {
  const { authState, dashboardState, refreshDashboard } = useAppContext();
  const { getIncomesByCategory } = useIncomes();
  const { getExpensesByCategory } = useExpenses();
  const { getLowStockProducts } = useProducts();

  const [incomeData, setIncomeData] = useState<{ name: string; value: number }[]>([]);
  const [expenseData, setExpenseData] = useState<{ name: string; value: number }[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!authState.user) return;

      try {
        setIsLoadingDetails(true);

        // Récupérer les revenus par catégorie
        const incomes = await getIncomesByCategory();
        const incomeArray = Object.entries(incomes).map(([name, value]) => ({
          name,
          value,
        }));
        setIncomeData(incomeArray);

        // Récupérer les dépenses par catégorie
        const expenses = await getExpensesByCategory();
        const expenseArray = Object.entries(expenses).map(([name, value]) => ({
          name,
          value,
        }));
        setExpenseData(expenseArray);
      } catch (error) {
        console.error('Erreur lors du chargement des détails:', error);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [authState.user, getIncomesByCategory, getExpensesByCategory]);

  const handleRefresh = async () => {
    await refreshDashboard();
  };

  // Calculer le solde net
  const netBalance = 
    dashboardState.stats.total_balance +
    dashboardState.stats.current_savings -
    dashboardState.stats.current_debt;

  // Calculer le pourcentage de progression
  const getProgressColor = (value: number) => {
    if (value >= 75) return 'bg-green-500';
    if (value >= 50) return 'bg-yellow-500';
    if (value >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Données pour le graphique de tendances
  const trendData = dashboardState.trends.map((trend) => ({
    name: trend.date,
    Revenus: trend.income,
    Dépenses: trend.expenses,
    Bénéfices: trend.profit,
  }));

  // Données pour le graphique des catégories
  const categoryData = [
    ...incomeData.map((d) => ({ ...d, type: 'Revenu' })),
    ...expenseData.map((d) => ({ ...d, type: 'Dépense' })),
  ];

  if (dashboardState.isLoading || isLoadingDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Tableau de bord</h1>
            <p className="page-subtitle">
              Bienvenue, {authState.user?.full_name || 'Utilisateur'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              className="btn btn-secondary btn-sm"
            >
              <ArrowUp className="w-4 h-4 mr-1" />
              Rafraîchir
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          icon={TrendingUp}
          iconColor="bg-green-100 text-green-600"
          value={formatCurrency(dashboardState.stats.monthly_income)}
          label="Revenus du mois"
          trend={0}
          trendColor="green"
        />

        <StatCard
          icon={TrendingDown}
          iconColor="bg-red-100 text-red-600"
          value={formatCurrency(dashboardState.stats.monthly_expenses)}
          label="Dépenses du mois"
          trend={0}
          trendColor="red"
        />

        <StatCard
          icon={TrendingUp}
          iconColor="bg-blue-100 text-blue-600"
          value={formatCurrency(dashboardState.stats.monthly_profit)}
          label="Bénéfices du mois"
          trend={0}
          trendColor="blue"
        />

        <StatCard
          icon={PiggyBank}
          iconColor="bg-purple-100 text-purple-600"
          value={formatCurrency(dashboardState.stats.current_savings)}
          label="Épargne actuelle"
          trend={0}
          trendColor="purple"
        />
      </div>

      {/* Main Balance Card */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Solde total</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {formatCurrency(netBalance)}
            </p>
            <div className="flex items-center mt-2">
              {netBalance >= 0 ? (
                <ArrowUp className="w-5 h-5 text-green-500" />
              ) : (
                <ArrowDown className="w-5 h-5 text-red-500" />
              )}
              <span
                className={`text-sm font-medium ml-1 ${
                  netBalance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {netBalance >= 0 ? 'Positif' : 'Négatif'}
              </span>
            </div>
          </div>
          <div className="flex space-x-2">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center -ml-4">
              <ShoppingCart className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500">Dettes</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency(dashboardState.stats.current_debt)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Produits en stock</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {dashboardState.stats.total_products}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Trends Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Évolution financière
            </h3>
            <select className="text-sm border border-gray-300 rounded-lg px-2 py-1">
              <option>6 derniers mois</option>
              <option>3 derniers mois</option>
              <option>12 derniers mois</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="Revenus"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Revenus"
                />
                <Line
                  type="monotone"
                  dataKey="Dépenses"
                  stroke="#EF4444"
                  strokeWidth={2}
                  name="Dépenses"
                />
                <Line
                  type="monotone"
                  dataKey="Bénéfices"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="Bénéfices"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Répartition par catégorie
            </h3>
            <button className="text-sm text-blue-600 hover:text-blue-700">
              Voir plus
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="value" fill="#8B5CF6" name="Montant" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Alerts */}
        <StockAlerts alerts={dashboardState.stockAlerts} />

        {/* Recent Transactions */}
        <RecentTransactions />

        {/* Quick Actions */}
        <QuickActions />
      </div>
    </div>
  );
};

export default DashboardPage;
