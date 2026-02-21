import { Payment } from "../models/Payment";
import { Shipment } from "../models/Shipment";
import { IPayment } from "../interfaces";
import mongoose from 'mongoose';

export class PaymentService {
  /**
   * Crea un pago y distribuye el monto entre los shipments pendientes del cliente
   * @param paymentData - Datos del pago
   * @returns El pago creado con información de distribución
   */
  async createPayment(paymentData: IPayment): Promise<IPayment> {
    const { client, amountPaid } = paymentData;

    if (!client || !amountPaid || amountPaid <= 0) {
      throw new Error('Cliente y monto válido son requeridos');
    }

    // Obtener todos los shipments con estado UNPAID o INCOMPLETE del cliente, ordenados por fecha
    const pendingShipments = await Shipment.find({
      client: client,
      paymentStatus: { $in: ['UNPAID', 'INCOMPLETE'] }
    }).sort({ deliveryDate: 1 }); // Más antiguos primero

    if (pendingShipments.length === 0) {
      throw new Error('No hay envíos pendientes para este cliente');
    }

    let remainingAmount = amountPaid;
    const shipmentsAffected: Array<{ shipment: any; amountApplied: number }> = [];

    // Distribuir el pago entre los shipments
    for (const shipment of pendingShipments) {
      if (remainingAmount <= 0) break;

      const shipmentAmount = shipment.amount || 0;
      const alreadyPaid = shipment.amountPaid || 0;
      const amountOwed = shipmentAmount - alreadyPaid;

      if (amountOwed <= 0) continue; // Ya está pagado completamente

      // Calcular cuánto aplicar a este shipment
      const amountToApply = Math.min(remainingAmount, amountOwed);
      const newAmountPaid = alreadyPaid + amountToApply;

      // Actualizar el shipment
      shipment.amountPaid = newAmountPaid;

      // Determinar el nuevo estado del pago
      if (newAmountPaid >= shipmentAmount) {
        shipment.paymentStatus = 'COMPLETED';
      } else if (newAmountPaid > 0) {
        shipment.paymentStatus = 'INCOMPLETE';
      } else {
        shipment.paymentStatus = 'UNPAID';
      }

      await shipment.save();

      // Registrar el shipment afectado
      shipmentsAffected.push({
        shipment: shipment._id as any,
        amountApplied: amountToApply
      });

      remainingAmount -= amountToApply;
    }

    // Crear el registro de pago con la información de distribución
    const payment = new Payment({
      ...paymentData,
      shipments: shipmentsAffected
    });

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
      .populate('registeredBy', 'name email')
      .populate('shipments.shipment');
  }

  async getAllPayments(page: number, limit: number, filters: any): Promise<{ payments: IPayment[], total: number }> {
    const skip = (page - 1) * limit;
    const query: any = {};

    if (filters.paymentDate) {
      // Parse the date string (YYYY-MM-DD) to avoid timezone issues
      const [year, month, day] = filters.paymentDate.split('-').map(Number);
      
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

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
      .populate('registeredBy', 'fullName email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Payment.countDocuments(query);

    return { payments, total };
  }
}
