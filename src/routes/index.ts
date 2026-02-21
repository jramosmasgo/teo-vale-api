import { Router, Request, Response } from 'express';

const router = Router();

// Import other routes here
import userRoutes from './user.routes';
import clientRoutes from './client.routes';
import orderRoutes from './order.routes';
import shipmentRoutes from './shipment.routes';
import paymentRoutes from './payment.routes';
import analyticsRoutes from './analytics.routes';
import qrRoutes from './qr.routes';
import excelRoutes from './excel.routes';
import notificationRoutes from './notification.routes';
import expenseRoutes from './expense.routes';

router.use('/users', userRoutes);
router.use('/clients', clientRoutes);
router.use('/orders', orderRoutes);
router.use('/shipments', shipmentRoutes);
router.use('/payments', paymentRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/qr', qrRoutes);
router.use('/excel', excelRoutes);
router.use('/notifications', notificationRoutes);
router.use('/expenses', expenseRoutes);

router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
