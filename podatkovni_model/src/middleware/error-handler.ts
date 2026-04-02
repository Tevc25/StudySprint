import { NextFunction, Request, Response } from 'express';
import { OAuthError, sendOAuthError } from '../auth/oauth-error';
import { HttpError } from '../utils/http-error';
import { sendError } from '../utils/response';

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof OAuthError) {
    sendOAuthError(res, err);
    return;
  }

  if (err instanceof HttpError) {
    sendError(res, err.statusCode, err.message, err.details);
    return;
  }

  console.error('Unhandled error:', err);
  sendError(res, 500, 'Internal server error.');
};
