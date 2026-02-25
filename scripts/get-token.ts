
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Client } from '../src/models/Client';

dotenv.config();

async function getToken() {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    const client = await Client.findOne({ qrToken: { $exists: true, $ne: null } });
    if (client) {
      console.log('Valid Token:', client.qrToken);
      console.log('Client Name:', client.fullName);
    } else {
      console.log('No client with token found');
    }
    await mongoose.disconnect();
  } catch (error) {
    console.error(error);
  }
}

getToken();
