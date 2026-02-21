import { Schema, model } from 'mongoose';
import { IPayment } from '../interfaces';

const PaymentSchema = new Schema<IPayment>(
  {
    client: { 
      type: Schema.Types.ObjectId, 
      ref: 'Client',
      required: true 
    },
    amountPaid: { 
      type: Number,
      required: true,
      min: 0 
    },
    paymentDate: { 
      type: Date,
      default: Date.now
    },
    paymentTime: { 
      type: String 
    },
    paymentCode: { 
      type: String, 
      unique: true,
      required: true 
    },
    registeredBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      required: true 
    },
    shipments: [{
      shipment: {
        type: Schema.Types.ObjectId,
        ref: 'Shipment'
      },
      amountApplied: {
        type: Number,
        required: true
      }
    }]
  },
  { timestamps: true }
);

export const Payment = model<IPayment>('Payment', PaymentSchema);
