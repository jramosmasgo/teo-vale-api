import { Request, Response, NextFunction } from 'express';
import { ExcelService } from '../services/excel.service';

const excelService = new ExcelService();

export class ExcelController {

  /**
   * GET /api/excel/payments
   * Query params: paymentDate (YYYY-MM-DD), startDate, endDate
   */
  async downloadPaymentsReport(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        paymentDate: req.query.paymentDate as string | undefined,
        startDate:   req.query.startDate   as string | undefined,
        endDate:     req.query.endDate     as string | undefined,
      };

      const buffer = await excelService.generatePaymentsReport(filters);

      const date = filters.paymentDate ?? new Date().toISOString().split('T')[0];
      const filename = `reporte-pagos-${date}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/excel/deliveries
   * Query params: deliveryDate (YYYY-MM-DD), startDate, endDate, paymentStatus, status
   */
  async downloadDeliveriesReport(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        deliveryDate:  req.query.deliveryDate  as string | undefined,
        startDate:     req.query.startDate     as string | undefined,
        endDate:       req.query.endDate       as string | undefined,
        paymentStatus: req.query.paymentStatus as string | undefined,
        status:        req.query.status        as string | undefined,
      };

      const buffer = await excelService.generateDeliveriesReport(filters);

      const date = filters.deliveryDate ?? new Date().toISOString().split('T')[0];
      const filename = `reporte-entregas-${date}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
}
