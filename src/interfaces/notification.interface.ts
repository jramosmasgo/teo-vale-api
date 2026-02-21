import { Document, Types } from 'mongoose';

export type NotificationType =
  | 'ORDER_CREATED'
  | 'ORDER_UPDATED'
  | 'ORDER_CANCELLED'
  | 'CLIENT_CREATED'
  | 'SHIPMENT_CANCELLED'
  | 'SHIPMENT_UPDATED';

export interface INotification extends Document {
  createdBy: Types.ObjectId;   // Usuario que originó la acción
  type: NotificationType;
  title: string;
  content: string;
  seenBy: Types.ObjectId[];    // Array de usuarios que han visto la notificación
  createdAt?: Date;
  updatedAt?: Date;
}
