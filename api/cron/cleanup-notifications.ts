import { setDefaultResultOrder } from 'dns';
setDefaultResultOrder('ipv4first');

import dotenv from 'dotenv';
dotenv.config();

import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectDB from '../../src/config/db';
import { NotificationService } from '../../src/services/notification.service';

const notificationService = new NotificationService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Optional: protect from unauthorized calls
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    await connectDB();
    const result = await notificationService.deleteOldNotifications();
    return res.status(200).json({
      message: `Se eliminaron ${result.deleted} notificaciones antiguas`,
      deleted: result.deleted,
    });
  } catch (error: any) {
    console.error('[CRON] Error limpiando notificaciones:', error);
    return res.status(500).json({
      message: 'Error al limpiar las notificaciones',
      error: error.message,
    });
  }
}
