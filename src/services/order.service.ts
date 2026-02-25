import { Order } from "../models/Order";
import { IOrder } from "../interfaces";
import { Types } from "mongoose";

export class OrderService {
  /** Calcula amount como la suma de los precios de los items */
  private calcAmount(orderData: Partial<IOrder>): number {
    if (!orderData.items || orderData.items.length === 0) return 0;
    return orderData.items.reduce((sum, item) => sum + (item.price ?? 0), 0);
  }

  async createOrder(orderData: IOrder): Promise<IOrder> {
    orderData.amount = this.calcAmount(orderData);
    const order = new Order(orderData);
    return await order.save();
  }

  async updateOrder(id: string, orderData: Partial<IOrder>): Promise<IOrder | null> {
    // Si vienen items en el update, recalcular amount
    if (orderData.items !== undefined) {
      orderData.amount = this.calcAmount(orderData);
    }
    const order = await Order.findByIdAndUpdate(id, orderData, { new: true });
    return order;
  }

  async getOrderById(id: string): Promise<IOrder | null> {
    return await Order.findById(id).populate('client');
  }

  async getOrdersByClient(clientId: string): Promise<IOrder[]> {
    return await Order.find({ client: clientId }).populate('client');
  }

  async getAllOrders(page: number, limit: number, filters: any): Promise<{ orders: IOrder[], total: number }> {
    const skip = (page - 1) * limit;
    const query: any = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.schedule) {
      query.schedule = filters.schedule;
    }

    // Filter by orderDays (if any day in the filter matches any day in the order)
    if (filters.days && filters.days.length > 0) {
      query.orderDays = { $in: filters.days };
    }

    // Filter by client name (search in populated client)
    if (filters.clientName) {
      const Client = require('../models/Client').Client;
      const clients = await Client.find({
        fullName: { $regex: filters.clientName, $options: 'i' }
      }).select('_id');
      
      const clientIds = clients.map((c: any) => c._id);
      if (clientIds.length > 0) {
        query.client = { $in: clientIds };
      } else {
        // If no clients match, return empty result
        return { orders: [], total: 0 };
      }
    }

    const orders = await Order.find(query)
      .populate('client')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(query);

    return { orders, total };
  }
}
