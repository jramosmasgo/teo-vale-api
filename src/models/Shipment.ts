import { Schema, model } from 'mongoose';
import { IShipment } from '../interfaces';

const ShipmentSchema = new Schema<IShipment>(
  {
    order: { 
      type: Schema.Types.ObjectId, 
      ref: 'Order',
      required: true 
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true
    },
    status: { 
      type: String,
      enum: [ 'DELIVERED', 'CANCELLED'],
      default: 'DELIVERED'
    },
    amount: {
      type: Number
    },
    amountPaid: {
      type: Number,
      default: 0
    },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'COMPLETED', 'INCOMPLETE'],
      default: 'UNPAID'
    },
    deliveryDate: { 
      type: Date,
      default: Date.now
    },
    notes: { 
      type: String 
    }
  },
  { timestamps: true }
);

export const Shipment = model<IShipment>('Shipment', ShipmentSchema);
