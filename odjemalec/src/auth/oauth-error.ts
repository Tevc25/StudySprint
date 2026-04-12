// OAuth napake - standardizirani formati za HTTP odgovore
import { Response } from 'express';

export type OAuthErrorCode =
  | 'invalid_client'
  | 'invalid_grant'
  | 'invalid_request'
  | 'invalid_scope'
  | 'invalid_token'
  | 'unsupported_grant_type';

export class OAuthError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly errorCode: OAuthErrorCode,
    public readonly description: string,
    public readonly wwwAuthenticate?: string
  ) {
    super(description);
  }
}

export const sendOAuthError = (res: Response, error: OAuthError): void => {
  if (error.wwwAuthenticate) {
    res.setHeader('WWW-Authenticate', error.wwwAuthenticate);
  }

  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');

  res.status(error.statusCode).json({
    error: error.errorCode,
    error_description: error.description
  });
};
