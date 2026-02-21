import { Router } from 'express';
import { ExcelController } from '../controllers/excel.controller';
import { checkJwt } from '../middlewares/auth.middleware';

const router = Router();
const excelController = new ExcelController();

/**
 * GET /api/excel/payments
 * Descarga reporte de pagos en Excel.
 * Query params: paymentDate, startDate, endDate
 */
router.get('/payments', checkJwt, excelController.downloadPaymentsReport);

/**
 * GET /api/excel/deliveries
 * Descarga reporte de entregas en Excel.
 * Query params: deliveryDate, startDate, endDate, paymentStatus, status
 */
router.get('/deliveries', checkJwt, excelController.downloadDeliveriesReport);

export default router;
