import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { checkJwt } from '../middlewares/auth.middleware';

const router = Router();
const paymentController = new PaymentController();

router.post('/', checkJwt, paymentController.createPayment);
router.get('/', checkJwt, paymentController.getPayments);
router.get('/:id', checkJwt, paymentController.getPayment);
router.put('/:id', checkJwt, paymentController.updatePayment);
router.delete('/:id', checkJwt, paymentController.deletePayment);

export default router;
