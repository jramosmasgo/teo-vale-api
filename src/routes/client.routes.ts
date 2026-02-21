import { Router } from 'express';
import { ClientController } from '../controllers/client.controller';
import { checkJwt } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();
const clientController = new ClientController();

router.post('/', checkJwt, clientController.createClient);
router.get('/', checkJwt, clientController.getClients);
router.get('/:id', checkJwt, clientController.getClient);
router.put('/:id', checkJwt, clientController.updateClient);
router.post('/:id/upload-image', checkJwt, upload.single('image'), clientController.uploadProfileImage);
router.delete('/:id/delete-image', checkJwt, clientController.deleteProfileImage);

export default router;
