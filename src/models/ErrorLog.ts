import { Schema, model } from 'mongoose';
import { IErrorLog } from '../interfaces';

const ErrorLogSchema = new Schema<IErrorLog>(
  {
    message: { type: String, required: true },
    stack: { type: String },
    route: { type: String, required: true },
    method: { type: String, required: true },
    user: { type: String },
    statusCode: { type: Number },
    metadata: { type: Schema.Types.Mixed }, // Flexible field
  },
  { timestamps: { createdAt: true, updatedAt: false } } // We only care about when it happened
);

export const ErrorLog = model<IErrorLog>('ErrorLog', ErrorLogSchema);
