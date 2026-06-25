import { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

interface StatCardProps {
  icon: LucideIcon;
  iconColor: string;
  value: string;
  label: string;
  trend?: number;
  trendColor?: 'green' | 'red' | 'blue' | 'yellow';
}

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  iconColor,
  value,
  label,
  trend = 0,
  trendColor = 'green',
}) => {
  const trendColors = {
    green: 'text-green-600 bg-green-100',
    red: 'text-red-600 bg-red-100',
    blue: 'text-blue-600 bg-blue-100',
    yellow: 'text-yellow-600 bg-yellow-100',
  };

  const isPositive = trend >= 0;

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="stat-value">{value}</p>
          <p className="stat-label">{label}</p>
        </div>
        <div
          className={cn(
            'w-12 h-12 rounded-lg flex items-center justify-center',
            iconColor
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {trend !== 0 && (
        <div className="mt-4 flex items-center">
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
              trendColors[trendColor]
            )}
          >
            {isPositive ? '+' : ''}
            {trend}%
          </span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
