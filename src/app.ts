import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan'; // I forgot to install morgan, but it's fine I won't use it yet or I'll add a simple logger
import routes from './routes';

const app: Application = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());

import { logErrorMiddleware } from './middlewares/error.middleware';

// Routes
app.use('/api', routes);

// Health check
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to Teo Vale Backend API' });
});

// Error handling middleware (must be after routes)
app.use(logErrorMiddleware);

export default app;
