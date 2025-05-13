import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  LensProvider,
  development, // Use the default 'development' environment from the SDK
  production,
  type LensConfig,
} from '@lens-protocol/react-web';
import { bindings as wagmiLensBindings } from '@lens-protocol/wagmi';
import { WagmiProvider } from 'wagmi';
import { ConnectKitProvider } from 'connectkit';

import { wagmiConfig as appWagmiConfig } from '@/lib/wagmi';
import Navbar from '@/components/Navbar';

const queryClient = new QueryClient();

// Determine Lens environment based on Node environment
const lensEnvironment = process.env.NODE_ENV === 'development' ? development : production;

const lensProviderConfig: LensConfig = {
  environment: lensEnvironment, // This will use the SDK's default 'development' settings
  bindings: wagmiLensBindings(appWagmiConfig),
};

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiProvider config={appWagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider theme="auto">
          <LensProvider config={lensProviderConfig}>
            <Navbar />
            <Component {...pageProps} />
          </LensProvider>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
