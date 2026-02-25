import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import { logErrorMiddleware } from './middlewares/error.middleware';

const app = express();

// CORS — debe ir ANTES de cualquier otra ruta o middleware
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200 // Para navegadores legacy (IE11) que usan 204 como error
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Responder a todas las peticiones preflight OPTIONS

app.use(helmet({
  crossOriginResourcePolicy: false,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Health check
app.get('/', (_req: any, res: any) => {
  res.json({ message: 'Welcome to Teo Vale Backend API' });
});

// Error handling middleware (must be after routes)
app.use(logErrorMiddleware);

export default app;
