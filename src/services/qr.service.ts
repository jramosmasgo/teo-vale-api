import { randomUUID } from 'crypto';
import { Client } from '../models/Client';
import { Payment } from '../models/Payment';
import { Order } from '../models/Order';
import { Shipment } from '../models/Shipment';

export class QrService {
  /**
   * Obtiene la información completa de un cliente usando su qrToken.
   * Este endpoint es público (sin autenticación) para que funcione al escanear el QR.
   */
  async getClientByQrToken(token: string) {
    const client = await Client.findOne({ qrToken: token, active: true }).lean();

    if (!client) {
      return null;
    }

    // Obtener todos los pedidos del cliente (sin importar el estado)
    const orders = await Order.find({ client: client._id }).lean();

    // Obtener pagos del cliente (más recientes primero)
    const payments = await Payment.find({ client: client._id })
      .sort({ paymentDate: -1 })
      .populate('registeredBy', 'fullName')
      .lean();

    // Obtener todos los envíos/despachos del cliente directamente
    const shipments = await Shipment.find({ client: client._id })
      .sort({ deliveryDate: -1 })
      .lean();

    // Calcular totales
    const totalPaid = payments.reduce((sum, p) => sum + (p.amountPaid ?? 0), 0);
    // totalOrdered = suma de lo despachado (shipments), que es la deuda real del cliente
    const totalOrdered = shipments.reduce((sum, s) => sum + (s.amount ?? 0), 0);
    // balance = lo despachado - lo pagado
    const balance = totalOrdered - totalPaid;

    return {
      client: {
        _id: client._id,
        fullName: client.fullName,
        alias: client.alias,
        imageUrl: client.imageUrl,
        address: client.address,
        reference: client.reference,
        phone: client.phone,
      },
      summary: {
        totalPaid,
        totalOrdered,
        balance,
        paymentsCount: payments.length,
        activeOrdersCount: orders.filter(o => o.status === true).length,
        ordersCount: orders.length,
      },
      orders,
      payments,
      recentShipments: shipments.slice(0, 10),
    };
  }

  /**
   * Regenera el qrToken de un cliente. Útil si el QR fue comprometido.
   * Solo accesible por administradores.
   */
  async regenerateQrToken(clientId: string) {
    const newToken = randomUUID();
    const client = await Client.findByIdAndUpdate(
      clientId,
      { qrToken: newToken },
      { new: true }
    ).lean();

    if (!client) {
      return null;
    }

    return {
      clientId: client._id,
      qrToken: client.qrToken,
    };
  }

  /**
   * Obtiene únicamente el qrToken de un cliente (para generar el QR en el frontend).
   * Solo accesible por administradores.
   */
  async getQrToken(clientId: string) {
    const client = await Client.findById(clientId).select('qrToken fullName alias').lean();
    return client;
  }
}
