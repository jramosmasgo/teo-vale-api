import { Router } from 'express';
import { ExpenseController } from '../controllers/expense.controller';
import { checkJwt } from '../middlewares/auth.middleware';

const router = Router();
const expenseController = new ExpenseController();

// Resumen por categoría (antes del /:id para evitar conflictos)
router.get('/summary', checkJwt, expenseController.getSummary);

// CRUD
router.get('/', checkJwt, expenseController.getAll);
router.post('/', checkJwt, expenseController.create);
router.get('/:id', checkJwt, expenseController.getById);
router.put('/:id', checkJwt, expenseController.update);
router.delete('/:id', checkJwt, expenseController.delete);

export default router;
