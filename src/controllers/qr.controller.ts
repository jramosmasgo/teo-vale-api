import { Request, Response, NextFunction } from 'express';
import { QrService } from '../services/qr.service';

const qrService = new QrService();

export class QrController {
  /**
   * GET /qr/:token
   * Endpoint PÚBLICO — no requiere JWT.
   * Devuelve los datos del cliente, sus pedidos y estado de pagos.
   * Usado por el portal del cliente y por el administrador al escanear el QR.
   */
  async getClientByQrToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.params['token'] as string;
      const data = await qrService.getClientByQrToken(token);

      if (!data) {
        return res.status(404).json({ message: 'QR inválido o cliente no encontrado' });
      }

      res.json(data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /qr/client/:id
   * Requiere JWT (solo admins).
   * Devuelve el qrToken del cliente para que el frontend genere el QR.
   */
  async getQrToken(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params['id'] as string;
      const data = await qrService.getQrToken(id);

      if (!data) {
        return res.status(404).json({ message: 'Cliente no encontrado' });
      }

      res.json(data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /qr/client/:id/regenerate
   * Requiere JWT (solo admins).
   * Regenera el qrToken del cliente (invalida el QR anterior).
   */
  async regenerateQrToken(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params['id'] as string;
      const data = await qrService.regenerateQrToken(id);

      if (!data) {
        return res.status(404).json({ message: 'Cliente no encontrado' });
      }

      res.json({
        message: 'QR regenerado exitosamente',
        ...data,
      });
    } catch (error) {
      next(error);
    }
  }
}
