import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';

// Layouts
import MainLayout from '@/components/layout/MainLayout';
import AuthLayout from '@/components/layout/AuthLayout';

// Pages
import DashboardPage from '@/pages/DashboardPage';
import IncomesPage from '@/pages/IncomesPage';
import ExpensesPage from '@/pages/ExpensesPage';
import ProductsPage from '@/pages/ProductsPage';
import SalesPage from '@/pages/SalesPage';
import SavingsPage from '@/pages/SavingsPage';
import DebtsPage from '@/pages/DebtsPage';
import ReportsPage from '@/pages/ReportsPage';
import AIAssistantPage from '@/pages/AIAssistantPage';
import SettingsPage from '@/pages/SettingsPage';
import NotificationsPage from '@/pages/NotificationsPage';

// Auth Pages
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';

// Components
import LoadingSpinner from '@/components/common/LoadingSpinner';
import NotificationToast from '@/components/common/NotificationToast';

function App() {
  const { authState } = useAppContext();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Vérifier l'état d'authentification au chargement
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoading(false);
    };

    checkAuth();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      setIsLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Afficher le loader pendant le chargement
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Rediriger vers la page de login si non authentifié
  const requireAuth = (element: React.ReactNode) => {
    if (!authState.isAuthenticated && !authState.isLoading) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return element;
  };

  // Rediriger vers le dashboard si déjà authentifié
  const requireGuest = (element: React.ReactNode) => {
    if (authState.isAuthenticated && !authState.isLoading) {
      return <Navigate to="/" replace />;
    }
    return element;
  };

  return (
    <>
      <Routes>
        {/* Routes publiques (authentification) */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={requireGuest(<LoginPage />)} />
          <Route path="/register" element={requireGuest(<RegisterPage />)} />
          <Route path="/forgot-password" element={requireGuest(<ForgotPasswordPage />)} />
          <Route path="/reset-password" element={requireGuest(<ResetPasswordPage />)} />
        </Route>

        {/* Routes protégées (application) */}
        <Route element={<MainLayout />}>
          <Route path="/" element={requireAuth(<DashboardPage />)} />
          <Route path="/incomes" element={requireAuth(<IncomesPage />)} />
          <Route path="/expenses" element={requireAuth(<ExpensesPage />)} />
          <Route path="/products" element={requireAuth(<ProductsPage />)} />
          <Route path="/sales" element={requireAuth(<SalesPage />)} />
          <Route path="/savings" element={requireAuth(<SavingsPage />)} />
          <Route path="/debts" element={requireAuth(<DebtsPage />)} />
          <Route path="/reports" element={requireAuth(<ReportsPage />)} />
          <Route path="/ai-assistant" element={requireAuth(<AIAssistantPage />)} />
          <Route path="/notifications" element={requireAuth(<NotificationsPage />)} />
          <Route path="/settings" element={requireAuth(<SettingsPage />)} />
        </Route>

        {/* Redirection par défaut */}
        <Route path="*" element={<Navigate to={authState.isAuthenticated ? "/" : "/login"} replace />} />
      </Routes>

      {/* Toast de notifications */}
      <NotificationToast />
    </>
  );
}

export default App;
