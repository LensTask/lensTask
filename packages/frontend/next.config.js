/** @type {import('next').NextConfig} */
module.exports = {
  async rewrites() {
    return process.env.NODE_ENV === 'development'
      ? [
          {
            source: '/api/lens/graphql',
            destination: 'https://api-v2.lens.dev/graphql',
          },
        ]
      : [];
  },
};
