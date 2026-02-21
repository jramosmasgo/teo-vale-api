import { Request, Response, NextFunction } from 'express';
import { ExpenseService } from '../services/expense.service';
import { ExpenseCategory } from '../interfaces/expense.interface';

const expenseService = new ExpenseService();

export class ExpenseController {
  /**
   * POST /api/expenses
   * Registra un nuevo gasto. El usuario que lo registra se obtiene del token JWT.
   */
  async create(req: any, res: any, next: any) {
    try {
      const userId = (req as any).user?.id as string;
      if (!userId) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const { category, description, amount, expenseDate, notes } = req.body;

      if (!category || !description || amount === undefined) {
        return res.status(400).json({
          message: 'Los campos category, description y amount son requeridos',
        });
      }

      const expense = await expenseService.create({
        category: category as ExpenseCategory,
        description,
        amount: Number(amount),
        expenseDate: expenseDate ? new Date(expenseDate) : undefined,
        registeredBy: userId,
        notes,
      });

      res.status(201).json(expense);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/expenses
   * Lista gastos con paginación y filtros.
   */
  async getAll(req: any, res: any, next: any) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 15;

      const filters = {
        category: req.query.category as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        registeredBy: req.query.registeredBy as string,
      };

      const result = await expenseService.getAll(page, limit, filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/expenses/summary
   * Resumen de gastos totales agrupados por categoría.
   */
  async getSummary(req: any, res: any, next: any) {
    try {
      const { startDate, endDate } = req.query;
      const summary = await expenseService.getSummaryByCategory(
        startDate as string,
        endDate as string
      );
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/expenses/:id
   * Obtiene un gasto por ID.
   */
  async getById(req: any, res: any, next: any) {
    try {
      const expense = await expenseService.getById(req.params.id as string);
      if (!expense) {
        return res.status(404).json({ message: 'Gasto no encontrado' });
      }
      res.json(expense);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/expenses/:id
   * Actualiza un gasto existente.
   */
  async update(req: any, res: any, next: any) {
    try {
      const expense = await expenseService.update(req.params.id as string, req.body);
      if (!expense) {
        return res.status(404).json({ message: 'Gasto no encontrado' });
      }
      res.json(expense);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/expenses/:id
   * Elimina un gasto.
   */
  async delete(req: any, res: any, next: any) {
    try {
      const expense = await expenseService.delete(req.params.id as string);
      if (!expense) {
        return res.status(404).json({ message: 'Gasto no encontrado' });
      }
      res.json({ message: 'Gasto eliminado correctamente' });
    } catch (error) {
      next(error);
    }
  }
}
