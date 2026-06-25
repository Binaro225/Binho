import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { Menu, X, Bell, Settings, User, LogOut, Home, TrendingUp, TrendingDown, Package, ShoppingCart, PiggyBank, FileText, Bot, BarChart3 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { notificationService } from '@/services/notificationService';

// Composants
import Sidebar from './Sidebar';
import Header from './Header';
import MobileSidebar from './MobileSidebar';

const MainLayout = () => {
  const { authState, signOut } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Vérifier les notifications non lues
    const checkUnreadNotifications = async () => {
      if (authState.user) {
        const count = await notificationService.countUnreadNotifications(authState.user.id);
        setUnreadCount(count);
      }
    };

    checkUnreadNotifications();

    // Écouter les changements de notifications en temps réel
    if (authState.user) {
      const channel = supabase
        .channel('notifications_channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${authState.user.id}`,
          },
          () => {
            checkUnreadNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [authState.user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Navigation items
  const navItems = [
    { name: 'Tableau de bord', href: '/', icon: Home },
    { name: 'Revenus', href: '/incomes', icon: TrendingUp },
    { name: 'Dépenses', href: '/expenses', icon: TrendingDown },
    { name: 'Produits', href: '/products', icon: Package },
    { name: 'Ventes', href: '/sales', icon: ShoppingCart },
    { name: 'Épargne', href: '/savings', icon: PiggyBank },
    { name: 'Dettes', href: '/debts', icon: FileText },
    { name: 'Rapports', href: '/reports', icon: BarChart3 },
    { name: 'Assistant IA', href: '/ai-assistant', icon: Bot },
  ];

  const bottomNavItems = [
    { name: 'Notifications', href: '/notifications', icon: Bell, badge: unreadCount },
    { name: 'Paramètres', href: '/settings', icon: Settings },
    { name: 'Profil', href: '/settings#profile', icon: User },
    { name: 'Déconnexion', href: '#', icon: LogOut, onClick: handleSignOut },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Desktop */}
      <div className="hidden lg:flex">
        <Sidebar
          navItems={navItems}
          bottomNavItems={bottomNavItems}
          user={authState.user}
        />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        navItems={navItems}
        bottomNavItems={bottomNavItems}
        user={authState.user}
      />

      {/* Main Content */}
      <div className="flex-1 lg:pl-64">
        {/* Header */}
        <Header
          onMenuClick={toggleSidebar}
          user={authState.user}
          unreadCount={unreadCount}
        />

        {/* Page Content */}
        <main className="min-h-screen p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
