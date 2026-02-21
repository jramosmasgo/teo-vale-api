import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  /**
   * GET /analytics/orders/today
   * Enumerar los pedidos que tiene el día de hoy
   */
  async getTodayOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const orders = await analyticsService.getTodayOrders();
      res.json(orders);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /analytics/payments/today-total
   * El total de pagos que se recibió hoy
   */
  async getTodayPaymentsTotal(req: Request, res: Response, next: NextFunction) {
    try {
      const total = await analyticsService.getTodayPaymentsTotal();
      res.json({ total });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /analytics/clients/with-debt
   * Total de clientes que tienen deuda
   */
  async getClientsWithDebtCount(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await analyticsService.getClientsWithDebtCount();
      res.json({ count });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /analytics/orders/updated-this-week
   * Pedidos que fueron actualizados esta semana
   */
  async getOrdersUpdatedThisWeek(req: Request, res: Response, next: NextFunction) {
    try {
      const orders = await analyticsService.getOrdersUpdatedThisWeek();
      res.json(orders);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /analytics/shipments/cancelled-this-week
   * Los pedidos que fueron cancelados esta semana
   */
  async getShipmentsCancelledThisWeek(req: Request, res: Response, next: NextFunction) {
    try {
      const shipments = await analyticsService.getShipmentsCancelledThisWeek();
      res.json(shipments);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /analytics/shipments/total-unpaid
   * La suma total de pagos incompletos o unpaid
   */
  async getTotalUnpaidAmount(req: Request, res: Response, next: NextFunction) {
    try {
      const total = await analyticsService.getTotalUnpaidAmount();
      res.json({ total });
    } catch (error: any) {
      next(error);
    }
  }
}
