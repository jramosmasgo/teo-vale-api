import { Schema, model, Document } from 'mongoose';

export interface IShipmentGeneration extends Document {
  executionDate: Date;
  totalOrders: number;
  shipmentsCreated: number;
  shipmentsSkipped: number;
  errorCount: number;
  executedBy?: string;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  errorDetails?: any[];
  createdAt?: Date;
  updatedAt?: Date;
}

const ShipmentGenerationSchema = new Schema<IShipmentGeneration>(
  {
    executionDate: {
      type: Date,
      required: true,
      index: true
    },
    totalOrders: {
      type: Number,
      required: true,
      default: 0
    },
    shipmentsCreated: {
      type: Number,
      required: true,
      default: 0
    },
    shipmentsSkipped: {
      type: Number,
      required: true,
      default: 0
    },
    errorCount: {
      type: Number,
      required: true,
      default: 0
    },
    executedBy: {
      type: String
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'PARTIAL', 'FAILED'],
      required: true
    },
    errorDetails: [{
      type: Schema.Types.Mixed
    }]
  },
  { timestamps: true }
);

// Índice compuesto para búsquedas rápidas por fecha
ShipmentGenerationSchema.index({ executionDate: 1, status: 1 });

export const ShipmentGeneration = model<IShipmentGeneration>('ShipmentGeneration', ShipmentGenerationSchema);
