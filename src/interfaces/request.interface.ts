import { Request } from 'express';

/**
 * Interface that extends the Express Request object to include a user property.
 * This is used by the authentication middleware to attach the user information to the request.
 */
export interface RequestWithUser extends Request {
  user?: any;
}
