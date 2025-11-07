import { http, createConfig } from 'wagmi';
import { mainnet, arbitrum, optimism, base, polygon, bsc } from 'wagmi/chains';
import {
  coinbaseWallet,
  metaMask,
  walletConnect,
  injected,
} from 'wagmi/connectors';

// Get project ID from environment (you'll need to create this)
const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

export const config = createConfig({
  chains: [mainnet, arbitrum, optimism, base, polygon, bsc],
  connectors: [
    metaMask(),
    walletConnect({
      projectId,
      metadata: {
        name: 'Aequilibra',
        description: 'Find the best funding across perps. One dashboard.',
        url: 'https://aequilibra.xyz',
        icons: ['https://aequilibra.xyz/favicon.ico'],
      },
    }),
    coinbaseWallet({
      appName: 'Aequilibra',
      appLogoUrl: 'https://aequilibra.xyz/favicon.ico',
    }),
    injected(),
  ],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
    [polygon.id]: http(),
    [bsc.id]: http(),
  },
});

export const supportedChains = {
  [mainnet.id]: {
    name: 'Ethereum',
    shortName: 'ETH',
    color: '#627EEA',
    icon: '/chain-icons/eth.svg',
  },
  [arbitrum.id]: {
    name: 'Arbitrum',
    shortName: 'ARB',
    color: '#2D374B',
    icon: '/chain-icons/arb.svg',
  },
  [optimism.id]: {
    name: 'Optimism',
    shortName: 'OP',
    color: '#FF0420',
    icon: '/chain-icons/op.svg',
  },
  [base.id]: {
    name: 'Base',
    shortName: 'BASE',
    color: '#0052FF',
    icon: '/chain-icons/base.svg',
  },
  [polygon.id]: {
    name: 'Polygon',
    shortName: 'MATIC',
    color: '#8247E5',
    icon: '/chain-icons/matic.svg',
  },
  [bsc.id]: {
    name: 'BSC',
    shortName: 'BNB',
    color: '#F3BA2F',
    icon: '/chain-icons/bnb.svg',
  },
};