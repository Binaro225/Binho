import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Bell, X } from 'lucide-react';
import { notificationService } from '@/services/notificationService';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  createdAt: string;
}

const NotificationToast = () => {
  const { authState } = useAppContext();
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!authState.user) return;

    // Récupérer les dernières notifications
    const fetchNotifications = async () => {
      const notifs = await notificationService.getNotifications(authState.user.id, 5);
      const unreadNotifs = notifs.filter((n) => !n.is_read);
      
      if (unreadNotifs.length > 0) {
        const toastNotifs: ToastNotification[] = unreadNotifs.map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          createdAt: n.created_at,
        }));
        
        setNotifications(toastNotifs);
        setShowToast(true);
        
        // Marquer comme lues après affichage
        setTimeout(() => {
          notificationService.markAllAsRead(authState.user.id);
        }, 5000);
      }
    };

    fetchNotifications();

    // Écouter les nouvelles notifications en temps réel
    const channel = supabase
      .channel('notifications_toast_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${authState.user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as any;
          if (!newNotif.is_read) {
            const toastNotif: ToastNotification = {
              id: newNotif.id,
              title: newNotif.title,
              message: newNotif.message,
              type: newNotif.type,
              createdAt: newNotif.created_at,
            };
            setNotifications((prev) => [toastNotif, ...prev].slice(0, 5));
            setShowToast(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authState.user]);

  const handleClose = () => {
    setShowToast(false);
    setTimeout(() => setNotifications([]), 300);
  };

  const getToastColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  if (!showToast || notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`rounded-lg border-l-4 p-4 shadow-lg ${getToastColor(
          notifications[0].type
        )}`}
        role="alert"
      >
        <div className="flex">
          <div className="flex-shrink-0">
            <Bell className={`w-5 h-5 ${getIconColor(notifications[0].type)}`} />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">{notifications[0].title}</p>
            <p className="text-sm mt-1">{notifications[0].message}</p>
            <p className="text-xs text-gray-500 mt-1">
              {formatDistanceToNow(new Date(notifications[0].createdAt), {
                addSuffix: true,
                locale: fr,
              })}
            </p>
          </div>
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                onClick={handleClose}
                className={`inline-flex rounded-md p-1.5 hover:bg-${notifications[0].type}-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${notifications[0].type}-600`}
              >
                <span className="sr-only">Fermer</span>
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationToast;
