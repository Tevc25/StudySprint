import { NextFunction, Request, Response } from 'express';
import { OAuthError } from '../auth/oauth-error';
import { buildBearerChallenge, oauthService } from '../auth/oauth.service';

const INVALID_TOKEN_DESCRIPTION = 'The supplied access token is missing, invalid, or expired.';

export const requireOAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authorizationHeader = req.header('authorization');

    if (!authorizationHeader) {
      throw new OAuthError(
        401,
        'invalid_token',
        INVALID_TOKEN_DESCRIPTION,
        buildBearerChallenge('invalid_token', INVALID_TOKEN_DESCRIPTION)
      );
    }

    const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
    const accessToken = match?.[1]?.trim();

    if (!accessToken) {
      throw new OAuthError(
        401,
        'invalid_token',
        INVALID_TOKEN_DESCRIPTION,
        buildBearerChallenge('invalid_token', INVALID_TOKEN_DESCRIPTION)
      );
    }

    res.locals.oauth = oauthService.validateAccessToken(accessToken);
    next();
  } catch (error) {
    next(error);
  }
};
