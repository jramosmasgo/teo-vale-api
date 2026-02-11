import { Types, Document } from 'mongoose';
import { IClient } from './client.interface';

export interface IOrder extends Document {
  orderCode?: string;
  client?: Types.ObjectId | IClient;
  orderDays?: string[];
  schedule?: string;
  amount?: number;
  description?: string;
  status?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
