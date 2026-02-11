import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';

const paymentService = new PaymentService();

export class PaymentController {
  async createPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await paymentService.createPayment(req.body);
      res.status(201).json(payment);
    } catch (error: any) {
      next(error);
    }
  }

  async updatePayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const payment = await paymentService.updatePayment(id as string, req.body);
      
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      res.json(payment);
    } catch (error: any) {
      next(error);
    }
  }

  async deletePayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const payment = await paymentService.deletePayment(id as string);

      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      res.status(200).json({ message: 'Payment deleted successfully' });
    } catch (error: any) {
      next(error);
    }
  }

  async getPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const payment = await paymentService.getPaymentById(id as string);

      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      res.json(payment);
    } catch (error: any) {
      next(error);
    }
  }

  async getPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 15;
      
      const filters = {
        paymentDate: req.query.paymentDate as string,
        clientId: req.query.clientId as string,
        registeredBy: req.query.registeredBy as string,
        clientName: req.query.clientName as string
      };

      const result = await paymentService.getAllPayments(page, limit, filters);
      res.json(result);
    } catch (error: any) {
      next(error);
    }
  }
}
