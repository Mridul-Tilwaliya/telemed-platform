import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { config } from '../config/env';

export interface MFASecret {
  secret: string;
  qrCodeUrl: string;
}

export function generateMFASecret(email: string): MFASecret {
  const secret = speakeasy.generateSecret({
    name: `${config.mfa.issuer} (${email})`,
    issuer: config.mfa.issuer,
    length: 32,
  });

  return {
    secret: secret.base32 || '',
    qrCodeUrl: secret.otpauth_url || '',
  };
}

export async function generateQRCode(otpauthUrl: string): Promise<string> {
  try {
    return await QRCode.toDataURL(otpauthUrl);
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
}

export function verifyMFAToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps (60 seconds) before/after
  });
}

