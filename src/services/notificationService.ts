import { supabase } from '@/lib/supabase';
import { Notification, NotificationType } from '@/types';

class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Créer une notification
  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType = 'info',
    relatedTable?: string,
    relatedId?: string
  ): Promise<Notification | null> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          is_read: false,
          related_table: relatedTable || null,
          related_id: relatedId || null,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la création de la notification:', error);
      return null;
    }
  }

  // Récupérer les notifications d'un utilisateur
  async getNotifications(userId: string, limit: number = 10): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      return [];
    }
  }

  // Marquer une notification comme lue
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erreur lors du marquage de la notification comme lue:', error);
      return false;
    }
  }

  // Marquer toutes les notifications comme lues
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
      return false;
    }
  }

  // Supprimer une notification
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de la notification:', error);
      return false;
    }
  }

  // Compter les notifications non lues
  async countUnreadNotifications(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Erreur lors du comptage des notifications non lues:', error);
      return 0;
    }
  }

  // Envoyer une notification de stock faible
  async sendLowStockNotification(
    userId: string,
    productId: string,
    productName: string,
    currentQuantity: number,
    minQuantity: number
  ): Promise<Notification | null> {
    return this.createNotification(
      userId,
      'Stock faible',
      `Le produit "${productName}" a atteint le seuil minimum. Quantité actuelle: ${currentQuantity}, seuil: ${minQuantity}`,
      'warning',
      'products',
      productId
    );
  }

  // Envoyer une notification d'objectif d'épargne atteint
  async sendSavingsGoalNotification(
    userId: string,
    goalId: string,
    goalName: string,
    currentAmount: number,
    targetAmount: number
  ): Promise<Notification | null> {
    return this.createNotification(
      userId,
      'Objectif atteint !',
      `Félicitations ! Vous avez atteint votre objectif d'épargne "${goalName}". Montant actuel: ${currentAmount}/${targetAmount}`,
      'success',
      'savings_goals',
      goalId
    );
  }

  // Envoyer une notification de dette à rembourser
  async sendDebtReminderNotification(
    userId: string,
    debtId: string,
    debtName: string,
    amount: number,
    dueDate: string
  ): Promise<Notification | null> {
    return this.createNotification(
      userId,
      'Rappel de dette',
      `Rappel: La dette "${debtName}" de ${amount} FCFA arrive à échéance le ${new Date(dueDate).toLocaleDateString()}`,
      'warning',
      'debts',
      debtId
    );
  }

  // Envoyer une notification de dépense anormale
  async sendExpenseAnomalyNotification(
    userId: string,
    expenseId: string,
    category: string,
    amount: number
  ): Promise<Notification | null> {
    return this.createNotification(
      userId,
      'Dépense anormale détectée',
      `Une dépense élevée a été détectée dans la catégorie "${category}": ${amount} FCFA`,
      'warning',
      'expenses',
      expenseId
    );
  }
}

export const notificationService = NotificationService.getInstance();
export default notificationService;
