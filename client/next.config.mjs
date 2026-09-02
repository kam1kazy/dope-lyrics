/** @type {import('next').NextConfig} */

const apiOrigin = process.env.BASE_URL || 'http://localhost:4000'

const NextConfig = {
  compiler: {
    styledComponents: true,
  },
  async rewrites() {
    return [
      {
        source: '/graphql',
        destination: `${apiOrigin}/graphql`,
      },
    ]
  },
}

export default NextConfig

