/**
 * Type that extends the Express Request object to include a user property.
 * This is used by the authentication middleware to attach the user information to the request.
 */
export type RequestWithUser = any & {
  user?: any;
};
