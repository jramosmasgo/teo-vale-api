import mongoose from 'mongoose';
import { Expense } from '../models/Expense';
import { IExpense, ExpenseCategory } from '../interfaces/expense.interface';

interface ExpenseFilters {
  category?: string;
  startDate?: string;
  endDate?: string;
  registeredBy?: string;
}

export class ExpenseService {
  /**
   * Crea un nuevo gasto.
   */
  async create(data: {
    category: ExpenseCategory;
    description: string;
    amount: number;
    expenseDate?: Date;
    registeredBy: string;
    notes?: string;
  }): Promise<IExpense> {
    const expense = new Expense({
      ...data,
      registeredBy: new mongoose.Types.ObjectId(data.registeredBy),
      expenseDate: data.expenseDate || new Date(),
    });
    return expense.save();
  }

  /**
   * Obtiene todos los gastos con paginación y filtros opcionales.
   */
  async getAll(
    page: number = 1,
    limit: number = 15,
    filters: ExpenseFilters = {}
  ): Promise<{ expenses: IExpense[]; total: number; totalAmount: number }> {
    const skip = (page - 1) * limit;
    const query: any = {};

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.startDate || filters.endDate) {
      query.expenseDate = {};
      if (filters.startDate) {
        query.expenseDate.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        query.expenseDate.$lte = end;
      }
    }

    if (filters.registeredBy) {
      query.registeredBy = new mongoose.Types.ObjectId(filters.registeredBy);
    }

    const [expenses, total, totalAmountResult] = await Promise.all([
      Expense.find(query)
        .sort({ expenseDate: -1 })
        .skip(skip)
        .limit(limit)
        .populate('registeredBy', 'fullName email'),
      Expense.countDocuments(query),
      Expense.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const totalAmount = totalAmountResult[0]?.total ?? 0;

    return { expenses, total, totalAmount };
  }

  /**
   * Obtiene un gasto por ID.
   */
  async getById(id: string): Promise<IExpense | null> {
    return Expense.findById(id).populate('registeredBy', 'fullName email');
  }

  /**
   * Actualiza un gasto existente.
   */
  async update(id: string, data: Partial<IExpense>): Promise<IExpense | null> {
    return Expense.findByIdAndUpdate(id, data, { new: true }).populate(
      'registeredBy',
      'fullName email'
    );
  }

  /**
   * Elimina un gasto.
   */
  async delete(id: string): Promise<IExpense | null> {
    return Expense.findByIdAndDelete(id);
  }

  /**
   * Resumen de gastos agrupados por categoría para un rango de fechas.
   */
  async getSummaryByCategory(
    startDate?: string,
    endDate?: string
  ): Promise<{ category: string; total: number; count: number }[]> {
    const match: any = {};

    if (startDate || endDate) {
      match.expenseDate = {};
      if (startDate) match.expenseDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        match.expenseDate.$lte = end;
      }
    }

    const result = await Expense.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    return result.map((r) => ({
      category: r._id,
      total: r.total,
      count: r.count,
    }));
  }
}
