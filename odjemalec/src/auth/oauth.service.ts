// OAuth servis - izdajanje, validacija in upravljanje Bearer tokenov
import crypto from 'node:crypto';
import { OAuthError } from './oauth-error';

interface RegisteredOAuthClient {
  clientId: string;
  clientSecret: string;
  allowedScopes: string[];
  subject: string;
}

interface AccessTokenRecord {
  accessToken: string;
  clientId: string;
  scope: string[];
  subject: string;
  expiresAt: number;
}

interface IssueTokenInput {
  grantType: string;
  clientId?: string;
  clientSecret?: string;
  scope?: string;
}

interface OAuthTokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  scope: string;
}

const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = Number(process.env.OAUTH_ACCESS_TOKEN_TTL ?? 3600);
const DEFAULT_ALLOWED_SCOPES = ['api.read', 'api.write', 'api.sync'];
const REALM = 'StudySprint API';

const buildBearerChallenge = (errorCode: string, description: string): string =>
  `Bearer realm="${REALM}", error="${errorCode}", error_description="${description}"`;

const constantTimeEquals = (left: string, right: string): boolean => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

class OAuthService {
  private readonly registeredClients = new Map<string, RegisteredOAuthClient>();
  private readonly accessTokens = new Map<string, AccessTokenRecord>();
  private readonly accessTokenTtlSeconds = Number.isFinite(DEFAULT_ACCESS_TOKEN_TTL_SECONDS)
    ? Math.max(60, DEFAULT_ACCESS_TOKEN_TTL_SECONDS)
    : 3600;

  constructor() {
    const clientId = process.env.OAUTH_CLIENT_ID ?? 'studysprint-cli';
    const clientSecret = process.env.OAUTH_CLIENT_SECRET ?? 'studysprint-secret';
    const allowedScopes = (process.env.OAUTH_ALLOWED_SCOPES ?? DEFAULT_ALLOWED_SCOPES.join(' '))
      .split(/\s+/)
      .filter(Boolean);
    const subject = process.env.OAUTH_CLIENT_SUBJECT ?? 'service-client';

    this.registeredClients.set(clientId, {
      clientId,
      clientSecret,
      allowedScopes,
      subject
    });
  }

  public getTokenEndpointMetadata(): Pick<RegisteredOAuthClient, 'clientId' | 'allowedScopes'> {
    const [client] = this.registeredClients.values();

    return {
      clientId: client.clientId,
      allowedScopes: client.allowedScopes
    };
  }

  public issueToken(input: IssueTokenInput): OAuthTokenResponse {
    this.clearExpiredTokens();

    if (input.grantType !== 'client_credentials') {
      throw new OAuthError(
        400,
        'unsupported_grant_type',
        'Only the client_credentials grant type is supported.'
      );
    }

    if (!input.clientId || !input.clientSecret) {
      throw new OAuthError(401, 'invalid_client', 'Client authentication failed.');
    }

    const client = this.registeredClients.get(input.clientId);

    if (!client || !constantTimeEquals(client.clientSecret, input.clientSecret)) {
      throw new OAuthError(401, 'invalid_client', 'Client authentication failed.');
    }

    const requestedScopes = this.parseRequestedScopes(input.scope);
    const invalidScopes = requestedScopes.filter((scope) => !client.allowedScopes.includes(scope));

    if (invalidScopes.length > 0) {
      throw new OAuthError(
        400,
        'invalid_scope',
        `Unsupported scope(s): ${invalidScopes.join(', ')}.`
      );
    }

    const grantedScopes = requestedScopes.length > 0 ? requestedScopes : client.allowedScopes;
    const accessToken = crypto.randomBytes(32).toString('base64url');
    const expiresAt = Date.now() + this.accessTokenTtlSeconds * 1000;

    this.accessTokens.set(accessToken, {
      accessToken,
      clientId: client.clientId,
      scope: grantedScopes,
      subject: client.subject,
      expiresAt
    });

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: this.accessTokenTtlSeconds,
      scope: grantedScopes.join(' ')
    };
  }

  public validateAccessToken(accessToken: string): AccessTokenRecord {
    this.clearExpiredTokens();

    const token = this.accessTokens.get(accessToken);
    const description = 'The supplied access token is missing, invalid, or expired.';

    if (!token) {
      throw new OAuthError(401, 'invalid_token', description, buildBearerChallenge('invalid_token', description));
    }

    if (token.expiresAt <= Date.now()) {
      this.accessTokens.delete(accessToken);
      throw new OAuthError(401, 'invalid_token', description, buildBearerChallenge('invalid_token', description));
    }

    return token;
  }

  private parseRequestedScopes(scope?: string): string[] {
    if (!scope) {
      return [];
    }

    return Array.from(new Set(scope.split(/\s+/).filter(Boolean)));
  }

  private clearExpiredTokens(): void {
    const now = Date.now();

    for (const [accessToken, record] of this.accessTokens.entries()) {
      if (record.expiresAt <= now) {
        this.accessTokens.delete(accessToken);
      }
    }
  }
}

export const oauthService = new OAuthService();
export { buildBearerChallenge };
