import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import { NotificationService } from '../services/notification.service';

const orderService = new OrderService();
const notificationService = new NotificationService();

export class OrderController {
  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.createOrder(req.body);
      
      // Notificación: nuevo pedido creado
      const userId = (req as any).user?.id;
      if (userId) {
        notificationService.createNotification({
          createdBy: userId,
          type: 'ORDER_CREATED',
          title: 'Nuevo pedido creado',
          content: `Se creó un nuevo pedido (${(order as any).orderCode || order._id}).`,
        }).catch(console.error);
      }

      res.status(201).json(order);
    } catch (error: any) {
      next(error);
    }
  }

  async updateOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await orderService.updateOrder(id as string, req.body);
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Notificación: pedido modificado/cancelado
      const userId = (req as any).user?.id;
      if (userId) {
        const isCancelled = req.body.status === false || req.body.status === 'CANCELLED';
        notificationService.createNotification({
          createdBy: userId,
          type: isCancelled ? 'ORDER_CANCELLED' : 'ORDER_UPDATED',
          title: isCancelled ? 'Pedido cancelado' : 'Pedido modificado',
          content: `El pedido (${(order as any).orderCode || id}) fue ${isCancelled ? 'cancelado' : 'modificado'}.`,
        }).catch(console.error);
      }

      res.json(order);
    } catch (error: any) {
      next(error);
    }
  }

  async getOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await orderService.getOrderById(id as string);

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      res.json(order);
    } catch (error: any) {
      next(error);
    }
  }

  async getOrdersByClient(req: Request, res: Response, next: NextFunction) {
    try {
      const { clientId } = req.params;
      const orders = await orderService.getOrdersByClient(clientId as string);
      res.json(orders);
    } catch (error: any) {
      next(error);
    }
  }

  async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 15;
      
      const filters = {
        date: req.query.date as string,
        status: req.query.status as string,
        schedule: req.query.schedule as string,
        days: req.query.days ? (req.query.days as string).split(',') : undefined,
        clientName: req.query.clientName as string
      };

      const result = await orderService.getAllOrders(page, limit, filters);
      res.json(result);
    } catch (error: any) {
      next(error);
    }
  }
}

