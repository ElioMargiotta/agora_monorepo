// Funding-related constants
export const PLATFORM_META = {
  hyperliquid: {
    id: 'hyperliquid',
    name: 'Hyperliquid',
    color: 'bg-blue-500',
    textColor: 'text-blue-600',
    description: 'Perpetual futures DEX',
    image: '/hyprliquid.png',
    unit: 'per_hour',
  },
  extended: {
    id: 'extended',
    name: 'Extended',
    color: 'bg-green-500',
    textColor: 'text-green-600',
    description: 'Advanced derivatives',
    image: '/extended.png',
    unit: 'per_hour',
  },
  aster: {
    id: 'aster',
    name: 'Aster',
    color: 'bg-purple-500',
    textColor: 'text-purple-600',
    description: 'Decentralized exchange',
    image: '/aster.png',
    unit: 'per_hour',
  },
  lighter: {
    id: 'lighter',
    name: 'Lighter',
    color: 'bg-orange-500',
    textColor: 'text-orange-600',
    description: 'Perpetual futures on Lighter',
    image: '/lighter.png',
    unit: 'per_hour',
  },
  paradex: {
    id: 'paradex',
    name: 'Paradex',
    color: 'bg-red-500',
    textColor: 'text-red-600',
    description: 'Perpetual futures on Paradex',
    image: '/paradex.png',
    unit: 'per_hour',
  },
};

export const AVAILABLE_PLATFORMS = Object.values(PLATFORM_META);
