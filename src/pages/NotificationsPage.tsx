import { useState, useEffect } from 'react';
import { notificationService } from '@/services/notificationService';
import { useAppContext } from '@/context/AppContext';
import { Bell, Trash2, Check, AlertTriangle, Package, PiggyBank, Users, FileText } from 'lucide-react';
import { formatDate, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';

const notificationIcons: Record<string, React.ReactNode> = {
  info: <Bell className="w-5 h-5" />,
  warning: <AlertTriangle className="w-5 h-5" />,
  error: <AlertTriangle className="w-5 h-5" />,
  success: <Check className="w-5 h-5" />,
};

const notificationColors: Record<string, string> = {
  info: 'bg-blue-100 text-blue-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  success: 'bg-green-100 text-green-800',
};

const tableIcons: Record<string, React.ReactNode> = {
  products: <Package className="w-4 h-4" />,
  savings_goals: <PiggyBank className="w-4 h-4" />,
  debts: <FileText className="w-4 h-4" />,
  expenses: <Users className="w-4 h-4" />,
  default: <Bell className="w-4 h-4" />,
};

const NotificationsPage = () => {
  const { authState } = useAppContext();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!authState.user) return;

      try {
        setIsLoading(true);
        const notifs = await notificationService.getNotifications(authState.user.id, 50);
        setNotifications(notifs);
      } catch (error) {
        console.error('Erreur lors de la récupération des notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();

    // Écouter les nouvelles notifications en temps réel
    const channel = supabase
      .channel('notifications_page_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${authState.user?.id}`,
        },
        (payload) => {
          const newNotif = payload.new as any;
          setNotifications((prev) => [newNotif, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authState.user]);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!authState.user) return;

    try {
      await notificationService.markAsRead(notificationId, authState.user.id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!authState.user) return;

    try {
      await notificationService.markAllAsRead(authState.user.id);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setSelectedNotification(notifications.find((n) => n.id === id));
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId || !authState.user) return;

    try {
      await notificationService.deleteNotification(deleteId, authState.user.id);
      setNotifications((prev) => prev.filter((n) => n.id !== deleteId));
      setIsDeleteModalOpen(false);
      setDeleteId(null);
      setSelectedNotification(null);
    } catch (error) {
      console.error('Erreur lors de la suppression de la notification:', error);
    }
  };

  const handleClearAll = async () => {
    if (!authState.user) return;

    try {
      // Supprimer toutes les notifications
      for (const notif of notifications) {
        await notificationService.deleteNotification(notif.id, authState.user.id);
      }
      setNotifications([]);
    } catch (error) {
      console.error('Erreur lors de la suppression de toutes les notifications:', error);
    }
  };

  const getTableLabel = (table: string) => {
    switch (table) {
      case 'products':
        return 'Stock';
      case 'savings_goals':
        return 'Épargne';
      case 'debts':
        return 'Dettes';
      case 'expenses':
        return 'Dépenses';
      default:
        return 'Général';
    }
  };

  // Regrouper les notifications par date
  const groupedNotifications: Record<string, any[]> = {};
  notifications.forEach((notif) => {
    const date = formatDate(notif.created_at);
    if (!groupedNotifications[date]) {
      groupedNotifications[date] = [];
    }
    groupedNotifications[date].push(notif);
  });

  const sortedDates = Object.keys(groupedNotifications).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

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
            <h1 className="page-title">Notifications</h1>
            <p className="page-subtitle">
              Toutes vos alertes et notifications
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={handleMarkAllAsRead} className="btn btn-secondary btn-sm">
              <Check className="w-4 h-4 mr-2" />
              Tout marquer comme lu
            </button>
            <button onClick={handleClearAll} className="btn btn-danger btn-sm">
              <Trash2 className="w-4 h-4 mr-2" />
              Tout supprimer
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="card">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-300 mx-auto" />
            <p className="text-gray-500 mt-4">Aucune notification</p>
            <p className="text-sm text-gray-400 mt-2">
              Vous n'avez pas de nouvelles notifications
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <div key={date}>
                <h3 className="text-sm font-semibold text-gray-500 mb-3 sticky top-0 bg-white py-2 -mx-6 px-6">
                  {date}
                </h3>
                <div className="space-y-3">
                  {groupedNotifications[date].map((notif) => (
                    <div
                      key={notif.id}
                      className={`flex items-start space-x-4 p-4 rounded-lg border-l-4 transition-colors ${
                        notif.is_read
                          ? 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          : 'bg-white border-blue-500 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${notificationColors[notif.type]}`}
                        >
                          {notificationIcons[notif.type]}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{notif.title}</h4>
                            <p className="text-sm text-gray-500 truncate-2">{notif.message}</p>
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {formatDistanceToNow(new Date(notif.created_at), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                          {notif.related_table && (
                            <div className="flex items-center space-x-1">
                              {tableIcons[notif.related_table] || tableIcons.default}
                              <span>{getTableLabel(notif.related_table)}</span>
                            </div>
                          )}
                          {!notif.is_read && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                              Nouveau
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => handleMarkAsRead(notif.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            notif.is_read
                              ? 'text-gray-400 hover:bg-gray-100'
                              : 'text-blue-600 hover:bg-blue-50'
                          }`}
                          title={notif.is_read ? 'Déjà lu' : 'Marquer comme lu'}
                          disabled={notif.is_read}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(notif.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Supprimer la notification"
        message={`Êtes-vous sûr de vouloir supprimer cette notification : "${selectedNotification?.title}" ?`}
      />
    </div>
  );
};

export default NotificationsPage;
