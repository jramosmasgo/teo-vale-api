import { Client } from "../models/Client";
import { IClient } from "../interfaces";

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
}
