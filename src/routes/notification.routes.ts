import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { checkJwt } from '../middlewares/auth.middleware';

const router = Router();
const notificationController = new NotificationController();

// Listar notificaciones (paginadas)
router.get('/', checkJwt, notificationController.getAll);

// Marcar todas como vistas
router.patch('/seen-all', checkJwt, notificationController.markAllAsSeen);

// Marcar una notificación como vista
router.patch('/:id/seen', checkJwt, notificationController.markAsSeen);

// Limpieza manual de notificaciones antiguas (>15 días) — no requiere JWT (uso por cron job)
router.delete('/cleanup', notificationController.cleanup);

export default router;
