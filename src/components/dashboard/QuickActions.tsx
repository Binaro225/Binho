import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp, TrendingDown, Package, ShoppingCart } from 'lucide-react';

const QuickActions = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      name: 'Ajouter un revenu',
      icon: TrendingUp,
      color: 'bg-green-100 text-green-600',
      onClick: () => navigate('/incomes?action=add'),
    },
    {
      name: 'Ajouter une dépense',
      icon: TrendingDown,
      color: 'bg-red-100 text-red-600',
      onClick: () => navigate('/expenses?action=add'),
    },
    {
      name: 'Ajouter un produit',
      icon: Package,
      color: 'bg-blue-100 text-blue-600',
      onClick: () => navigate('/products?action=add'),
    },
    {
      name: 'Enregistrer une vente',
      icon: ShoppingCart,
      color: 'bg-purple-100 text-purple-600',
      onClick: () => navigate('/sales?action=add'),
    },
  ];

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Actions rapides
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((action) => (
          <button
            key={action.name}
            onClick={action.onClick}
            className="flex flex-col items-center justify-center p-4 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${action.color}`}
            >
              <action.icon className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-gray-700 text-center">
              {action.name}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
