import { Shipment } from "../models/Shipment";
import { Order } from "../models/Order";
import { ShipmentGeneration } from "../models/ShipmentGeneration";
import { IShipment } from "../interfaces";
import { Types } from "mongoose";

export class ShipmentService {
  /**
   * Genera los envíos del día actual basándose en las órdenes activas
   * que tienen programado el día de hoy en su array de orderDays
   */
  async generateTodayShipments(executedBy?: string): Promise<{ 
    created: IShipment[], 
    skipped: number, 
    errors: any[],
    alreadyGenerated?: boolean,
    message?: string 
  }> {
    const today = new Date();
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const todayName = dayNames[today.getDay()];
    
    // Establecer el rango del día actual (00:00:00 - 23:59:59)
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    try {
      // Verificar si ya se generaron shipments hoy
      const existingGeneration = await ShipmentGeneration.findOne({
        executionDate: {
          $gte: startOfDay,
          $lte: endOfDay
        },
        status: { $in: ['SUCCESS', 'PARTIAL'] }
      }).sort({ createdAt: -1 });

      if (existingGeneration) {
        return {
          created: [],
          skipped: 0,
          errors: [],
          alreadyGenerated: true,
          message: `Los envíos ya fueron generados hoy a las ${existingGeneration.createdAt?.toLocaleTimeString('es-ES')}. Se crearon ${existingGeneration.shipmentsCreated} envíos.`
        };
      }

      // Buscar todas las órdenes activas que tienen el día de hoy en orderDays
      const ordersForToday = await Order.find({
        status: true,
        orderDays: todayName
      }).populate('client');

      const created: IShipment[] = [];
      const errors: any[] = [];
      let skipped = 0;

      for (const order of ordersForToday) {
        try {
          // Verificar si ya existe un shipment para esta orden en el día de hoy
          const existingShipment = await Shipment.findOne({
            order: order._id,
            deliveryDate: {
              $gte: startOfDay,
              $lte: endOfDay
            }
          });

          if (existingShipment) {
            skipped++;
            continue;
          }

          // Crear el nuevo shipment
          const shipmentData: Partial<IShipment> = {
            order: order._id,
            client: order.client as Types.ObjectId,
            status: 'DELIVERED',
            amount: order.amount,
            paymentStatus: 'UNPAID',
            deliveryDate: today,
            notes: `Envío generado automáticamente para ${todayName}`
          };

          const newShipment = new Shipment(shipmentData);
          const savedShipment = await newShipment.save();
          created.push(savedShipment);
        } catch (error) {
          errors.push({
            orderId: order._id,
            orderCode: order.orderCode,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Registrar la ejecución en la base de datos
      const generationStatus = errors.length === 0 ? 'SUCCESS' : 
                              created.length > 0 ? 'PARTIAL' : 'FAILED';

      await ShipmentGeneration.create({
        executionDate: today,
        totalOrders: ordersForToday.length,
        shipmentsCreated: created.length,
        shipmentsSkipped: skipped,
        errorCount: errors.length,
        executedBy: executedBy || 'system',
        status: generationStatus,
        errorDetails: errors.length > 0 ? errors : undefined
      });

      return {
        created,
        skipped,
        errors,
        alreadyGenerated: false
      };
    } catch (error) {
      // Registrar la ejecución fallida
      try {
        await ShipmentGeneration.create({
          executionDate: today,
          totalOrders: 0,
          shipmentsCreated: 0,
          shipmentsSkipped: 0,
          errorCount: 1,
          executedBy: executedBy || 'system',
          status: 'FAILED',
          errorDetails: [{
            error: error instanceof Error ? error.message : 'Unknown error'
          }]
        });
      } catch (logError) {
        console.error('Error logging failed generation:', logError);
      }

      throw new Error(`Error generating today's shipments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  async createShipment(shipmentData: IShipment): Promise<IShipment> {
    const shipment = new Shipment(shipmentData);
    return await shipment.save();
  }

  async updateShipment(id: string, shipmentData: Partial<IShipment>): Promise<IShipment | null> {
    const shipment = await Shipment.findByIdAndUpdate(id, shipmentData, { new: true });
    return shipment;
  }

  async getShipmentById(id: string): Promise<IShipment | null> {
    return await Shipment.findById(id)
      .populate('order')
      .populate('client');
  }

  async getAllShipments(page: number, limit: number, filters: any): Promise<{ shipments: IShipment[], total: number }> {
    const skip = (page - 1) * limit;
    const query: any = {};

    if (filters.paymentStatus) {
      query.paymentStatus = filters.paymentStatus;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.deliveryDate) {
      // Parse the date string (YYYY-MM-DD) to avoid timezone issues
      const [year, month, day] = filters.deliveryDate.split('-').map(Number);
      
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

      query.deliveryDate = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    // Creating the base query to handle potential client filtering
    let findQuery = Shipment.find(query)
      .populate('order')
      .populate('client');

    // If clientName is provided, we need to filter after population or use a tricky aggregation
    // For simplicity with Mongoose, sorting/filtering by populated fields often needs aggregation,
    // but here we will try a two-step approach or aggregation if needed.
    // However, if we simply want to filter by client ID it is easier.
    // If filtering by Client NAME, we have to look up clients first.
    
    if (filters.clientName) {
      // This is more complex because we need to find clients matching the name first
      // Logic: Find clients with name regex -> Get IDs -> Filter shipments by those Client IDs
      // Deferred for simplicity relying on client filtering in frontend or exact match if needed.
      // Alternatively, we can use aggregation lookup.
      // Let's implement a basic lookup for now.
    }

    const shipments = await findQuery
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Shipment.countDocuments(query);
    
    return { shipments, total };
  }

  /**
   * Obtiene el historial de ejecuciones de generación de shipments
   */
  async getGenerationHistory(page: number = 1, limit: number = 10, filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<{ generations: any[], total: number }> {
    const skip = (page - 1) * limit;
    const query: any = {};

    if (filters?.startDate || filters?.endDate) {
      query.executionDate = {};
      if (filters.startDate) {
        // Parse the date string (YYYY-MM-DD) to avoid timezone issues
        const [year, month, day] = filters.startDate.split('-').map(Number);
        query.executionDate.$gte = new Date(year, month - 1, day, 0, 0, 0, 0);
      }
      if (filters.endDate) {
        // Parse the date string (YYYY-MM-DD) to avoid timezone issues
        const [year, month, day] = filters.endDate.split('-').map(Number);
        const endDate = new Date(year, month - 1, day, 23, 59, 59, 999);
        query.executionDate.$lte = endDate;
      }
    }

    if (filters?.status) {
      query.status = filters.status;
    }

    const generations = await ShipmentGeneration.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ executionDate: -1 });

    const total = await ShipmentGeneration.countDocuments(query);

    return { generations, total };
  }

  /**
   * Obtiene la última ejecución del día actual
   */
  async getTodayGeneration(): Promise<any | null> {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    return await ShipmentGeneration.findOne({
      executionDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).sort({ createdAt: -1 });
  }

  /**
   * Obtiene los envíos de un cliente específico con filtros opcionales
   * @param clientId - ID del cliente
   * @param page - Número de página
   * @param limit - Cantidad de resultados por página
   * @param filters - Filtros opcionales (startDate, endDate, isPaid)
   */
  async getShipmentsByClient(
    clientId: string,
    page: number = 1,
    limit: number = 15,
    filters?: {
      startDate?: string;
      endDate?: string;
      paymentStatus?: string;
    }
  ): Promise<{ shipments: IShipment[], total: number, totalDebt: number, pendingCount: number }> {
    const skip = (page - 1) * limit;
    const query: any = { client: clientId };

    // Filtro por estado de pago
    if (filters?.paymentStatus) {
      query.paymentStatus = filters.paymentStatus;
    }

    // Filtro por rango de fechas
    if (filters?.startDate || filters?.endDate) {
      query.deliveryDate = {};
      
      if (filters.startDate) {
        // Parse the date string (YYYY-MM-DD) to avoid timezone issues
        const [year, month, day] = filters.startDate.split('-').map(Number);
        query.deliveryDate.$gte = new Date(year, month - 1, day, 0, 0, 0, 0);
      }
      
      if (filters.endDate) {
        // Parse the date string (YYYY-MM-DD) to avoid timezone issues
        const [year, month, day] = filters.endDate.split('-').map(Number);
        query.deliveryDate.$lte = new Date(year, month - 1, day, 23, 59, 59, 999);
      }
    }

    const shipments = await Shipment.find(query)
      .populate('order')
      .populate('client')
      .skip(skip)
      .limit(limit)
      .sort({ deliveryDate: -1 });

    const total = await Shipment.countDocuments(query);

    // Calcular deuda total y conteo de pagos pendientes (sin filtros de fecha, solo por cliente)
    const analytics = await Shipment.aggregate([
      { $match: { client: new Types.ObjectId(clientId), paymentStatus: { $in: ['UNPAID', 'INCOMPLETE'] } } },
      {
        $group: {
          _id: null,
          totalDebt: { $sum: { $subtract: ["$amount", { $ifNull: ["$amountPaid", 0] }] } },
          pendingCount: { $sum: 1 }
        }
      }
    ]);

    const totalDebt = analytics.length > 0 ? analytics[0].totalDebt : 0;
    const pendingCount = analytics.length > 0 ? analytics[0].pendingCount : 0;

    return { 
      shipments, 
      total,
      totalDebt,
      pendingCount
    };
  }
}
