import { Schema, model } from 'mongoose';
import { IClient } from '../interfaces';

const ClientSchema = new Schema<IClient>(
  {
    fullName: { 
      type: String, 
      required: true,
      trim: true 
    },
    alias: { 
      type: String,
      trim: true 
    },
    imageUrl: { 
      type: String 
    },
    address: { 
      type: String,
      required: true 
    },
    reference: { 
      type: String 
    },
    phone: { 
      type: String,
      required: true,
      trim: true 
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export const Client = model<IClient>('Client', ClientSchema);
