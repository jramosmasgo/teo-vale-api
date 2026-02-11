import { Document } from 'mongoose';

export interface IUser extends Document {
  fullName?: string;
  email?: string;
  phone?: string;
  profileImageUrl?: string;
  password?: string;
  role?: string;
  status?: string;
  address?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
