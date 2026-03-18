import { Response } from 'express';

export const sendSuccess = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T
): void => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  errors?: string[]
): void => {
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {})
  });
};
