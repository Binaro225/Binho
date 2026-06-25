import { Package, AlertTriangle } from 'lucide-react';
import { StockAlert } from '@/types';
import { formatDate } from '@/utils';

interface StockAlertsProps {
  alerts: StockAlert[];
}

const StockAlerts: React.FC<StockAlertsProps> = ({ alerts }) => {
  const hasAlerts = alerts.length > 0;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Alertes de stock
        </h3>
        {hasAlerts && (
          <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded-full">
            {alerts.length}
          </span>
        )}
      </div>

      {hasAlerts ? (
        <div className="space-y-3">
          {alerts.slice(0, 5).map((alert) => (
            <div
              key={alert.product_id}
              className="flex items-center space-x-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200"
            >
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {alert.product_name}
                </p>
                <p className="text-xs text-gray-500">
                  Stock: {alert.current_quantity} / Min: {alert.min_quantity}
                </p>
              </div>
            </div>
          ))}
          {alerts.length > 5 && (
            <button className="w-full text-sm text-blue-600 hover:text-blue-700 py-2">
              Voir toutes les alertes
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <Package className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="text-gray-500 mt-2">Aucune alerte de stock</p>
          <p className="text-xs text-gray-400 mt-1">
            Tous vos produits ont un stock suffisant
          </p>
        </div>
      )}
    </div>
  );
};

export default StockAlerts;
