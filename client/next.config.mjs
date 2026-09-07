import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PRODUCTION_BUILD = 'phase-production-build';

const configDir = dirname(fileURLToPath(import.meta.url));
const deployAtFile = join(configDir, '.deploy-at');

const apiOrigin = process.env.BASE_URL || 'http://localhost:4000';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

function readDeployAtFile() {
  try {
    return readFileSync(deployAtFile, 'utf8').trim();
  } catch {
    return '';
  }
}

/** @type {import('next').NextConfig} */
const NextConfig = {
  ...(basePath ? { basePath } : {}),
  turbopack: {
    root: import.meta.dirname,
  },
  async headers() {
    return [
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/api/deploy',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/graphql',
        destination: `${apiOrigin}/graphql`,
      },
    ];
  },
};

/**
 * @param {string} phase
 * @returns {import('next').NextConfig}
 */
export default function nextConfig(phase) {
  let deployAt = process.env.NEXT_PUBLIC_DEPLOY_AT?.trim() || '';

  if (phase === PRODUCTION_BUILD) {
    if (!deployAt) {
      deployAt = new Date().toISOString();
    }

    process.env.NEXT_PUBLIC_DEPLOY_AT = deployAt;
    writeFileSync(deployAtFile, deployAt);
  } else if (!deployAt) {
    deployAt = readDeployAtFile();
    if (deployAt) {
      process.env.NEXT_PUBLIC_DEPLOY_AT = deployAt;
    }
  }

  return {
    ...NextConfig,
    env: {
      NEXT_PUBLIC_DEPLOY_AT: deployAt,
    },
  };
}
