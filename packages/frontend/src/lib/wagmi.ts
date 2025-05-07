import { createConfig, http } from 'wagmi';
import { mainnet, polygon, localhost } from 'wagmi/chains';
import { injected } from 'wagmi/connectors'; // Using a basic connector for now

// Get RPC URL and Chain ID from environment variables, with defaults
const defaultRpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.ankr.com/polygon";
const defaultChainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "137");

let targetChainConfig;

if (defaultChainId === 31337 || defaultRpcUrl.includes("127.0.0.1") || defaultRpcUrl.includes("localhost")) {
  targetChainConfig = {
    chain: localhost,
    rpcUrl: defaultRpcUrl,
    transportInput: http(defaultRpcUrl),
  };
} else if (defaultChainId === 137) {
  targetChainConfig = {
    chain: polygon,
    rpcUrl: defaultRpcUrl, // Use the env var RPC if different from default
    transportInput: http(defaultRpcUrl),
  };
} else {
  targetChainConfig = { // Fallback to mainnet or a default
    chain: mainnet,
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL_MAINNET || "https://cloudflare-eth.com", // Example
    transportInput: http(process.env.NEXT_PUBLIC_RPC_URL_MAINNET || "https://cloudflare-eth.com"),
  };
}

export const wagmiConfig = createConfig({
  chains: [targetChainConfig.chain],
  connectors: [
    injected(), // Basic browser wallet connector (MetaMask, etc.)
    // You would add WalletConnect connector here if needed, e.g.,
    // walletConnect({ projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID! }),
  ],
  transports: {
    [targetChainConfig.chain.id]: targetChainConfig.transportInput,
  },
  ssr: true, // Explicitly enable SSR for Wagmi
});
