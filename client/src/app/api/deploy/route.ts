import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function readDeployAt(): string {
  const fromEnv = process.env.NEXT_PUBLIC_DEPLOY_AT?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  try {
    return readFileSync(join(process.cwd(), '.deploy-at'), 'utf8').trim();
  } catch {
    return '';
  }
}

export function GET() {
  return Response.json(
    { deployAt: readDeployAt() },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
