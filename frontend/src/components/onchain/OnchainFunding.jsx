'use client';

import {
  FundButton,
  getOnrampBuyUrl,
} from '@coinbase/onchainkit/fund';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Wallet,
  CreditCard,
  ArrowUpRight,
  Zap
} from 'lucide-react';

export function OnchainFunding() {
  const handleOnrampSuccess = (transactionDetails) => {
    console.log('Onramp success:', transactionDetails);
    // Handle successful funding
  };

  const handleOnrampError = (error) => {
    console.error('Onramp error:', error);
    // Handle funding error
  };

  const openOnrampPopup = () => {
    const onrampURL = getOnrampBuyUrl({
      projectId: process.env.NEXT_PUBLIC_CDP_PROJECT_ID,
      addresses: { base: '0x...' }, // User's wallet address
      assets: ['USDC', 'ETH'],
      presetFiatAmount: 20,
      fiatCurrency: 'USD'
    });
    
    window.open(onrampURL, 'onramp', 'width=460,height=720');
  };

  return (
    <Card className="p-6">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Fund Your Wallet
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-4">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Buy crypto directly with your credit card or bank account
          </p>
          
          {/* OnchainKit Fund Button */}
          <FundButton
            fundingUrl={getOnrampBuyUrl({
              projectId: process.env.NEXT_PUBLIC_CDP_PROJECT_ID,
              addresses: { base: '0x...' },
              assets: ['USDC', 'ETH'],
              presetFiatAmount: 20,
              fiatCurrency: 'USD'
            })}
            onSuccess={handleOnrampSuccess}
            onError={handleOnrampError}
            className="w-full min-h-[44px]"
          />
          
          {/* Alternative custom button */}
          <Button 
            variant="outline" 
            className="w-full min-h-[44px]"
            onClick={openOnrampPopup}
          >
            <Wallet className="h-4 w-4 mr-2" />
            Buy Crypto
            <ArrowUpRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-4 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-500/10 rounded-lg mx-auto mb-2">
              <Zap className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-xs font-medium">Instant</p>
            <p className="text-xs text-muted-foreground">Buy crypto instantly</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-green-500/10 rounded-lg mx-auto mb-2">
              <CreditCard className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-xs font-medium">Secure</p>
            <p className="text-xs text-muted-foreground">Bank-grade security</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}