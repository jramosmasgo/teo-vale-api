import { Schema, model } from 'mongoose';
import { IUser } from '../interfaces';

const UserSchema = new Schema<IUser>(
  {
    fullName: { 
      type: String, 
      required: true,
      trim: true 
    },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true, 
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    phone: { 
      type: String,
      trim: true 
    },
    profileImageUrl: { 
      type: String 
    },
    address: {
      type: String,
      trim: true
    },
    password: { 
      type: String, 
      required: true,
      minlength: 6 
    },
    role: { 
      type: String, 
      enum: ['ADMIN', 'USER'],
      default: 'USER'
    },
    status: { 
      type: String, 
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE'
    }
  },
  { timestamps: true }
);

export const User = model<IUser>('User', UserSchema);
