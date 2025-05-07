import "@/styles/globals.css";
import type { AppProps } from "next/app"; // Removed AppContext as it's not used here
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, State } from 'wagmi'; // Import State
import { wagmiConfig } from "@/lib/wagmi";
import { ConnectKitProvider } from 'connectkit';

const queryClient = new QueryClient();

interface MyAppProps extends AppProps {
  initialState?: State;
}

function MyApp({ Component, pageProps, initialState }: MyAppProps) {
  return (
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider> {/* theme="auto" mode="light" // Optional ConnectKit theming props */}
          <Component {...pageProps} />
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default MyApp;
