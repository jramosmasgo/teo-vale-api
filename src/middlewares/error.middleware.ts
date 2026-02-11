import { Request, Response, NextFunction } from 'express';
import { ErrorLog } from '../models/ErrorLog';

// Extend Request to include potential user data from Auth middleware
interface RequestWithUser extends Request {
  user?: any;
}

export const logErrorMiddleware = async (err: any, req: RequestWithUser, res: Response, next: NextFunction) => {
  console.error('Error caught by middleware:', err);

  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  try {
    // Attempt to log the error to database
    await ErrorLog.create({
        message,
        stack: err.stack,
        route: req.originalUrl,
        method: req.method,
        user: req.user ? (typeof req.user === 'string' ? req.user : req.user?.id || JSON.stringify(req.user)) : 'Guest',
        statusCode: status,
        metadata: {
            body: req.body,
            query: req.query,
            params: req.params,
            errorMessage: err.toString()
        }
    });
  } catch (logError) {
    console.error('Failed to log error to database:', logError);
  }

  res.status(status).json({
    message,
    status,
    // Only return stack in development usually, but keeping it simple for now or checking env
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
