// components/Web3Providers.tsx
'use client';

import React, { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  LensProvider,
  development,
  production,
} from '@lens-protocol/react-web';
import { bindings } from '@lens-protocol/wagmi';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from '@/lib/wagmi';
import { ConnectKitProvider } from "connectkit";

const queryClient = new QueryClient();

const lensEnvironment =
  process.env.NODE_ENV === 'development' ? development : production;

const lensConfig = {
  environment: lensEnvironment,
  bindings: bindings(wagmiConfig),
};

interface Web3ProvidersProps {
  children: React.ReactNode;
}

export default function Web3Providers({ children }: Web3ProvidersProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // If not mounted on client yet, return null.
  // This ensures providers are not rendered on the server at all.
  if (!isMounted) {
    return null;
  }

  // Only render providers on the client side after mount
  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={true}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          theme="auto"
          mode="auto"
          options={{
            // enforceSupportedChains: true,
          }}
        >
          <LensProvider config={lensConfig}>
            {children}
          </LensProvider>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
