import { Document } from 'mongoose';

export interface IClient extends Document {
  fullName?: string;
  alias?: string;
  imageUrl?: string;
  address?: string;
  reference?: string;
  phone?: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
