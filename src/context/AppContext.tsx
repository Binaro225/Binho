import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth, AuthState } from '@/hooks/useAuth';
import { useDashboard, DashboardState } from '@/hooks/useDashboard';
import { useAI, AIState } from '@/hooks/useAI';

interface AppContextType {
  authState: AuthState;
  dashboardState: DashboardState;
  aiState: AIState;
  // Fonctions d'authentification
  signUp: (credentials: any) => Promise<any>;
  signIn: (credentials: any) => Promise<any>;
  signOut: () => Promise<void>;
  updateProfile: (profileData: any) => Promise<any>;
  resetPassword: (email: string) => Promise<boolean>;
  // Fonctions de dashboard
  refreshDashboard: () => Promise<void>;
  // Fonctions d'IA
  sendMessage: (message: string) => Promise<void>;
  executeAction: (action: any) => Promise<any>;
  cancelAction: () => void;
  clearMessages: () => void;
  analyzeFinances: () => Promise<any>;
  generateReport: (type: any) => Promise<any>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const {
    authState,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
  } = useAuth();

  const {
    dashboardState,
    refreshDashboard,
  } = useDashboard();

  const {
    aiState,
    sendMessage,
    executeAction,
    cancelAction,
    clearMessages,
    analyzeFinances,
    generateReport,
  } = useAI();

  const value: AppContextType = {
    authState,
    dashboardState,
    aiState,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    refreshDashboard,
    sendMessage,
    executeAction,
    cancelAction,
    clearMessages,
    analyzeFinances,
    generateReport,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext doit être utilisé dans un AppProvider');
  }
  return context;
};

export default AppContext;
