// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Add the problematic package and its dependencies if necessary
  transpilePackages: ['@lens-protocol/wagmi', 'wagmi'], // Add wagmi too as it's part of the issue
  // You might need to add other @lens-protocol packages if they cause similar issues
};

module.exports = nextConfig;