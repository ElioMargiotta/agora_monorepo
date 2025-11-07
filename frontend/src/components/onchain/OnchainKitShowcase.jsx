'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OnchainWallet } from '@/components/wallet/OnchainWallet';
import { OnchainSwap } from '@/components/onchain/OnchainSwap';
import { OnchainTransaction } from '@/components/onchain/OnchainTransaction';
import { 
  Wallet,
  ArrowUpDown,
  Send,
  Zap,
  Shield
} from 'lucide-react';

export function OnchainKitShowcase() {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">OnchainKit Integration</h2>
        <p className="text-muted-foreground">
          Powered by Base OnchainKit for seamless web3 experiences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Wallet Connection */}
        <Card className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Smart Wallet
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <p className="text-sm text-muted-foreground mb-4">
              Connect with any wallet including Coinbase Smart Wallet
            </p>
            <OnchainWallet />
            <div className="mt-3">
              <Badge variant="outline" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Secure & Fast
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Swap Feature */}
        <Card className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5" />
              Token Swap
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <p className="text-sm text-muted-foreground mb-4">
              Swap tokens directly within the app
            </p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                // This would open a swap modal or navigate to swap page
                console.log('Open swap interface');
              }}
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Open Swap
            </Button>
            <div className="mt-3">
              <Badge variant="outline" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Low Fees
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Features */}
        <Card className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <p className="text-sm text-muted-foreground mb-4">
              Execute transactions with real-time status
            </p>
            <Button 
              variant="outline" 
              className="w-full"
              disabled
            >
              <Send className="h-4 w-4 mr-2" />
              Demo Transaction
            </Button>
            <div className="mt-3">
              <Badge variant="outline" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Gas Optimized
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Benefits */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle>OnchainKit Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">🎨 Consistent Design</h4>
              <p className="text-sm text-muted-foreground">
                Components follow Base design guidelines automatically
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">🔒 Enhanced Security</h4>
              <p className="text-sm text-muted-foreground">
                Built-in security best practices and audit trails
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">📱 Mobile Optimized</h4>
              <p className="text-sm text-muted-foreground">
                Perfect for Base Mini Apps and mobile experiences
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">⚡ Performance</h4>
              <p className="text-sm text-muted-foreground">
                Optimized for fast loading and smooth interactions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}