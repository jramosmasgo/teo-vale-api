import mongoose from 'mongoose';

// En entornos serverless (Vercel), la conexión se cachea entre llamadas
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('MongoDB: reutilizando conexión existente');
    return;
  }

  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    throw new Error('La variable de entorno MONGO_URI no está definida');
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 1,
      retryWrites: true,
    } as any);

    isConnected = true;
    console.log(`MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    isConnected = false;
    console.error('Error al conectar a MongoDB:', error);

    // En producción serverless no hacemos process.exit, lanzamos el error
    if (process.env.NODE_ENV === 'production') {
      throw error;
    } else {
      process.exit(1);
    }
  }
};

export default connectDB;
