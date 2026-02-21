import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';

const notificationService = new NotificationService();

export class NotificationController {
  /**
   * GET /api/notifications
   * Lista notificaciones paginadas con contador de no leídas.
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const userId = (req as any).user?.id as string | undefined;

      const result = await notificationService.getAll(page, limit, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/:id/seen
   * Marca una notificación específica como vista por el usuario autenticado.
   */
  async markAsSeen(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id as string;

      if (!userId) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const notification = await notificationService.markAsSeen(id, userId);

      if (!notification) {
        return res.status(404).json({ message: 'Notificación no encontrada' });
      }

      res.json(notification);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/seen-all
   * Marca todas las notificaciones como vistas por el usuario autenticado.
   */
  async markAllAsSeen(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id as string;

      if (!userId) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      await notificationService.markAllAsSeen(userId);
      res.json({ message: 'Todas las notificaciones marcadas como vistas' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/notifications/cleanup
   * Elimina notificaciones con más de 15 días.
   * Idealmente protegido o llamado por un cron job.
   */
  async cleanup(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await notificationService.deleteOldNotifications();
      res.json({
        message: `Se eliminaron ${result.deleted} notificaciones antiguas`,
        deleted: result.deleted,
      });
    } catch (error) {
      next(error);
    }
  }
}
