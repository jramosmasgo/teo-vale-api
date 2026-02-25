import { Request, Response, NextFunction } from 'express';
import { ShipmentService } from '../services/shipment.service';
import { NotificationService } from '../services/notification.service';
import { User } from '../models/User';
import { Shipment } from '../models/Shipment';

const shipmentService = new ShipmentService();
const notificationService = new NotificationService();

/** Devuelve el primer nombre de un fullName o un fallback */
const firstName = (fullName?: string, fallback = 'Usuario') =>
  fullName?.split(' ')[0] || fallback;

export class ShipmentController {
  async createShipment(req: Request, res: Response, next: NextFunction) {
    try {
      const shipment = await shipmentService.createShipment(req.body);
      res.status(201).json(shipment);
    } catch (error: any) {
      next(error);
    }
  }

  async updateShipment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const shipment = await shipmentService.updateShipment(id as string, req.body);

      if (!shipment) {
        return res.status(404).json({ message: 'Shipment not found' });
      }

      // Notificación: entrega cancelada o modificada (se corre en background)
      const userId = (req as any).user?.id;
      if (userId) {
        const isCancelled = req.body.status === 'CANCELLED';
        (async () => {
          try {
            const [user, populated] = await Promise.all([
              User.findById(userId).select('fullName').lean(),
              Shipment.findById(id).populate<{ client: { fullName?: string } }>('client', 'fullName').lean(),
            ]);
            const uName = firstName((user as any)?.fullName);
            const cName = firstName((populated?.client as any)?.fullName, 'cliente');
            await notificationService.createNotification({
              createdBy: userId,
              type: isCancelled ? 'SHIPMENT_CANCELLED' : 'SHIPMENT_UPDATED',
              title: isCancelled ? 'Entrega cancelada' : 'Entrega modificada',
              content: isCancelled
                ? `El usuario ${uName} canceló la entrega del cliente ${cName}.`
                : `El usuario ${uName} modificó la entrega del cliente ${cName}.`,
              action: { entityId: String(id), entityType: 'delivery' },
            });
          } catch (e) { console.error(e); }
        })();
      }

      res.json(shipment);
    } catch (error: any) {
      next(error);
    }
  }

  async getShipment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const shipment = await shipmentService.getShipmentById(id as string);

      if (!shipment) {
        return res.status(404).json({ message: 'Shipment not found' });
      }

      res.json(shipment);
    } catch (error: any) {
      next(error);
    }
  }

  async getShipments(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 15;
      
      const filters = {
        paymentStatus: req.query.paymentStatus as string,
        status: req.query.status as string,
        deliveryDate: req.query.deliveryDate as string,
        clientName: req.query.clientName as string
      };

      const result = await shipmentService.getAllShipments(page, limit, filters);
      res.json(result);
    } catch (error: any) {
      next(error);
    }
  }

  async generateTodayShipments(req: Request, res: Response, next: NextFunction) {
    try {
      const executedBy = (req as any).user?.email || 'unknown';
      const result = await shipmentService.generateTodayShipments(executedBy);
      
      if (result.alreadyGenerated) {
        return res.status(200).json({
          success: false,
          alreadyGenerated: true,
          message: result.message,
          data: result
        });
      }

      res.status(200).json({
        success: true,
        message: 'Shipments generation completed successfully',
        created: result.created.length,
        skipped: result.skipped,
        errors: result.errors.length,
        data: result
      });
    } catch (error: any) {
      next(error);
    }
  }

  async generateShipmentForOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const executedBy = (req as any).user?.email || 'unknown';

      const result = await shipmentService.generateShipmentForOrder(orderId, executedBy);

      if (result.alreadyExists) {
        return res.status(200).json({
          success: false,
          alreadyExists: true,
          message: result.message,
          shipment: result.shipment
        });
      }

      res.status(201).json({
        success: true,
        message: result.message,
        shipment: result.shipment
      });
    } catch (error: any) {
      if (error.message === 'Pedido no encontrado') {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  }

  async getGenerationHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        status: req.query.status as string
      };

      const result = await shipmentService.getGenerationHistory(page, limit, filters);
      res.json(result);
    } catch (error: any) {
      next(error);
    }
  }

  async getTodayGeneration(req: Request, res: Response, next: NextFunction) {
    try {
      const generation = await shipmentService.getTodayGeneration();
      
      if (!generation) {
        return res.status(404).json({ 
          message: 'No generation found for today',
          hasGeneration: false
        });
      }

      res.json({
        hasGeneration: true,
        generation
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getShipmentsByClient(req: Request, res: Response, next: NextFunction) {
    try {
      const { clientId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 15;
      
      // Helper function to safely extract string from query params
      const getStringParam = (param: any): string | undefined => {
        if (typeof param === 'string') return param;
        if (Array.isArray(param) && param.length > 0) return param[0];
        return undefined;
      };

      const filters: {
        startDate?: string;
        endDate?: string;
        isPaid?: string;
      } = {
        startDate: getStringParam(req.query.startDate),
        endDate: getStringParam(req.query.endDate),
        isPaid: getStringParam(req.query.isPaid)
      };

      const result = await shipmentService.getShipmentsByClient(
        clientId as string,
        page,
        limit,
        filters
      );
      
      res.json(result);
    } catch (error: any) {
      next(error);
    }
  }
}
