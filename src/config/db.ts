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
      // Opciones recomendadas para MongoDB Atlas + entornos serverless
      serverSelectionTimeoutMS: 10000,   // 10 segundos para seleccionar servidor
      socketTimeoutMS: 45000,            // 45 segundos timeout de socket
      connectTimeoutMS: 10000,           // 10 segundos timeout de conexión
      maxPoolSize: 10,                   // Máximo de conexiones simultáneas
      minPoolSize: 1,
      retryWrites: true,
    });

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
