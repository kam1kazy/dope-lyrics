/** @type {import('next').NextConfig} */

const NextConfig = {
  // reactStrictMode: true,
  // output: 'export',
  compiler: {
    styledComponents: true,
  },
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/prisma/:path*',
  //       destination: 'http://localhost:4000/prisma/:path*',
  //     },
  //   ]
  // },
}

export default NextConfig
