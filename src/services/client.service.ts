import { Client } from "../models/Client";
import { IClient } from "../interfaces";
import { CloudinaryService } from './cloudinary.service';

const cloudinaryService = new CloudinaryService();

export class ClientService {
  async createClient(clientData: IClient): Promise<IClient> {
    const client = new Client(clientData);
    return await client.save();
  }

  async updateClient(id: string, clientData: Partial<IClient>): Promise<IClient | null> {
    const client = await Client.findByIdAndUpdate(id, clientData, { new: true });
    return client;
  }

  async getClients(): Promise<IClient[]> {
    return await Client.find({ active: true });
  }

  async searchClients(query: string): Promise<IClient[]> {
    return await Client.find({
      active: true,
      $or: [
        { fullName: { $regex: query, $options: "i" } },
        { alias: { $regex: query, $options: "i" } },
      ],
    });
  }

  async getClientById(id: string): Promise<IClient | null> {
    return await Client.findOne({ _id: id, active: true });
  }

  async uploadProfileImage(clientId: string, fileBuffer: Buffer): Promise<IClient | null> {
    try {
      // Subir imagen a Cloudinary
      const imageUrl = await cloudinaryService.uploadClientProfileImage(fileBuffer, clientId);
      
      // Actualizar el cliente con la nueva URL de imagen
      const client = await Client.findByIdAndUpdate(
        clientId,
        { imageUrl },
        { new: true }
      );
      
      return client;
    } catch (error) {
      console.error('Error uploading client profile image:', error);
      throw error;
    }
  }

  async deleteProfileImage(clientId: string): Promise<IClient | null> {
    try {
      // Eliminar imagen de Cloudinary
      await cloudinaryService.deleteClientProfileImage(clientId);
      
      // Actualizar el cliente removiendo la URL de imagen
      const client = await Client.findByIdAndUpdate(
        clientId,
        { $unset: { imageUrl: 1 } },
        { new: true }
      );
      
      return client;
    } catch (error) {
      console.error('Error deleting client profile image:', error);
      throw error;
    }
  }
}
