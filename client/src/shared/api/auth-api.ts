const apiBasePath = (): string => process.env.NEXT_PUBLIC_BASE_PATH || '';

const EXPLICIT_LOGOUT_KEY = 'dl_logged_out';
export const AUTH_SIGNED_OUT_EVENT = 'dl-auth-signed-out';

export const hasExplicitLogout = (): boolean => {
  try {
    return sessionStorage.getItem(EXPLICIT_LOGOUT_KEY) === '1';
  } catch {
    return false;
  }
};

export const markExplicitLogout = (): void => {
  try {
    sessionStorage.setItem(EXPLICIT_LOGOUT_KEY, '1');
  } catch {
    // private mode / blocked storage
  }
};

export const clearExplicitLogout = (): void => {
  try {
    sessionStorage.removeItem(EXPLICIT_LOGOUT_KEY);
  } catch {
    // ignore
  }
};

export const authUrl = (path: string): string => {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${apiBasePath()}/auth${normalized}`;
};

export type AuthUser = {
  id: number;
  username: string;
  role: 'OWNER' | 'ADMIN' | 'USER';
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

type AuthErrorBody = {
  error?: string;
};

const readErrorMessage = async (
  response: Response,
  fallback: string
): Promise<string> => {
  try {
    const body: unknown = await response.json();
    if (
      body &&
      typeof body === 'object' &&
      'error' in body &&
      typeof (body as AuthErrorBody).error === 'string' &&
      (body as AuthErrorBody).error
    ) {
      return (body as AuthErrorBody).error as string;
    }
  } catch {
    // ignore non-JSON
  }

  return fallback;
};

const readAuthUser = async (response: Response): Promise<AuthUser | null> => {
  try {
    const body: unknown = await response.json();
    if (
      !body ||
      typeof body !== 'object' ||
      !('user' in body) ||
      !body.user ||
      typeof body.user !== 'object'
    ) {
      return null;
    }

    const user = body.user as AuthUser;
    if (typeof user.id !== 'number' || typeof user.username !== 'string') {
      return null;
    }

    return user;
  } catch {
    return null;
  }
};

const REFRESH_LOCK_NAME = 'dl-auth-refresh';

const postRefresh = async (): Promise<AuthUser | null> => {
  const response = await fetch(authUrl('/refresh'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  });

  if (!response.ok) {
    return null;
  }

  return readAuthUser(response);
};

// Ротация отзывает старый токен: две вкладки без замка выбили бы друг друга
export async function refreshSession(): Promise<AuthUser | null> {
  if (typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request(REFRESH_LOCK_NAME, postRefresh);
  }

  return postRefresh();
}

export async function loginWithTelegramWebApp(
  initData: string
): Promise<{ ok: true; user: AuthUser } | { ok: false; error: string }> {
  const response = await fetch(authUrl('/telegram-webapp'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ initData }),
  });

  if (!response.ok) {
    return {
      ok: false,
      error: await readErrorMessage(response, 'Не удалось войти'),
    };
  }

  const user = await readAuthUser(response);
  if (!user) {
    return { ok: false, error: 'Не удалось войти' };
  }

  return { ok: true, user };
}

export async function loginWithTelegramWidget(
  payload: TelegramLoginPayload
): Promise<{ ok: true; user: AuthUser } | { ok: false; error: string }> {
  const response = await fetch(authUrl('/telegram-login'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return {
      ok: false,
      error: await readErrorMessage(response, 'Не удалось войти'),
    };
  }

  const user = await readAuthUser(response);
  if (!user) {
    return { ok: false, error: 'Не удалось войти' };
  }

  return { ok: true, user };
}

export async function logoutSession(): Promise<void> {
  markExplicitLogout();

  try {
    await fetch(authUrl('/logout'), {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
  } catch {
    // show login anyway
  }
}
