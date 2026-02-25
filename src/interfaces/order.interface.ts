import { Types, Document } from 'mongoose';
import { IClient } from './client.interface';

export interface IOrderItem {
  name: string;
  price: number; // precio en soles
}

export interface IOrder extends Document {
  orderCode?: string;
  client?: Types.ObjectId | IClient;
  orderDays?: string[];
  schedule?: string;
  amount?: number;
  items?: IOrderItem[];
  status?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
