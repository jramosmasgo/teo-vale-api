import { Types, Document } from 'mongoose';
import { IUser } from './user.interface';

export type ExpenseCategory =
  | 'HARINA'
  | 'MANTECA'
  | 'LENA'
  | 'SUELDO'
  | 'AGUA'
  | 'LUZ'
  | 'ARRIENDO'
  | 'OTRO';

export interface IExpense extends Document {
  category: ExpenseCategory;
  description: string;
  amount: number;
  expenseDate: Date;
  registeredBy: Types.ObjectId | IUser;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
