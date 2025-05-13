// src/lib/lensEnvironment.ts
import { type EnvironmentConfig } from '@lens-protocol/client';

// Manual Config for Lens Chain Mainnet (Production - ID 232)
const LENS_MAINNET_RPC_URL_ENV = process.env.NEXT_PUBLIC_LENS_CHAIN_MAINNET_RPC_URL || 'https://rpc.lens.xyz';
export const lensAppMainnetEnvironment: EnvironmentConfig = { // Renamed for clarity
  name: 'lens-chain-mainnet-gho-app', // Specific name
  // IMPORTANT: This backend URL MUST be the correct V3 GraphQL endpoint for Lens Chain Mainnet (ID 232)
  // The guide suggested 'https://api-v3.lens.xyz'. This is critical.
  backend: 'https://api-v3.lens.xyz',
  chains: {
    lens: { // Primary Lens chain
      chainId: 232,
      name: 'Lens Chain Mainnet',
      rpcUrl: LENS_MAINNET_RPC_URL_ENV,
      blockExplorer: 'https://explorer.lens.xyz',
      nativeCurrency: { name: 'GHO', symbol: 'GHO', decimals: 18 },
    },
    // Optional: auxiliary Ethereum mainnet if your app or SDK needs to reference it
    // ethereum: {
    //   chainId: 1,
    //   name: 'Ethereum Mainnet',
    //   rpcUrl: process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_INFURA_ID',
    //   blockExplorer: 'https://etherscan.io',
    //   nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    // },
  },
  timings: { // Standard timings
    pollingInterval: 3000,
    maxIndexingWaitTime: 120000,
    maxMiningWaitTime: 60000,
  },
  contracts: { // These are placeholders; use actual Lens Chain Mainnet contract addresses if your app needs them
    permissionlessCreator: '0x0000000000000000000000000000000000000000',
  },
};
