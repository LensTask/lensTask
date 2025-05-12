import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  LensProvider,
  development,             // Import individual constants from react-web
  production,
} from '@lens-protocol/react-web';
import { bindings } from '@lens-protocol/wagmi';
import { WagmiProvider } from 'wagmi'; // WagmiProvider from wagmi
import { wagmiConfig } from '@/lib/wagmi'; // Your wagmi config

const queryClient = new QueryClient();

// LensProvider config for V3
// 'development' from @lens-protocol/react-web points to Lens Chain Sepolia
// 'production' from @lens-protocol/react-web points to Lens Mainnet (Polygon)
const lensEnvironment =
  process.env.NODE_ENV === 'development' ? development : production;

const lensConfig = {
  environment: lensEnvironment,
  bindings: bindings(wagmiConfig),
};

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <LensProvider config={lensConfig}>
          <Component {...pageProps} />
        </LensProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
