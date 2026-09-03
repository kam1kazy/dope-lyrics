/** @type {import('next').NextConfig} */

const apiOrigin = process.env.BASE_URL || 'http://localhost:4000';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const NextConfig = {
  ...(basePath ? { basePath } : {}),
  turbopack: {
    root: import.meta.dirname,
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

export default NextConfig;
