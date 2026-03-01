import { setDefaultResultOrder } from 'dns';
setDefaultResultOrder('ipv4first');

import dotenv from 'dotenv';
dotenv.config();

import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectDB from '../../src/config/db';
import { ShipmentService } from '../../src/services/shipment.service';

const shipmentService = new ShipmentService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel only calls crons via GET, but we can also protect with a secret header
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
    const result = await shipmentService.generateTodayShipments();
    return res.status(200).json({
      message: 'Envíos del día generados exitosamente',
      result,
    });
  } catch (error: any) {
    console.error('[CRON] Error generando envíos:', error);
    return res.status(500).json({
      message: 'Error al generar los envíos del día',
      error: error.message,
    });
  }
}
