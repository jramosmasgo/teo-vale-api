import { Router } from 'express';
import { ShipmentController } from '../controllers/shipment.controller';
import { checkJwt } from '../middlewares/auth.middleware';

const router = Router();
const shipmentController = new ShipmentController();

router.post('/', checkJwt, shipmentController.createShipment);
router.post('/generate-today', shipmentController.generateTodayShipments);
router.post('/generate-for-order/:orderId', checkJwt, shipmentController.generateShipmentForOrder);
router.get('/generation-history', checkJwt, shipmentController.getGenerationHistory);
router.get('/generation-today', checkJwt, shipmentController.getTodayGeneration);
router.get('/client/:clientId', checkJwt, shipmentController.getShipmentsByClient);
router.get('/', checkJwt, shipmentController.getShipments);
router.get('/:id', checkJwt, shipmentController.getShipment);
router.put('/:id', checkJwt, shipmentController.updateShipment);

export default router;
