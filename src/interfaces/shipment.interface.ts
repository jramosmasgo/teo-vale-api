import { Types, Document } from 'mongoose';
import { IOrder } from './order.interface';
import { IClient } from './client.interface';

export interface IShipment extends Document {
  order?: Types.ObjectId | IOrder;
  client?: Types.ObjectId | IClient;
  status?: string;
  amount?: number;
  amountPaid?: number;
  paymentStatus?: 'UNPAID' | 'COMPLETED' | 'INCOMPLETE';
  deliveryDate?: Date;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
