import { Router } from 'express';
import { ClientController } from '../controllers/client.controller';
import { checkJwt } from '../middlewares/auth.middleware';

const router = Router();
const clientController = new ClientController();

router.post('/', checkJwt, clientController.createClient);
router.get('/', checkJwt, clientController.getClients);
router.get('/:id', checkJwt, clientController.getClient);
router.put('/:id', checkJwt, clientController.updateClient);

export default router;
