'use client';

import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';

const queryClient = new QueryClient();

export function Providers({ children }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || 'demo-api-key'}
          chain={{
            id: 1,
            name: 'Ethereum',
            network: 'mainnet',
            nativeCurrency: {
              decimals: 18,
              name: 'Ether',
              symbol: 'ETH',
            },
            rpcUrls: {
              default: {
                http: ['https://cloudflare-eth.com'],
              },
            },
            blockExplorers: {
              default: { name: 'Etherscan', url: 'https://etherscan.io' },
            },
          }}
          config={{
            appearance: {
              mode: 'auto',
            },
          }}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}