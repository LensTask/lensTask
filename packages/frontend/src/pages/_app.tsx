import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from '../context/appState'; // Adjust path if needed

import {
  LensProvider,
  development, // Use the default 'development' environment from the SDK
  production,
  type LensConfig,
} from '@lens-protocol/react-web';
import { bindings as wagmiLensBindings } from '@lens-protocol/wagmi';
import { WagmiProvider } from 'wagmi';
import { ConnectKitProvider } from 'connectkit';

import { wagmiConfig as appWagmiConfig } from '@/lib/appWagmiConfig';
import Navbar from '@/components/Navbar';
import { Web3Provider } from '@/components/Web3Provider';
const queryClient = new QueryClient();

// Determine Lens environment based on Node environment
const lensEnvironment = process.env.NODE_ENV === 'development' ? development : production;

const lensProviderConfig: LensConfig = {
  environment: lensEnvironment, // This will use the SDK's default 'development' settings
  bindings: wagmiLensBindings(appWagmiConfig),
};

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Web3Provider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <Navbar />
          <Component {...pageProps} />
        </QueryClientProvider>
      </AuthProvider>
    </Web3Provider>
  );
}
