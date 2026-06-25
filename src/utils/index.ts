import { format, parseISO, isValid, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { fr } from 'date-fns/locale';

// Formatage des nombres
export const formatCurrency = (amount: number, currency: string = 'FCFA'): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency === 'FCFA' ? 'XOF' : currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('fr-FR').format(value);
};

export const formatPercentage = (value: number, decimals: number = 2): string => {
  return `${value.toFixed(decimals)}%`;
};

// Formatage des dates
export const formatDate = (date: string | Date, formatStr: string = 'dd/MM/yyyy'): string => {
  if (!date) return '';
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsedDate)) return '';
  return format(parsedDate, formatStr, { locale: fr });
};

export const formatDateTime = (date: string | Date): string => {
  if (!date) return '';
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsedDate)) return '';
  return format(parsedDate, 'dd/MM/yyyy HH:mm', { locale: fr });
};

export const formatMonthYear = (date: string | Date): string => {
  if (!date) return '';
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsedDate)) return '';
  return format(parsedDate, 'MMMM yyyy', { locale: fr });
};

// Calculs financiers
export const calculateProfit = (sellingPrice: number, purchasePrice: number): number => {
  return sellingPrice - purchasePrice;
};

export const calculateProfitMargin = (sellingPrice: number, purchasePrice: number): number => {
  if (purchasePrice === 0) return 0;
  return ((sellingPrice - purchasePrice) / purchasePrice) * 100;
};

export const calculateTotalValue = (items: { price: number; quantity: number }[]): number => {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

// Calculs de progression
export const calculateProgress = (current: number, target: number): number => {
  if (target === 0) return 100;
  return Math.min((current / target) * 100, 100);
};

// Génération de couleurs
export const getCategoryColor = (category: string): string => {
  const colors = {
    salaire: '#10B981',
    freelance: '#3B82F6',
    vente: '#8B5CF6',
    cadeau: '#F59E0B',
    commission: '#06B6D4',
    autre: '#6B7280',
    nourriture: '#EF4444',
    transport: '#06B6D4',
    internet: '#8B5CF6',
    sante: '#10B981',
    education: '#F59E0B',
    loyer: '#6B7280',
    divertissement: '#EC4899',
  };
  return colors[category.toLowerCase()] || '#6B7280';
};

// Génération d'IDs uniques
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};

// Validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

export const isValidAmount = (amount: number): boolean => {
  return amount > 0;
};

// Manipulation de tableaux
export const groupBy = <T, K extends keyof T>(array: T[], key: K): Record<string, T[]> => {
  return array.reduce((acc, item) => {
    const groupKey = String(item[key]);
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<string, T[]>);
};

export const sumBy = <T>(array: T[], key: keyof T): number => {
  return array.reduce((sum, item) => {
    const value = item[key] as unknown as number;
    return sum + (typeof value === 'number' ? value : 0);
  }, 0);
};

// Calculs de périodes
export const getCurrentMonthRange = (): { start: Date; end: Date } => {
  return {
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  };
};

export const getCurrentYearRange = (): { start: Date; end: Date } => {
  return {
    start: startOfYear(new Date()),
    end: endOfYear(new Date()),
  };
};

export const getLast7Days = (): { start: Date; end: Date } => {
  const end = new Date();
  const start = subDays(end, 6);
  return { start, end };
};

export const getLast30Days = (): { start: Date; end: Date } => {
  const end = new Date();
  const start = subDays(end, 29);
  return { start, end };
};

// Formatage pour les graphiques
export const formatChartData = (
  data: { date: string; value: number }[],
  formatType: 'day' | 'month' | 'year' = 'month'
): { labels: string[]; values: number[] } => {
  const labels: string[] = [];
  const values: number[] = [];

  data.forEach((item) => {
    const date = parseISO(item.date);
    if (!isValid(date)) return;

    let label: string;
    switch (formatType) {
      case 'day':
        label = format(date, 'dd/MM', { locale: fr });
        break;
      case 'month':
        label = format(date, 'MMM', { locale: fr });
        break;
      case 'year':
        label = format(date, 'yyyy', { locale: fr });
        break;
      default:
        label = format(date, 'MMM', { locale: fr });
    }

    labels.push(label);
    values.push(item.value);
  });

  return { labels, values };
};

// Calculs statistiques
export const calculateAverage = (values: number[]): number => {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

export const calculateMedian = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
};

export const calculateStandardDeviation = (values: number[]): number => {
  if (values.length === 0) return 0;
  const avg = calculateAverage(values);
  const squaredDiffs = values.map((value) => Math.pow(value - avg, 2));
  const variance = calculateAverage(squaredDiffs);
  return Math.sqrt(variance);
};

// Stockage local
export const setLocalStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement dans localStorage:', error);
  }
};

export const getLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Erreur lors de la lecture de localStorage:', error);
    return defaultValue;
  }
};

export const removeLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Erreur lors de la suppression de localStorage:', error);
  }
};

// Gestion des erreurs
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleError = (error: unknown, context: string = 'Unknown'): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, 'INTERNAL_ERROR', { context, stack: error.stack });
  }

  return new AppError('Une erreur inconnue est survenue', 'UNKNOWN_ERROR', { context, error });
};

// Export de toutes les fonctions
export {
  format,
  parseISO,
  isValid,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from 'date-fns';
