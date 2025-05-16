import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppContext, useAppState } from '../context/useAppState'
import { LensSessionManager } from '@/components/LensSessionManager'; // Import the new component


import Navbar from '@/components/Navbar';
import { Web3Provider } from '@/components/Web3Provider';
const queryClient = new QueryClient();


export default function App({ Component, pageProps }: AppProps) {
  const { state, actions } = useAppState();

  return (
    <Web3Provider>
      <AppContext.Provider value={{ state, actions }}>
        <LensSessionManager /> {/* Manages Lens session logic and updates AppContext */}
        <QueryClientProvider client={queryClient}>
          <Navbar />
          <Component {...pageProps} />
        </QueryClientProvider>
      </AppContext.Provider>
    </Web3Provider>
  );
}
