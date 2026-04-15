import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import axios, {
  AxiosHeaders,
  AxiosInstance,
  AxiosRequestConfig,
  RawAxiosRequestHeaders
} from 'axios';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

interface StoredToken {
  accessToken: string;
  tokenType: string;
  scope: string;
  expiresAt: string;
}

type RetryableConfig = AxiosRequestConfig & { _oauthRetry?: boolean };

const TOKEN_FILE = path.resolve(process.cwd(), '.auth', 'test-client-token.json');
const EXPIRY_SKEW_MS = 30_000;
const CLIENT_ID = process.env.OAUTH_CLIENT_ID ?? 'studysprint-cli';
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET ?? 'studysprint-secret';
const REQUESTED_SCOPE = process.env.OAUTH_SCOPE ?? 'api.read api.write api.sync';

const toPlainHeaders = (headers?: AxiosRequestConfig['headers']): RawAxiosRequestHeaders => {
  if (!headers) {
    return {};
  }

  if (headers instanceof AxiosHeaders) {
    return headers.toJSON() as RawAxiosRequestHeaders;
  }

  const maybeSerializable = headers as { toJSON?: () => object };

  if (typeof maybeSerializable.toJSON === 'function') {
    return maybeSerializable.toJSON() as RawAxiosRequestHeaders;
  }

  return { ...(headers as RawAxiosRequestHeaders) };
};

const withAuthorizationHeader = (
  headers: AxiosRequestConfig['headers'],
  authorization: string
): typeof AxiosHeaders.prototype =>
  AxiosHeaders.from({
    ...toPlainHeaders(headers),
    Authorization: authorization
  });

const isUsableToken = (token: StoredToken): boolean => {
  const expiresAt = Date.parse(token.expiresAt);

  if (!Number.isFinite(expiresAt)) {
    return false;
  }

  return expiresAt - EXPIRY_SKEW_MS > Date.now();
};

const readStoredToken = async (): Promise<StoredToken | null> => {
  try {
    const raw = await readFile(TOKEN_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<StoredToken>;

    if (
      typeof parsed.accessToken !== 'string' ||
      typeof parsed.tokenType !== 'string' ||
      typeof parsed.expiresAt !== 'string'
    ) {
      return null;
    }

    return {
      accessToken: parsed.accessToken,
      tokenType: parsed.tokenType,
      scope: typeof parsed.scope === 'string' ? parsed.scope : '',
      expiresAt: parsed.expiresAt
    };
  } catch {
    return null;
  }
};

const writeStoredToken = async (token: StoredToken): Promise<void> => {
  await mkdir(path.dirname(TOKEN_FILE), { recursive: true });
  await writeFile(TOKEN_FILE, `${JSON.stringify(token, null, 2)}\n`, 'utf-8');
};

const fetchAccessToken = async (api: AxiosInstance): Promise<StoredToken> => {
  if (!api.defaults.baseURL) {
    throw new Error('API baseURL must be configured before OAuth can be used.');
  }

  const tokenUrl = new URL('/oauth/token', api.defaults.baseURL).toString();
  const requestBody = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: REQUESTED_SCOPE
  });
  const basicCredentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

  const response = await axios.post<TokenResponse>(tokenUrl, requestBody.toString(), {
    timeout: 10_000,
    headers: {
      Authorization: `Basic ${basicCredentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  const expiresAt = new Date(Date.now() + response.data.expires_in * 1000).toISOString();

  return {
    accessToken: response.data.access_token,
    tokenType: response.data.token_type || 'Bearer',
    scope: response.data.scope ?? REQUESTED_SCOPE,
    expiresAt
  };
};

export const installOAuth = async (api: AxiosInstance): Promise<void> => {
  let cachedToken = await readStoredToken();

  const resolveToken = async (forceRefresh = false): Promise<StoredToken> => {
    if (!forceRefresh && cachedToken && isUsableToken(cachedToken)) {
      return cachedToken;
    }

    cachedToken = await fetchAccessToken(api);
    await writeStoredToken(cachedToken);
    return cachedToken;
  };

  api.interceptors.request.use(async (config) => {
    const token = await resolveToken();
    config.headers = withAuthorizationHeader(
      config.headers,
      `${token.tokenType} ${token.accessToken}`
    );
    return config;
  });

  api.interceptors.response.use(undefined, async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      throw error;
    }

    const requestConfig = error.config as RetryableConfig | undefined;
    const responseData = error.response?.data as { error?: string } | undefined;

    if (
      error.response?.status !== 401 ||
      responseData?.error !== 'invalid_token' ||
      !requestConfig ||
      requestConfig._oauthRetry
    ) {
      throw error;
    }

    requestConfig._oauthRetry = true;

    const refreshedToken = await resolveToken(true);
    requestConfig.headers = withAuthorizationHeader(
      requestConfig.headers,
      `${refreshedToken.tokenType} ${refreshedToken.accessToken}`
    );

    return api.request(requestConfig);
  });

  const token = await resolveToken();
  console.log(`\n[auth] OAuth token ready until ${token.expiresAt}`);
};
