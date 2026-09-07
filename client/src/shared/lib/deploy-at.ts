const QUERY_PARAM = '_d';
const RELOAD_GUARD_KEY = 'dope-lyrics:deploy-reload';

export const clientDeployAt = process.env.NEXT_PUBLIC_DEPLOY_AT?.trim() ?? '';

function deployEndpointUrl(): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  return `${basePath}/api/deploy`;
}

function isDeployPayload(value: unknown): value is { deployAt: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'deployAt' in value &&
    typeof value.deployAt === 'string'
  );
}

function alreadyReloadedFor(deployAt: string): boolean {
  const url = new URL(window.location.href);
  if (url.searchParams.get(QUERY_PARAM) === deployAt) {
    return true;
  }

  try {
    return sessionStorage.getItem(RELOAD_GUARD_KEY) === deployAt;
  } catch {
    return false;
  }
}

function rememberReload(deployAt: string): void {
  try {
    sessionStorage.setItem(RELOAD_GUARD_KEY, deployAt);
  } catch {
    // private mode
  }
}

function replaceWithDeployParam(deployAt: string): void {
  const url = new URL(window.location.href);
  url.searchParams.set(QUERY_PARAM, deployAt);
  window.location.replace(url.toString());
}

export async function reloadIfStaleDeploy(): Promise<boolean> {
  if (process.env.NODE_ENV !== 'production' || !clientDeployAt) {
    return false;
  }

  let serverDeployAt: string;

  try {
    const response = await fetch(deployEndpointUrl(), {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      return false;
    }

    const payload: unknown = await response.json();
    if (!isDeployPayload(payload) || payload.deployAt.trim() === '') {
      return false;
    }

    serverDeployAt = payload.deployAt.trim();
  } catch {
    return false;
  }

  if (serverDeployAt === clientDeployAt) {
    return false;
  }

  if (alreadyReloadedFor(serverDeployAt)) {
    return false;
  }

  rememberReload(serverDeployAt);
  replaceWithDeployParam(serverDeployAt);
  return true;
}
