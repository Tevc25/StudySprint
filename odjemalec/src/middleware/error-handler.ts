// Error handler - centralizirano obravnavanje vseh napak in OAuth fehov
import { NextFunction, Request, Response } from 'express';
import { OAuthError, sendOAuthError } from '../auth/oauth-error';

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (error instanceof OAuthError) {
    sendOAuthError(res, error);
    return;
  }

  console.error('Unhandled error:', error);

  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
};
