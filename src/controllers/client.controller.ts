import { Request, Response, NextFunction } from 'express';
import { ClientService } from '../services/client.service';
import { NotificationService } from '../services/notification.service';

const clientService = new ClientService();
const notificationService = new NotificationService();

export class ClientController {
  async createClient(req: Request, res: Response, next: NextFunction) {
    try {
      const client = await clientService.createClient(req.body);

      // Notificación: nuevo cliente registrado
      const userId = (req as any).user?.id;
      if (userId) {
        notificationService.createNotification({
          createdBy: userId,
          type: 'CLIENT_CREATED',
          title: 'Nuevo cliente registrado',
          content: `Se registró el cliente "${(client as any).fullName || client._id}".`,
        }).catch(console.error);
      }

      res.status(201).json(client);
    } catch (error: any) {
      next(error);
    }
  }

  async updateClient(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const client = await clientService.updateClient(id as string, req.body);
      
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }

      res.json(client);
    } catch (error: any) {
      next(error);
    }
  }

  async getClients(req: Request, res: Response, next: NextFunction) {
    try {
      const { search } = req.query;
      let clients;

      if (search) {
        clients = await clientService.searchClients(search as string);
      } else {
        clients = await clientService.getClients();
      }

      res.json(clients);
    } catch (error: any) {
      next(error);
    }
  }

  async getClient(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const client = await clientService.getClientById(id as string);

      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }

      res.json(client);
    } catch (error: any) {
      next(error);
    }
  }

  async uploadProfileImage(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      if (!req.file) {
        return res.status(400).json({ message: 'No se proporcionó ninguna imagen' });
      }

      const client = await clientService.uploadProfileImage(id as string, req.file.buffer);
      
      if (!client) {
        return res.status(404).json({ message: 'Cliente no encontrado' });
      }

      res.json({ message: 'Imagen de perfil actualizada exitosamente', client });
    } catch (error: any) {
      next(error);
    }
  }

  async deleteProfileImage(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const client = await clientService.deleteProfileImage(id as string);
      
      if (!client) {
        return res.status(404).json({ message: 'Cliente no encontrado' });
      }

      res.json({ message: 'Imagen de perfil eliminada exitosamente', client });
    } catch (error: any) {
      next(error);
    }
  }
}
