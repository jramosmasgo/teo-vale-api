import { Schema, model } from 'mongoose';
import { INotification } from '../interfaces/notification.interface';

const NotificationSchema = new Schema<INotification>(
  {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'ORDER_CREATED',
        'ORDER_UPDATED',
        'ORDER_CANCELLED',
        'CLIENT_CREATED',
        'SHIPMENT_CANCELLED',
        'SHIPMENT_UPDATED',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    seenBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

// Índice para la limpieza automática por fecha
NotificationSchema.index({ createdAt: 1 });
// Índice para consultas rápidas por usuario creador
NotificationSchema.index({ createdBy: 1 });

export const Notification = model<INotification>('Notification', NotificationSchema);
