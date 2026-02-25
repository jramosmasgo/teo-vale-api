import { Router } from 'express';
import { QrController } from '../controllers/qr.controller';
import { checkJwt } from '../middlewares/auth.middleware';

const router = Router();
const qrController = new QrController();

/**
 * RUTAS PROTEGIDAS (requieren JWT de admin)
 * IMPORTANTE: deben ir ANTES del wildcard /:token para evitar conflictos de rutas en Express.
 */

// Obtener el qrToken de un cliente para generar el QR en el frontend
router.get('/client/:id', checkJwt, qrController.getQrToken);

// Regenerar el qrToken de un cliente (invalida el QR anterior)
router.post('/client/:id/regenerate', checkJwt, qrController.regenerateQrToken);

/**
 * RUTAS PÚBLICAS (sin JWT)
 * El cliente escanea el QR y accede a su información directamente.
 * El administrador también puede escanear y será redirigido al panel admin.
 * IMPORTANTE: /:token debe ir AL FINAL porque es un wildcard que captura todo.
 */

// Escanear QR: retorna datos del cliente + pagos + pedidos
router.get('/:token', qrController.getClientByQrToken);

export default router;
