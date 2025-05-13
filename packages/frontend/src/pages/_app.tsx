import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from 'react';

// Import LensProvider from @lens-protocol/react
import { LensProvider } from '@lens-protocol/react';
// Import bindings from @lens-protocol/wagmi
import { bindings as lensWagmiBindings } from '@lens-protocol/wagmi';

import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from '@/lib/wagmi'; // Your wagmiConfig now always targets 232

// Import your manually defined Lens Chain Mainnet environment
import { lensAppMainnetEnvironment } from '@/lib/lensEnvironment';

import Navbar from '@/components/Navbar';
import { ConnectKitProvider } from "connectkit";

const queryClient = new QueryClient();

// ALWAYS use the Lens Chain Mainnet (232) environment
const currentLensEnvironment = lensAppMainnetEnvironment;

console.log("[_app.tsx] TARGETING LENS CHAIN MAINNET (ID 232)");
console.log("[_app.tsx] Selected currentLensEnvironment for LensProvider:", JSON.stringify(currentLensEnvironment, null, 2));

const lensProviderConfig = {
  environment: currentLensEnvironment,
  bindings: lensWagmiBindings(wagmiConfig),
};

if (!lensProviderConfig.environment || !lensProviderConfig.environment.backend) {
  console.error("[_app.tsx] CRITICAL: Lens environment or its backend URL is undefined!", lensProviderConfig.environment);
} else if (!lensProviderConfig.bindings) {
  console.error("[_app.tsx] CRITICAL: Lens bindings object is undefined or failed to create!", lensProviderConfig.bindings);
} else {
  console.log("[_app.tsx] lensProviderConfig created successfully. Backend:", lensProviderConfig.environment.backend);
  const expectedChainIdByLens = (lensProviderConfig.environment.chains?.lens?.chainId);
  console.log("[_app.tsx] LensProvider will be configured for Primary Lens Chain ID:", expectedChainIdByLens);
  if (expectedChainIdByLens !== 232) {
    console.error(`[MISMATCH!] LensProvider env targets chain ${expectedChainIdByLens}, but we expect 232.`);
  }
}

export default function App({ Component, pageProps }: AppProps) {
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="bg-gray-800 text-white p-4 shadow-md sticky top-0 z-50">
          <div className="container mx-auto flex justify-between items-center">
            <span className="text-xl font-bold">LensIntel (Initializing...)</span>
          </div>
        </div>
        <main className="flex-grow flex justify-center items-center"><div>Loading Application...</div></main>
      </div>
    );
  }

  if (!lensProviderConfig.environment || !lensProviderConfig.bindings) {
    return <div>Error: Lens App Configuration failed (environment or bindings). Check console.</div>;
  }

  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={true}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider theme="auto" mode="auto" options={{ appName: "My Lens App" }}>
          <LensProvider config={lensProviderConfig}>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-grow"><Component {...pageProps} /></main>
            </div>
          </LensProvider>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
