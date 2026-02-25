import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import { NotificationService } from '../services/notification.service';
import { User } from '../models/User';
import { Order } from '../models/Order';

const orderService = new OrderService();
const notificationService = new NotificationService();

/** Devuelve el primer nombre de un fullName o un fallback */
const firstName = (fullName?: string, fallback = 'Usuario') =>
  fullName?.split(' ')[0] || fallback;

export class OrderController {
  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.createOrder(req.body);

      // Notificación: nuevo pedido creado (se corre en background)
      const userId = (req as any).user?.id;
      if (userId) {
        (async () => {
          try {
            const [user, populated] = await Promise.all([
              User.findById(userId).select('fullName').lean(),
              Order.findById(order._id).populate<{ client: { fullName?: string } }>('client', 'fullName').lean(),
            ]);
            const uName = firstName((user as any)?.fullName);
            const cName = firstName((populated?.client as any)?.fullName, 'cliente');
            await notificationService.createNotification({
              createdBy: userId,
              type: 'ORDER_CREATED',
              title: 'Nuevo pedido creado',
              content: `El usuario ${uName} creó un nuevo pedido del cliente ${cName}.`,
              action: { entityId: String(order._id), entityType: 'order' },
            });
          } catch (e) { console.error(e); }
        })();
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

      // Notificación: pedido modificado/cancelado (se corre en background)
      const userId = (req as any).user?.id;
      if (userId) {
        const isCancelled = req.body.status === false || req.body.status === 'CANCELLED';
        (async () => {
          try {
            const [user, populated] = await Promise.all([
              User.findById(userId).select('fullName').lean(),
              Order.findById(id).populate<{ client: { fullName?: string } }>('client', 'fullName').lean(),
            ]);
            const uName = firstName((user as any)?.fullName);
            const cName = firstName((populated?.client as any)?.fullName, 'cliente');
            await notificationService.createNotification({
              createdBy: userId,
              type: isCancelled ? 'ORDER_CANCELLED' : 'ORDER_UPDATED',
              title: isCancelled ? 'Pedido cancelado' : 'Pedido modificado',
              content: isCancelled
                ? `El usuario ${uName} canceló un pedido del cliente ${cName}.`
                : `El usuario ${uName} modificó un pedido del cliente ${cName}.`,
              action: { entityId: String(id), entityType: 'order' },
            });
          } catch (e) { console.error(e); }
        })();
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

