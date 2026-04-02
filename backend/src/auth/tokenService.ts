import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET ?? 'studysprint-secret-key';
export const EXPIRES_IN_SECONDS = 3600; // 1 ura

export interface TokenPayload {
  sub: string;   // user id
  email: string;
  role: string;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN_SECONDS });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, SECRET) as TokenPayload;
};
