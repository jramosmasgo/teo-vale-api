import { Document } from 'mongoose';

export interface IErrorLog extends Document {
  message: string;
  stack?: string;
  route: string;
  method: string;
  user?: string; // Storing user ID or identifier if available
  statusCode?: number;
  metadata?: any; // For any extra info
  createdAt?: Date;
}
