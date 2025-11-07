import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { supportedChains } from '@/lib/wagmi';
import { base, mainnet, arbitrum, optimism, polygon, bsc } from 'wagmi/chains';

// Enhanced chain information with DeFi protocols
export const CHAIN_PROTOCOLS = {
  [base.id]: {
    protocols: ['Aerodrome', 'BaseSwap', 'Uniswap V3', 'Moonwell'],
    fundingProtocols: ['Hyperliquid Bridge'],
  },
  [mainnet.id]: {
    protocols: ['dYdX', 'Uniswap V3', 'Maker', 'Compound', 'Aave'],
    fundingProtocols: ['dYdX V4', 'Hyperliquid'],
  },
  [arbitrum.id]: {
    protocols: ['GMX', 'Gains Network', 'Camelot', 'Radiant', 'Uniswap V3'],
    fundingProtocols: ['GMX V2', 'Gains Network', 'Hyperliquid Bridge'],
  },
  [optimism.id]: {
    protocols: ['Synthetix Perps', 'Velodrome', 'Uniswap V3', 'Aave'],
    fundingProtocols: ['Synthetix Perps V2', 'Kwenta'],
  },
  [polygon.id]: {
    protocols: ['QuickSwap', 'Gains Network', 'Uniswap V3', 'Aave'],
    fundingProtocols: ['Gains Network', 'QuickSwap Perps'],
  },
  [bsc.id]: {
    protocols: ['PancakeSwap', 'Venus', 'Alpaca Finance'],
    fundingProtocols: ['Binance Futures API'],
  },
};

export function useMultichain() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending, error } = useSwitchChain();

  const currentChain = supportedChains[chainId];

  const switchToChain = async (targetChainId) => {
    if (chainId === targetChainId) return;
    
    try {
      await switchChain({ chainId: targetChainId });
    } catch (error) {
      console.error('Failed to switch chain:', error);
      throw error;
    }
  };

  const getProtocolsForChain = (targetChainId) => {
    return CHAIN_PROTOCOLS[targetChainId]?.protocols || [];
  };

  const getFundingProtocolsForChain = (targetChainId) => {
    return CHAIN_PROTOCOLS[targetChainId]?.fundingProtocols || [];
  };

  const isChainSupported = (targetChainId) => {
    return Object.keys(supportedChains).includes(targetChainId.toString());
  };

  return {
    // Current state
    address,
    isConnected,
    chainId,
    currentChain,
    
    // Chain switching
    switchToChain,
    isSwitching: isPending,
    switchError: error,
    
    // Chain utilities
    supportedChains: Object.values(supportedChains),
    getProtocolsForChain,
    getFundingProtocolsForChain,
    isChainSupported,
    
    // Specific chain checks
    isOnBase: chainId === base.id,
    isOnMainnet: chainId === mainnet.id,
    isOnArbitrum: chainId === arbitrum.id,
    isOnOptimism: chainId === optimism.id,
    isOnPolygon: chainId === polygon.id,
    isOnBSC: chainId === bsc.id,
  };
}

// Helper function to get chain-specific funding rate sources
export function getFundingRateSources(chainId) {
  const chainProtocols = CHAIN_PROTOCOLS[chainId]?.fundingProtocols || [];
  
  const sourceMap = {
    'GMX V2': { 
      url: 'https://app.gmx.io', 
      type: 'perpetuals',
      chainId: arbitrum.id,
      supported: true 
    },
    'Gains Network': { 
      url: 'https://gains.trade', 
      type: 'perpetuals',
      chainId: [arbitrum.id, polygon.id],
      supported: true 
    },
    'dYdX V4': { 
      url: 'https://dydx.trade', 
      type: 'perpetuals',
      chainId: mainnet.id,
      supported: true 
    },
    'Synthetix Perps V2': { 
      url: 'https://kwenta.io', 
      type: 'perpetuals',
      chainId: optimism.id,
      supported: true 
    },
    'QuickSwap Perps': { 
      url: 'https://quickswap.exchange', 
      type: 'perpetuals',
      chainId: polygon.id,
      supported: false // Coming soon
    },
    'Kwenta': { 
      url: 'https://kwenta.io', 
      type: 'perpetuals',
      chainId: optimism.id,
      supported: true 
    },
    'Hyperliquid': { 
      url: 'https://app.hyperliquid.xyz', 
      type: 'perpetuals',
      chainId: 'universal', // Available via bridge
      supported: true 
    },
    'Hyperliquid Bridge': { 
      url: 'https://app.hyperliquid.xyz', 
      type: 'bridge',
      chainId: 'universal',
      supported: true 
    },
    'Binance Futures API': { 
      url: 'https://www.binance.com/en/futures', 
      type: 'cex',
      chainId: bsc.id,
      supported: true 
    },
  };

  return chainProtocols
    .filter(protocol => sourceMap[protocol])
    .map(protocol => ({
      name: protocol,
      ...sourceMap[protocol],
      availableOnChain: chainId,
    }));
}

// Get all funding rate sources across all chains
export function getAllFundingRateSources() {
  const allSources = [];
  
  Object.keys(CHAIN_PROTOCOLS).forEach(chainId => {
    const sources = getFundingRateSources(parseInt(chainId));
    allSources.push(...sources);
  });
  
  // Remove duplicates and add universal protocols
  const uniqueSources = allSources.filter((source, index, array) => 
    array.findIndex(s => s.name === source.name) === index
  );
  
  return uniqueSources;
}