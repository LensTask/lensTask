import { createConfig, http, createStorage, cookieStorage } from 'wagmi';
import { injected, metaMask, walletConnect } from '@wagmi/connectors';
import { mainnet as ethereumMainnet, sepolia as wagmiSepolia, localhost } from 'wagmi/chains';

// --- Lens Chain Definition for Mainnet (ID 232) ---
const LENS_CHAIN_MAINNET_RPC_URL = process.env.NEXT_PUBLIC_LENS_CHAIN_MAINNET_RPC_URL || 'https://rpc.lens.xyz';
export const lensMainnetGHOChain = {
  id: 232,
  name: 'Lens Chain Mainnet',
  nativeCurrency: { name: 'GHO', symbol: 'GHO', decimals: 18 },
  rpcUrls: {
    default: { http: [LENS_CHAIN_MAINNET_RPC_URL] },
    public: { http: [LENS_CHAIN_MAINNET_RPC_URL] },
  },
  blockExplorers: {
    default: { name: 'LensScan Mainnet', url: 'https://explorer.lens.xyz' },
  },
  testnet: false, // This is a mainnet
} as const;

// --- Auxiliary Chains (Optional but good for wallet compatibility) ---
const SEPOLIA_ETHEREUM_RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org';
export const appSepoliaChain = { // Ethereum Sepolia Testnet
  ...wagmiSepolia,
  id: 11155111,
  rpcUrls: {
    default: { http: [SEPOLIA_ETHEREUM_RPC_URL] },
    public: { http: [SEPOLIA_ETHEREUM_RPC_URL] },
  },
} as const;

// --- Wagmi Configuration ---
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

// ALWAYS use Lens Chain Mainnet (232) as the primary target
export const CHAINS_CONFIG = [lensMainnetGHOChain, ethereumMainnet, appSepoliaChain, localhost];

console.log(`[wagmiConfig] TARGETING LENS CHAIN MAINNET (ID 232)`);
console.log(`[wagmiConfig] Active Lens Chain FOR WAGMI: ID=${lensMainnetGHOChain.id}, Name='${lensMainnetGHOChain.name}'`);
console.log('[wagmiConfig] All configured chains in wagmi:', CHAINS_CONFIG.map(c => ({id: c.id, name: c.name})));

export const wagmiConfig = createConfig({
  chains: CHAINS_CONFIG,
  transports: Object.fromEntries(
    CHAINS_CONFIG.map(chain => {
      const rpcUrl = chain.rpcUrls.default?.http[0];
      if (!rpcUrl && chain.id !== localhost.id) {
        console.warn(`[wagmiConfig] No default HTTP RPC URL for chain ID ${chain.id} (${chain.name}). Using default http().`);
        return [chain.id, http()];
      }
      return [chain.id, http(rpcUrl)];
    })
  ),
  connectors: [
    injected({ chains: CHAINS_CONFIG, shimDisconnect: true }),
    metaMask({ chains: CHAINS_CONFIG, dAppMetadata: { name: "My Lens App" } }),
    ...(projectId
      ? [walletConnect({
          projectId: projectId,
          chains: CHAINS_CONFIG,
          showQrModal: false,
          metadata: { name: 'My Lens App', description: 'Lens App', url: typeof window !== 'undefined' ? window.location.origin : 'https://example.com', icons: ['/logo.png'] }
        })]
      : []),
  ],
  storage: typeof window !== 'undefined'
    ? createStorage({ storage: window.localStorage, key: 'wagmi.store.lensintel.mainnet.v1' }) // New key for mainnet focus
    : createStorage({ storage: cookieStorage, key: 'wagmi.ssr.lensintel.mainnet.v1', server: true }),
  ssr: true,
});
