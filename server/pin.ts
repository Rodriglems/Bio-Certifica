import crypto from 'node:crypto';

const KEY_LENGTH = 64;

export function hashPin(pin: string) {
  const cleaned = pin.replace(/\D/g, '').slice(0, 8);
  if (cleaned.length < 4) throw new Error('PIN inválido');

  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(cleaned, salt, KEY_LENGTH);

  return `${salt.toString('base64')}:${derived.toString('base64')}`;
}

export function verifyPin(pin: string, stored: string) {
  const cleaned = pin.replace(/\D/g, '').slice(0, 8);
  if (cleaned.length < 4) return false;

  const [saltB64, hashB64] = stored.split(':');
  if (!saltB64 || !hashB64) return false;

  const salt = Buffer.from(saltB64, 'base64');
  const expected = Buffer.from(hashB64, 'base64');
  const derived = crypto.scryptSync(cleaned, salt, expected.length);

  return crypto.timingSafeEqual(derived, expected);
}
