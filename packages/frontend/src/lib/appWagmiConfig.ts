// src/lib/appWagmiConfig.ts
"use client"; // Good practice if this file might be imported by client components directly

import { createConfig, http } from "wagmi";
import { chains as lensSDKChainsFromLensChainSDK } from "@lens-chain/sdk/viem"; // Import from @lens-chain/sdk
import { getDefaultConfig } from "connectkit";

// Determine which Lens chain to use as primary based on NODE_ENV
// chains.testnet from @lens-chain/sdk is Lens Chain Sepolia (37111)
// chains.mainnet from @lens-chain/sdk is Lens Chain Mainnet (232)
export const activeChainForApp =  lensSDKChainsFromLensChainSDK.mainnet;
  // ? lensSDKChainsFromLensChainSDK.testnet
  // : lensSDKChainsFromLensChainSDK.mainnet;

  // Other chains you might want to support in ConnectKit modal for switching
const otherSupportedChainsForApp = process.env.NODE_ENV === 'development'
  ? [lensSDKChainsFromLensChainSDK.mainnet] // In dev, show option to switch to Lens Mainnet
  : [lensSDKChainsFromLensChainSDK.testnet]; // In prod, show option to switch to Lens Testnet

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!walletConnectProjectId && typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
    console.warn(
      `[appWagmiConfig] NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. WalletConnect functionality in ConnectKit might be impaired.`
    );
}

export const appWagmiConfig = createConfig(
  getDefaultConfig({
    chains: [activeChainForApp, ...otherSupportedChainsForApp], // Primary chain first
    transports: {
      // Setup transports for all chains you've included
      [lensSDKChainsFromLensChainSDK.mainnet.id]: http(lensSDKChainsFromLensChainSDK.mainnet.rpcUrls.default.http[0]!),
      [lensSDKChainsFromLensChainSDK.testnet.id]: http(lensSDKChainsFromLensChainSDK.testnet.rpcUrls.default.http[0]!),
      // Add transports for any other chains in otherSupportedChainsForApp if they have custom RPCs
    },
    walletConnectProjectId: walletConnectProjectId!, // The '!' asserts it's defined; handle gracefully if not.
    appName: "My Lens App",
    appDescription: "A cool app using Lens Protocol.",
    appUrl: typeof window !== 'undefined' ? window.location.origin : "https://example.com",
    appIcon: "/logo.png", // Ensure you have this in /public
  })
);

console.log(`[appWagmiConfig] Configured. Active chain for app: ID=${activeChainForApp.id}, Name='${activeChainForApp.name}'`);
