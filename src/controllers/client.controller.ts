import { Request, Response, NextFunction } from 'express';
import { ClientService } from '../services/client.service';

const clientService = new ClientService();

export class ClientController {
  async createClient(req: Request, res: Response, next: NextFunction) {
    try {
      const client = await clientService.createClient(req.body);
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
}
