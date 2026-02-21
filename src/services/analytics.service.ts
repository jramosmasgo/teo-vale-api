import { Order } from "../models/Order";
import { Payment } from "../models/Payment";
import { Shipment } from "../models/Shipment";
import { IOrder, IShipment } from "../interfaces";

export class AnalyticsService {
  /**
   * Enumerar los pedidos que tiene el día de hoy
   */
  async getTodayOrders(): Promise<IOrder[]> {
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const todayName = dayNames[new Date().getDay()];
    
    return await Order.find({ 
      status: true, 
      orderDays: todayName 
    }).populate('client');
  }

  /**
   * El total de pagos que se recibió hoy
   */
  async getTodayPaymentsTotal(): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const result = await Payment.aggregate([
      {
        $match: {
          paymentDate: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amountPaid" }
        }
      }
    ]);

    return result.length > 0 ? result[0].total : 0;
  }

  /**
   * Total de clientes que tienen deuda
   */
  async getClientsWithDebtCount(): Promise<number> {
    const clientsWithDebt = await Shipment.distinct('client', {
      paymentStatus: { $in: ['UNPAID', 'INCOMPLETE'] }
    });
    
    return clientsWithDebt.length;
  }

  /**
   * Pedidos que fueron actualizados esta semana
   */
  async getOrdersUpdatedThisWeek(): Promise<IOrder[]> {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    return await Order.find({
      updatedAt: { $gte: lastWeek }
    }).populate('client');
  }

  /**
   * Los pedidos que fueron cancelados esta semana
   */
  async getShipmentsCancelledThisWeek(): Promise<IShipment[]> {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    return await Shipment.find({
      status: 'CANCELLED',
      deliveryDate: { $gte: lastWeek }
    }).populate('order').populate('client');
  }

  /**
   * La suma total de pagos incompletos o unpaid
   */
  async getTotalUnpaidAmount(): Promise<number> {
    const result = await Shipment.aggregate([
  {
    $match: {
      paymentStatus: { $ne: "COMPLETED" }
    }
  },
  {
    $group: {
      _id: null,
      totalPending: {
        $sum: {
          $subtract: [
            "$amount",
            { $ifNull: ["$amountPaid", 0] }
          ]
        }
      }
    }
  }
]);

const totalPending = result[0]?.totalPending ?? 0;

return totalPending
  }
}
