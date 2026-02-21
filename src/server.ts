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
