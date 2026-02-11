import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { checkJwt } from '../middlewares/auth.middleware';

const router = Router();
const orderController = new OrderController();

router.post('/', checkJwt, orderController.createOrder);
router.get('/', checkJwt, orderController.getOrders);
router.get('/:id', checkJwt, orderController.getOrder);
router.put('/:id', checkJwt, orderController.updateOrder);
router.get('/client/:clientId', checkJwt, orderController.getOrdersByClient);

export default router;
