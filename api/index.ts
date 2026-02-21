// IMPORTANTE: dotenv debe cargarse ANTES de cualquier otra importación
import dotenv from 'dotenv';
dotenv.config();

import app from '../src/app';
import connectDB from '../src/config/db';

// Connect to Database (will reuse connection across warm invocations)
connectDB();

export default app;
