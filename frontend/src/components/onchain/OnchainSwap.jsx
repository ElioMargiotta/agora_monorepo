'use client';

import { 
  Swap,
  SwapAmountInput,
  SwapToggleButton,
  SwapButton,
  SwapMessage,
  SwapToast,
} from '@coinbase/onchainkit/swap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCallback } from 'react';
import { TrendingUp, ArrowUpDown } from 'lucide-react';

// Popular tokens on Base network
const baseTokens = [
  {
    address: '',
    chainId: 8453,
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
    image: 'https://dynamic-assets.coinbase.com/dbb4b4983bde81309ddab83eb598358eb44375b930b94687ebe38bc22e52c3b2125258ffb8477a5ef22e33d6bd72e32a506c391caa13af64c00e46613c3e5806/asset_icons/4113b082d21cc5fab17fc8f2d19fb996165bcce635e6900f7fc2d57c4ef33ae9.png',
  },
  {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    chainId: 8453,
    decimals: 6,
    name: 'USD Coin',
    symbol: 'USDC',
    image: 'https://dynamic-assets.coinbase.com/3c15df5e2ac7d4abbe9499ed9335041f00c620f28e8de2f93474a9f432058542cdf4674bd43f309e69778a26969372310a0b29bd4c96b6a7fc6b38de5893e83b/asset_icons/9d67b728b6c8f457717154b3a35f9ddc702eae7e76c4684ee39302c4d7fd0bb8.png',
  },
  {
    address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
    chainId: 8453,
    decimals: 8,
    name: 'Coinbase Wrapped BTC',
    symbol: 'cbBTC',
    image: 'https://dynamic-assets.coinbase.com/f47ac64501a848f28c1b9bd0b7bc6f8b7b9c9e0e6b5db9dfa9faf42b1c24e6f9/asset_icons/0047c2dc39c7e82c0c66b48e10b50a5a6c0d2c0e0e8c4e3b3e7f0e5e6a9f2c3a.png',
  },
];

export function OnchainSwap({ 
  onSuccess,
  onError,
  showCard = true,
  ...props 
}) {
  const handleOnStatus = useCallback((status) => {
    console.log('Swap status:', status);
    
    if (status.statusName === 'success' && onSuccess) {
      onSuccess(status);
    } else if (status.statusName === 'error' && onError) {
      onError(status);
    }
  }, [onSuccess, onError]);

  const swapContent = (
    <Swap onStatus={handleOnStatus} {...props}>
      <div className="space-y-4">
        {/* From Token */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            From
          </label>
          <SwapAmountInput
            label="Sell"
            swappableTokens={baseTokens}
            token={baseTokens[0]} // Default to ETH
            type="from"
          />
        </div>

        {/* Swap Toggle Button */}
        <div className="flex justify-center">
          <SwapToggleButton />
        </div>

        {/* To Token */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            To
          </label>
          <SwapAmountInput
            label="Buy"
            swappableTokens={baseTokens}
            token={baseTokens[1]} // Default to USDC
            type="to"
          />
        </div>

        {/* Swap Button */}
        <SwapButton className="min-h-[44px] w-full" />

        {/* Swap Message */}
        <SwapMessage />
      </div>
      
      {/* Swap Toast for notifications */}
      <SwapToast />
    </Swap>
  );

  if (!showCard) {
    return (
      <div className="w-full max-w-md mx-auto">
        {swapContent}
      </div>
    );
  }

  return (
    <Card className="p-6 max-w-md mx-auto">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Swap Tokens
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {swapContent}
        
        {/* Info */}
        <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <p className="text-xs text-blue-600 dark:text-blue-400">
            <ArrowUpDown className="inline w-3 h-3 mr-1" />
            Swap between ETH, USDC, and cbBTC on Base network with optimized routing
          </p>
        </div>
      </CardContent>
    </Card>
  );
}