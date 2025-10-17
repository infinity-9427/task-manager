import { sign, verify, SignOptions } from 'jsonwebtoken';
import { JWTPayload } from '@/src/shared/types/interfaces';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const generateToken = (payload: JWTPayload): string => {
  return sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): JWTPayload => {
  return verify(token, JWT_SECRET) as JWTPayload;
};