import { createConfig, http } from 'wagmi';
// For LensProvider V3, the primary chain is Lens Chain Sepolia (37111).
// WagmiProvider should at least include this chain.
// Other chains like localhost can be kept for local contract testing if separate.
import { sepolia, localhost } from 'wagmi/chains'; // Using sepolia as an example general chain

// Define Lens Chain Sepolia for Wagmi
const lensChainSepolia = {
  id: 37111,
  name: 'Lens Chain Sepolia',
  nativeCurrency: { name: 'GRASS', symbol: 'GRASS', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_LENS_TESTNET_RPC_URL || 'https://rpc.testnet.lens.dev'] },
    public: { http: [process.env.NEXT_PUBLIC_LENS_TESTNET_RPC_URL || 'https://rpc.testnet.lens.dev'] },
  },
  blockExplorers: {
    default: { name: 'LensScan', url: 'https://explorer.testnet.lens.dev' },
  },
  testnet: true,
};

export const wagmiConfig = createConfig({
  // chains should ideally include the chain LensProvider's environment targets
  chains: [lensChainSepolia, localhost],
  transports: {
    [lensChainSepolia.id]: http(lensChainSepolia.rpcUrls.default.http[0]),
    [localhost.id]: http(), // For local hardhat node
  },
  // ssr: true, // Optional, often handled by providers
});
