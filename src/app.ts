import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import { logErrorMiddleware } from './middlewares/error.middleware';

const app = express();

// Middlewares
app.use(cors({
  origin: ['http://localhost:5173', 'https://teo-vale-admin.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
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
