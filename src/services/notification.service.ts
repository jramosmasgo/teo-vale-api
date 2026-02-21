import mongoose from 'mongoose';
import { Notification } from '../models/Notification';
import { INotification, NotificationType } from '../interfaces/notification.interface';

interface CreateNotificationPayload {
  createdBy: string;
  type: NotificationType;
  title: string;
  content: string;
}

export class NotificationService {
  /**
   * Crea una nueva notificación.
   */
  async createNotification(payload: CreateNotificationPayload): Promise<INotification> {
    const notification = new Notification({
      createdBy: new mongoose.Types.ObjectId(payload.createdBy),
      type: payload.type,
      title: payload.title,
      content: payload.content,
      seenBy: [],
    });
    return notification.save();
  }

  /**
   * Obtiene todas las notificaciones paginadas, opcionalmente filtradas por usuario.
   */
  async getAll(
    page: number = 1,
    limit: number = 20,
    userId?: string
  ): Promise<{ notifications: INotification[]; total: number; unread: number }> {
    const skip = (page - 1) * limit;
    const query: any = {};

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'fullName email')
        .populate('seenBy', 'fullName email'),
      Notification.countDocuments(query),
    ]);

    // Contar no leídas por este usuario
    let unread = 0;
    if (userId) {
      unread = await Notification.countDocuments({
        seenBy: { $ne: new mongoose.Types.ObjectId(userId) },
      });
    }

    return { notifications, total, unread };
  }

  /**
   * Marca una notificación como vista por el usuario dado.
   */
  async markAsSeen(
    notificationId: string,
    userId: string
  ): Promise<INotification | null> {
    return Notification.findByIdAndUpdate(
      notificationId,
      { $addToSet: { seenBy: new mongoose.Types.ObjectId(userId) } },
      { new: true }
    );
  }

  /**
   * Marca TODAS las notificaciones como vistas por el usuario dado.
   */
  async markAllAsSeen(userId: string): Promise<void> {
    await Notification.updateMany(
      { seenBy: { $ne: new mongoose.Types.ObjectId(userId) } },
      { $addToSet: { seenBy: new mongoose.Types.ObjectId(userId) } }
    );
  }

  /**
   * Elimina las notificaciones que tienen más de 15 días.
   * Pensado para ejecutarse mediante un cron job periódico.
   */
  async deleteOldNotifications(): Promise<{ deleted: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 15);

    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    return { deleted: result.deletedCount ?? 0 };
  }
}
