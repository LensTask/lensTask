// wagmi.ts ────────────────────────────────────────────────────────────────
import { createConfig, http } from 'wagmi';
import { injected, walletConnect, metaMask } from '@wagmi/connectors';
import { sepolia, localhost } from 'wagmi/chains';

/* ---------------------------------------------------------------------- */
/* 1 ▸ Lens chain definitions                                             */
/* ---------------------------------------------------------------------- */

export const lensSepolia = {
  id: 37111,
  name: 'Lens Chain Sepolia',
  nativeCurrency: { name: 'GRASS', symbol: 'GRASS', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_LENS_TESTNET_RPC_URL ?? 'https://rpc.testnet.lens.dev'] },
  },
  blockExplorers: {
    default: { name: 'LensScan Testnet', url: 'https://explorer.testnet.lens.dev' },
  },
  testnet: true,
} as const;

export const lensMainnet = {
  id: 232,
  name: 'Lens Chain Mainnet',
  nativeCurrency: { name: 'GHO', symbol: 'GHO', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.lens.xyz'] },
  },
  blockExplorers: {
    default: { name: 'LensScan', url: 'https://explorer.lens.xyz' },
  },
  testnet: false,
} as const;

/* ---------------------------------------------------------------------- */
/* 2 ▸ Single source-of-truth chain array                                 */
/* ---------------------------------------------------------------------- */

const CHAINS = [lensSepolia, lensMainnet, sepolia, localhost];

/* ---------------------------------------------------------------------- */
/* 3 ▸ Wagmi config – every connector gets the SAME chain list            */
/* ---------------------------------------------------------------------- */

export const wagmiConfig = createConfig({
  chains: CHAINS,

  transports: Object.fromEntries(
    CHAINS.map(c => [c.id, http(c.rpcUrls.default.http[0] ?? undefined)]),
  ),

  connectors: [
    injected({ chains: CHAINS, shimDisconnect: true }),      // MetaMask / Coinbase extension
    metaMask({ chains: CHAINS }),                            // explicit MetaMask connector
    ...(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
      ? [walletConnect({
          projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
          chains: CHAINS,
          showQrModal: false,                                // ConnectKit handles the modal
        })]
      : []),
  ],

  ssr: true,                                                 // safe for Next.js SSR
});
