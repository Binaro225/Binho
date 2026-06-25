import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useIncomes } from '@/hooks/useIncomes';
import { useExpenses } from '@/hooks/useExpenses';
import { useSales } from '@/hooks/useSales';
import { useSavings } from '@/hooks/useSavings';
import { useDebts } from '@/hooks/useDebts';
import { useProducts } from '@/hooks/useProducts';
import { FileText, Download, Calendar, TrendingUp, TrendingDown, Package, PiggyBank, Users, BarChart3, PieChart } from 'lucide-react';
import { formatCurrency, formatDate, formatChartData } from '@/utils';
import LoadingSpinner from '@/components/common/LoadingSpinner';
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
  PieChart as RechartsPieChart,
  Cell,
} from 'recharts';

const reportPeriods = [
  { value: 'daily', label: 'Quotidien' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'monthly', label: 'Mensuel' },
  { value: 'yearly', label: 'Annuel' },
];

const ReportsPage = () => {
  const { authState, generateReport } = useAppContext();
  const { getMonthlyIncomes, getIncomesByCategory } = useIncomes();
  const { getMonthlyExpenses, getExpensesByCategory } = useExpenses();
  const { getMonthlySales, getMonthlyProfit } = useSales();
  const { getTotalSavings } = useSavings();
  const { getTotalDebt } = useDebts();
  const { getTotalStockValue } = useProducts();

  const [period, setPeriod] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    const fetchReportData = async () => {
      if (!authState.user) return;

      try {
        setIsLoading(true);

        const now = new Date();
        let start: Date;
        let end: Date;

        switch (period) {
          case 'daily':
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'weekly':
            start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            end = now;
            break;
          case 'monthly':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
          case 'yearly':
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date(now.getFullYear(), 11, 31);
            break;
          default:
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }

        // Récupérer les données
        const [
          totalIncome,
          totalExpenses,
          totalSales,
          totalProfit,
          totalSavings,
          totalDebtGiven,
          totalDebtReceived,
          totalStockValue,
          incomeByCategory,
          expenseByCategory,
        ] = await Promise.all([
          getMonthlyIncomes(start.getFullYear(), start.getMonth() + 1),
          getMonthlyExpenses(start.getFullYear(), start.getMonth() + 1),
          getMonthlySales(start.getFullYear(), start.getMonth() + 1),
          getMonthlyProfit(start.getFullYear(), start.getMonth() + 1),
          getTotalSavings(),
          getTotalDebt('given'),
          getTotalDebt('received'),
          getTotalStockValue(),
          getIncomesByCategory(start.getFullYear(), start.getMonth() + 1),
          getExpensesByCategory(start.getFullYear(), start.getMonth() + 1),
        ]);

        // Formater les données du rapport
        const report = {
          period,
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
          summary: {
            totalIncome,
            totalExpenses,
            netIncome: totalIncome - totalExpenses,
            totalSales,
            totalProfit,
            totalSavings,
            totalDebt: totalDebtGiven - totalDebtReceived,
            totalDebtGiven,
            totalDebtReceived,
            totalStockValue,
          },
          incomeByCategory,
          expenseByCategory,
        };

        setReportData(report);
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
      } catch (error) {
        console.error('Erreur lors de la génération du rapport:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportData();
  }, [authState.user, period, getMonthlyIncomes, getMonthlyExpenses, getMonthlySales, getMonthlyProfit, getTotalSavings, getTotalDebt, getTotalStockValue, getIncomesByCategory, getExpensesByCategory]);

  const handleGenerateReport = async (reportType: string) => {
    await generateReport(reportType as any);
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    // Implémenter l'export
    console.log(`Export ${format} en cours...`);
  };

  // Préparer les données pour les graphiques
  const incomeCategoryData = reportData?.incomeByCategory
    ? Object.entries(reportData.incomeByCategory).map(([name, value]) => ({ name, value }))
    : [];

  const expenseCategoryData = reportData?.expenseByCategory
    ? Object.entries(reportData.expenseByCategory).map(([name, value]) => ({ name, value }))
    : [];

  const financialTrendData = [
    { name: 'Revenus', value: reportData?.summary.totalIncome || 0 },
    { name: 'Dépenses', value: reportData?.summary.totalExpenses || 0 },
    { name: 'Bénéfices', value: reportData?.summary.totalProfit || 0 },
    { name: 'Épargne', value: reportData?.summary.totalSavings || 0 },
  ];

  const COLORS = ['#10B981', '#EF4444', '#3B82F6', '#8B5CF6', '#F59E0B', '#06B6D4'];

  if (isLoading) {
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
            <h1 className="page-title">Rapports</h1>
            <p className="page-subtitle">
              Analyse complète de vos finances
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => handleGenerateReport(period)} className="btn btn-secondary">
              <FileText className="w-5 h-5 mr-2" />
              Générer un rapport
            </button>
            <button className="btn btn-secondary">
              <Download className="w-5 h-5 mr-2" />
              Exporter
            </button>
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Période du rapport</h3>
            <p className="text-sm text-gray-500">
              Sélectionnez la période pour laquelle vous souhaitez générer le rapport
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="select"
            >
              {reportPeriods.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                {formatDate(startDate)} - {formatDate(endDate)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-value text-green-600">
                {formatCurrency(reportData?.summary.totalIncome || 0)}
              </p>
              <p className="stat-label">Revenus totaux</p>
            </div>
            <div className="stat-icon bg-green-100">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-value text-red-600">
                {formatCurrency(reportData?.summary.totalExpenses || 0)}
              </p>
              <p className="stat-label">Dépenses totales</p>
            </div>
            <div className="stat-icon bg-red-100">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-value text-blue-600">
                {formatCurrency(reportData?.summary.netIncome || 0)}
              </p>
              <p className="stat-label">Revenu net</p>
            </div>
            <div className="stat-icon bg-blue-100">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-value text-purple-600">
                {formatCurrency(reportData?.summary.totalSavings || 0)}
              </p>
              <p className="stat-label">Épargne totale</p>
            </div>
            <div className="stat-icon bg-purple-100">
              <PiggyBank className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Revenus vs Dépenses
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Revenus', value: reportData?.summary.totalIncome || 0 },
                { name: 'Dépenses', value: reportData?.summary.totalExpenses || 0 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8B5CF6" name="Montant">
                  <Cell fill="#10B981" />
                  <Cell fill="#EF4444" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Overview Pie Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Répartition financière
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <PieChart
                  data={financialTrendData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {financialTrendData.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </PieChart>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income by Category */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Revenus par catégorie
          </h3>
          {incomeCategoryData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeCategoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10B981" name="Montant" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Aucun revenu enregistré pour cette période</p>
            </div>
          )}
        </div>

        {/* Expenses by Category */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Dépenses par catégorie
          </h3>
          {expenseCategoryData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseCategoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#EF4444" name="Montant" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Aucune dépense enregistrée pour cette période</p>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Summary */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Résumé détaillé
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Ventes</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Ventes totales:</span>
                <span className="font-medium">{formatCurrency(reportData?.summary.totalSales || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Bénéfices:</span>
                <span className="font-medium text-green-600">{formatCurrency(reportData?.summary.totalProfit || 0)}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Dettes</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Dettes données:</span>
                <span className="font-medium text-red-600">{formatCurrency(reportData?.summary.totalDebtGiven || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Dettes reçues:</span>
                <span className="font-medium text-green-600">{formatCurrency(reportData?.summary.totalDebtReceived || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Solde dettes:</span>
                <span className="font-medium">{formatCurrency(reportData?.summary.totalDebt || 0)}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Stock</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Valeur du stock:</span>
                <span className="font-medium">{formatCurrency(reportData?.summary.totalStockValue || 0)}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Bilan</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Revenu net:</span>
                <span className="font-medium">{formatCurrency(reportData?.summary.netIncome || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Épargne:</span>
                <span className="font-medium">{formatCurrency(reportData?.summary.totalSavings || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Exporter le rapport
        </h3>
        <div className="flex flex-wrap gap-4">
          <button onClick={() => handleExport('pdf')} className="btn btn-secondary">
            <FileText className="w-5 h-5 mr-2" />
            PDF
          </button>
          <button onClick={() => handleExport('excel')} className="btn btn-secondary">
            <FileText className="w-5 h-5 mr-2" />
            Excel
          </button>
          <button onClick={() => handleExport('csv')} className="btn btn-secondary">
            <FileText className="w-5 h-5 mr-2" />
            CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
