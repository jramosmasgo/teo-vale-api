import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { checkJwt } from '../middlewares/auth.middleware';

const router = Router();
const userController = new UserController();

router.post('/', checkJwt, userController.createUser);
router.put('/:id', checkJwt, userController.updateUser);
router.post('/login', userController.login);

export default router;
