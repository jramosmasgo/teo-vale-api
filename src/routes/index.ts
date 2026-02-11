import { Router } from 'express';

const router = Router();

// Import other routes here
import userRoutes from './user.routes';
import clientRoutes from './client.routes';
import orderRoutes from './order.routes';
import shipmentRoutes from './shipment.routes';
import paymentRoutes from './payment.routes';

router.use('/users', userRoutes);
router.use('/clients', clientRoutes);
router.use('/orders', orderRoutes);
router.use('/shipments', shipmentRoutes);
router.use('/payments', paymentRoutes);

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
