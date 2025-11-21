import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, arbitrum, optimism, base, polygon, bsc, sepolia } from 'wagmi/chains';
import {
  metaMaskWallet,
  rainbowWallet,
  coinbaseWallet,
  walletConnectWallet,
  trustWallet,
  rabbyWallet,
  ledgerWallet,
  frameWallet,
} from '@rainbow-me/rainbowkit/wallets';

// Get project ID from environment (you'll need to create this)
const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

export const config = getDefaultConfig({
  appName: 'Aequilibra',
  projectId,
  chains: [sepolia, mainnet, arbitrum, optimism, base, polygon, bsc],
  wallets: [
    {
      groupName: 'Popular',
      wallets: [
        metaMaskWallet,
        rainbowWallet,
        coinbaseWallet,
        // walletConnectWallet, // Temporarily disabled - requires valid project ID
      ],
    },
    {
      groupName: 'More',
      wallets: [
        trustWallet,
        rabbyWallet,
        ledgerWallet,
        frameWallet,
      ],
    },
  ],
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