import { Schema, model } from 'mongoose';
import { IExpense } from '../interfaces/expense.interface';

const CATEGORIES = ['HARINA', 'MANTECA', 'LENA', 'SUELDO', 'AGUA', 'LUZ', 'ARRIENDO', 'OTRO'];

const ExpenseSchema = new Schema<IExpense>(
  {
    category: {
      type: String,
      enum: CATEGORIES,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    expenseDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    registeredBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Índice para filtros por fecha y categoría
ExpenseSchema.index({ expenseDate: -1 });
ExpenseSchema.index({ category: 1 });
ExpenseSchema.index({ registeredBy: 1 });

export const Expense = model<IExpense>('Expense', ExpenseSchema);
