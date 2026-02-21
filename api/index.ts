// Fix: Node.js 18+ prefiere IPv6 por defecto, lo que rompe querySrv de MongoDB Atlas
import { setDefaultResultOrder } from 'dns';
setDefaultResultOrder('ipv4first');

// IMPORTANTE: dotenv debe cargarse ANTES de cualquier otra importación
import dotenv from 'dotenv';
dotenv.config();

import app from '../src/app';
import connectDB from '../src/config/db';

// Connect to Database (will reuse connection across warm invocations)
connectDB();

export default app;
