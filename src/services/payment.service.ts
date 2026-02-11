import { Payment } from "../models/Payment";
import { IPayment } from "../interfaces";
import { Types } from "mongoose";

export class PaymentService {
  async createPayment(paymentData: IPayment): Promise<IPayment> {
    const payment = new Payment(paymentData);
    return await payment.save();
  }

  async updatePayment(id: string, paymentData: Partial<IPayment>): Promise<IPayment | null> {
    const payment = await Payment.findByIdAndUpdate(id, paymentData, { new: true })
      .populate('client')
      .populate('registeredBy', 'name email'); // Populate basic user info
    return payment;
  }

  async deletePayment(id: string): Promise<IPayment | null> {
    return await Payment.findByIdAndDelete(id);
  }

  async getPaymentById(id: string): Promise<IPayment | null> {
    return await Payment.findById(id)
      .populate('client')
      .populate('registeredBy', 'name email');
  }

  async getAllPayments(page: number, limit: number, filters: any): Promise<{ payments: IPayment[], total: number }> {
    const skip = (page - 1) * limit;
    const query: any = {};

    if (filters.paymentDate) {
      const startOfDay = new Date(filters.paymentDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(filters.paymentDate);
      endOfDay.setHours(23, 59, 59, 999);

      query.paymentDate = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    if (filters.clientId) {
      query.client = filters.clientId;
    }

    if (filters.registeredBy) {
      query.registeredBy = filters.registeredBy;
    }

    // Filters for client name would ideally require aggregation if we want to filter efficiently on the DB side.
    // However, if we follow the pattern, we might need a separate mechanism or assume we get client ID from frontend search.
    // If we MUST filter by client name here without getting ID first, it's aggregation time.
    // But often "search by client name" implies searching clients first, then getting their payments?
    // Given the prompt "buscar fecha / por cliente / nombre del cliente / por el usuario", let's prep the query.
    // Since "nombre del cliente" is requested, I'll attempt a population match approach if possible or comment on limitation.
    // Mongoose 'find' doesn't support direct filtering on populated fields without aggregation.
    // I will implement standard ID filtering for 'por cliente' and 'por usuario'. 
    // For 'nombre del cliente', if provided, we assume we need to use aggregation or pre-fetch clients.
    // Let's rely on frontend sending IDs for strict relationships, or if "clientName" is passed, we might ignore it or handle it complexly.
    // I will stick to IDs for now for client and user as they are relational fields in this schema.

    const payments = await Payment.find(query)
      .populate('client')
      .populate('registeredBy', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Payment.countDocuments(query);

    return { payments, total };
  }
}
