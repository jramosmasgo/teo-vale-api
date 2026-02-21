import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { checkJwt } from '../middlewares/auth.middleware';

const router = Router();
const analyticsController = new AnalyticsController();

// Orders analytics
router.get('/orders/today', checkJwt, analyticsController.getTodayOrders);
router.get('/orders/updated-this-week', checkJwt, analyticsController.getOrdersUpdatedThisWeek);

// Payments analytics
router.get('/payments/today-total', checkJwt, analyticsController.getTodayPaymentsTotal);

// Clients analytics
router.get('/clients/with-debt', checkJwt, analyticsController.getClientsWithDebtCount);

// Shipments analytics
router.get('/shipments/cancelled-this-week', checkJwt, analyticsController.getShipmentsCancelledThisWeek);
router.get('/shipments/total-unpaid', checkJwt, analyticsController.getTotalUnpaidAmount);

export default router;
