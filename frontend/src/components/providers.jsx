'use client';

import { OnchainKitProvider } from '@coinbase/onchainkit';
import { ThemeProvider } from 'next-themes';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { base } from 'wagmi/chains';
import { config } from '@/lib/wagmi';
import { useState } from 'react';

export function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || 'your_api_key_here'}
          projectId={process.env.NEXT_PUBLIC_CDP_PROJECT_ID}
          chain={base} // Default chain remains Base for Mini App compatibility
          config={{
            appearance: {
              name: 'Aequilibra',
              logo: 'https://aequilibra.vercel.app/pepe.png',
              mode: 'auto', // 'light' | 'dark' | 'auto'
              theme: 'base', // 'default' | 'base' | 'cyberpunk' | 'hacker'
            },
            wallet: {
              display: 'modal', // 'modal' | 'classic'
              preference: 'all', // 'all' | 'smartWalletOnly' | 'eoaOnly'
              termsUrl: 'https://aequilibra.vercel.app/legal/terms',
              privacyUrl: 'https://aequilibra.vercel.app/legal/privacy',
              supportedWallets: {
                rabby: true,
                trust: true,
                frame: true,
              },
            },
        paymaster: process.env.NEXT_PUBLIC_PAYMASTER_URL, // Gas sponsorship
        analytics: true, // Enable usage analytics
      }}
      miniKit={{
        enabled: true, // Enable MiniKit for Base Mini Apps
        autoConnect: true, // Auto-connect when in mini apps
        notificationProxyUrl: '/api/notify', // Custom notification proxy
      }}
      analytics={true} // Enable OnchainKit analytics
    >
      <ThemeProvider 
        attribute="class" 
        defaultTheme="system" 
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </OnchainKitProvider>
  </QueryClientProvider>
</WagmiProvider>
  );
}