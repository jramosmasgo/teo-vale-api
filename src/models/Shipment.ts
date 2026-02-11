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
    isPaid: {
      type: Boolean,
      default: false
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
