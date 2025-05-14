// src/components/Web3Provider.tsx
"use client";

import { WagmiProvider } from "wagmi";
// Import the shared Wagmi config
import { appWagmiConfig } from "@/lib/appWagmiConfig"; // Adjust path if needed
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import React from "react"; // Import React for isMounted

const queryClient = new QueryClient();

interface Web3ProviderProps {
  children: React.ReactNode;
}

export const Web3Provider = ({ children }: Web3ProviderProps) => {
  // isMounted check to ensure client-side only rendering of providers
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // Return null or a placeholder to prevent SSR of these providers
    return null;
  }

  return (
    <WagmiProvider config={appWagmiConfig}> {/* USE THE SHARED appWagmiConfig */}
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          theme="auto"
          mode="auto"
          // options={{ initialChainId: 0 }} // Optional
        >
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
