// OAuth kontroler - endpoint za izdajanje access tokenov (POST /oauth/token)
import { Request, Response } from 'express';
import { oauthService } from '../auth/oauth.service';

const parseBasicAuthorization = (
  authorizationHeader?: string
): { clientId?: string; clientSecret?: string } => {
  if (!authorizationHeader?.startsWith('Basic ')) {
    return {};
  }

  const encodedCredentials = authorizationHeader.slice('Basic '.length).trim();

  if (!encodedCredentials) {
    return {};
  }

  const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString('utf-8');
  const separatorIndex = decodedCredentials.indexOf(':');

  if (separatorIndex < 0) {
    return {};
  }

  return {
    clientId: decodedCredentials.slice(0, separatorIndex),
    clientSecret: decodedCredentials.slice(separatorIndex + 1)
  };
};

export const issueAccessToken = (req: Request, res: Response): void => {
  const basicCredentials = parseBasicAuthorization(req.header('authorization'));
  const token = oauthService.issueToken({
    grantType: String(req.body?.grant_type ?? ''),
    clientId: basicCredentials.clientId ?? req.body?.client_id,
    clientSecret: basicCredentials.clientSecret ?? req.body?.client_secret,
    scope: typeof req.body?.scope === 'string' ? req.body.scope : undefined
  });

  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  res.status(200).json(token);
};
