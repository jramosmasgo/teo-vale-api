import { Types, Document } from 'mongoose';
import { IClient } from './client.interface';
import { IUser } from './user.interface';

export interface IPayment extends Document {
  client?: Types.ObjectId | IClient;
  amountPaid?: number;
  paymentDate?: Date;
  paymentTime?: string;
  paymentCode?: string;
  registeredBy?: Types.ObjectId | IUser;
  shipments?: Array<{
    shipment: Types.ObjectId;
    amountApplied: number;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}
