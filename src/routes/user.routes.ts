import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { checkJwt } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();
const userController = new UserController();

router.get('/', checkJwt, userController.getUsers);
router.post('/', checkJwt, userController.createUser);
router.put('/:id', checkJwt, userController.updateUser);
router.delete('/:id', checkJwt, userController.deleteUser);
router.post('/login', userController.login);
router.post('/:id/upload-image', checkJwt, upload.single('image'), userController.uploadProfileImage);
router.delete('/:id/delete-image', checkJwt, userController.deleteProfileImage);

export default router;
