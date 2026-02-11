import { Schema, model } from 'mongoose';
import { IOrder } from '../interfaces';

const OrderSchema = new Schema<IOrder>(
  {
    orderCode: { 
      type: String, 
      unique: true, 
      required: true 
    },
    client: { 
      type: Schema.Types.ObjectId, 
      ref: 'Client',
      required: true // Assuming an order must have a client
    },
    orderDays: [{ 
      type: String,
      enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
    }],
    schedule: { 
      type: String 
    },
    amount: { 
      type: Number,
      required: true,
      min: 0 
    },
    description: { 
      type: String 
    },
    status: { 
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export const Order = model<IOrder>('Order', OrderSchema);
