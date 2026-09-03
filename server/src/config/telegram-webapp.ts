import { createHmac, timingSafeEqual } from 'node:crypto';

const WEB_APP_DATA_KEY = 'WebAppData';

const hashesEqual = (left: string, right: string): boolean => {
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
};

const readUserId = (rawUser: string): number | null => {
  try {
    const parsed: unknown = JSON.parse(rawUser);
    if (!parsed || typeof parsed !== 'object' || !('id' in parsed)) {
      return null;
    }

    const id = parsed.id;
    if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
      return null;
    }

    return id;
  } catch {
    return null;
  }
};

export function verifyTelegramWebAppUserId({
  initData,
  botToken,
  maxAgeSec,
}: {
  initData: string;
  botToken: string;
  maxAgeSec: number;
}): number | null {
  if (!initData || !botToken) {
    return null;
  }

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) {
    return null;
  }

  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = createHmac('sha256', WEB_APP_DATA_KEY)
    .update(botToken)
    .digest();
  const computedHash = createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (!hashesEqual(computedHash, hash)) {
    return null;
  }

  const authDateRaw = params.get('auth_date');
  const authDate = authDateRaw ? Number.parseInt(authDateRaw, 10) : Number.NaN;
  if (!Number.isFinite(authDate) || authDate <= 0) {
    return null;
  }

  const ageSec = Date.now() / 1000 - authDate;
  if (ageSec < 0 || ageSec > maxAgeSec) {
    return null;
  }

  const userRaw = params.get('user');
  if (!userRaw) {
    return null;
  }

  return readUserId(userRaw);
}
