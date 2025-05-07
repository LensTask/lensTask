/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/lens/:path*', // Route within your Next.js app
        destination: 'https://api-v2.lens.dev/:path*', // Target actual Lens API V2
      },
    ];
  },
};
