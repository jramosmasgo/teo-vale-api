import { Request, Response, NextFunction } from 'express';
import { ShipmentService } from '../services/shipment.service';

const shipmentService = new ShipmentService();

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
        isPaid: req.query.isPaid as string,
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
      // Obtener el usuario del token JWT (si está disponible en req.user)
      const executedBy = (req as any).user?.email || 'unknown';
      
      const result = await shipmentService.generateTodayShipments(executedBy);
      
      // Si ya se generaron hoy, retornar código 200 con mensaje informativo
      if (result.alreadyGenerated) {
        return res.status(200).json({
          success: false,
          alreadyGenerated: true,
          message: result.message,
          data: result
        });
      }

      // Generación exitosa
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
}
