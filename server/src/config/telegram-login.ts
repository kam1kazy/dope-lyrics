import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const hashesEqual = (left: string, right: string): boolean => {
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
};

export type TelegramLoginPayload = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

export function verifyTelegramLoginUserId({
  payload,
  botToken,
  maxAgeSec,
}: {
  payload: TelegramLoginPayload;
  botToken: string;
  maxAgeSec: number;
}): number | null {
  if (!botToken || !payload.hash) {
    return null;
  }

  if (!Number.isInteger(payload.id) || payload.id <= 0) {
    return null;
  }

  if (!Number.isFinite(payload.auth_date) || payload.auth_date <= 0) {
    return null;
  }

  const ageSec = Date.now() / 1000 - payload.auth_date;
  if (ageSec < 0 || ageSec > maxAgeSec) {
    return null;
  }

  const dataCheckString = Object.entries(payload)
    .filter(
      ([key, value]) => key !== 'hash' && value !== undefined && value !== ''
    )
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([key, value]) => `${key}=${String(value)}`)
    .join('\n');

  const secretKey = createHash('sha256').update(botToken).digest();
  const computedHash = createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (!hashesEqual(computedHash, payload.hash)) {
    return null;
  }

  return payload.id;
}
