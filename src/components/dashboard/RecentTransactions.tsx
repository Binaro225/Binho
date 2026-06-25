import { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { TrendingUp, TrendingDown, ShoppingCart, Package } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils';

interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'sale';
  amount: number;
  category: string;
  description: string | null;
  date: string;
  icon: React.ReactNode;
  color: string;
}

const RecentTransactions = () => {
  const { authState } = useAppContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecentTransactions = async () => {
      if (!authState.user) return;

      try {
        setIsLoading(true);

        // Récupérer les dernières transactions (revenus, dépenses, ventes)
        const [incomes, expenses, sales] = await Promise.all([
          supabase
            .from('incomes')
            .select('id, amount, category, description, date')
            .eq('user_id', authState.user.id)
            .order('date', { ascending: false })
            .limit(5),
          supabase
            .from('expenses')
            .select('id, amount, category, description, date')
            .eq('user_id', authState.user.id)
            .order('date', { ascending: false })
            .limit(5),
          supabase
            .from('sales')
            .select('id, total_amount, customer_name, date')
            .eq('user_id', authState.user.id)
            .order('date', { ascending: false })
            .limit(5),
        ]);

        // Formater les transactions
        const formattedTransactions: Transaction[] = [];

        // Ajouter les revenus
        incomes.data?.forEach((income) => {
          formattedTransactions.push({
            id: income.id,
            type: 'income',
            amount: income.amount,
            category: income.category,
            description: income.description,
            date: income.date,
            icon: <TrendingUp className="w-4 h-4" />,
            color: 'text-green-600',
          });
        });

        // Ajouter les dépenses
        expenses.data?.forEach((expense) => {
          formattedTransactions.push({
            id: expense.id,
            type: 'expense',
            amount: -expense.amount,
            category: expense.category,
            description: expense.description,
            date: expense.date,
            icon: <TrendingDown className="w-4 h-4" />,
            color: 'text-red-600',
          });
        });

        // Ajouter les ventes
        sales.data?.forEach((sale) => {
          formattedTransactions.push({
            id: sale.id,
            type: 'sale',
            amount: sale.total_amount,
            category: 'Vente',
            description: `Vente à ${sale.customer_name || 'client anonyme'}`,
            date: sale.date,
            icon: <ShoppingCart className="w-4 h-4" />,
            color: 'text-blue-600',
          });
        });

        // Trier par date et limiter à 10
        formattedTransactions
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 10);

        setTransactions(formattedTransactions);
      } catch (error) {
        console.error('Erreur lors de la récupération des transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentTransactions();
  }, [authState.user]);

  if (isLoading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Transactions récentes
        </h3>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4 mt-1"></div>
              </div>
              <div className="w-20 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Transactions récentes
        </h3>
        <button className="text-sm text-blue-600 hover:text-blue-700">
          Voir tout
        </button>
      </div>
      <div className="space-y-4">
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="text-gray-500 mt-2">Aucune transaction récente</p>
          </div>
        ) : (
          transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${transaction.type === 'income' ? 'bg-green-100' : transaction.type === 'expense' ? 'bg-red-100' : 'bg-blue-100'}`}
              >
                {transaction.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {transaction.description || transaction.category}
                </p>
                <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
              </div>
              <div className={`text-sm font-medium ${transaction.color}`}>
                {formatCurrency(transaction.amount)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentTransactions;
