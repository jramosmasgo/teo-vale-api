// Fix: Node.js 18+ prefiere IPv6 por defecto, lo que rompe querySrv de MongoDB Atlas en Windows
import { setDefaultResultOrder } from 'dns';
setDefaultResultOrder('ipv4first');

// IMPORTANTE: dotenv debe cargarse ANTES de cualquier otra importación
import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import connectDB from './config/db';

// Connect to Database
connectDB();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
