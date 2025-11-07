'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OnchainWallet } from '@/components/wallet/OnchainWallet';
import { OnchainTransaction } from '@/components/onchain/OnchainTransaction';
import { OnchainFunding } from '@/components/onchain/OnchainFunding';
import { OnchainSwap } from '@/components/onchain/OnchainSwap';
import { EnhancedWalletDemo } from '@/components/onchain/EnhancedWalletDemo';
import { 
  Wallet, 
  ArrowUpDown, 
  Zap, 
  CreditCard,
  Shield,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

export default function OnchainDemoPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">OnchainKit Integration Demo</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Experience the full power of Base blockchain integration with OnchainKit features including wallet connectivity, token swaps, funding, and transactions.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
            <Shield className="w-3 h-3 mr-1" />
            Base Network
          </Badge>
          <Badge variant="secondary" className="bg-green-500/10 text-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            OnchainKit v0.31
          </Badge>
          <Badge variant="secondary" className="bg-purple-500/10 text-purple-600">
            <Zap className="w-3 h-3 mr-1" />
            Paymaster Ready
          </Badge>
        </div>
      </div>

      {/* Configuration Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Shield className="h-5 w-5" />
            Enhanced Configuration Active
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">6+</div>
              <div className="text-sm text-muted-foreground">Supported Wallets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">Gasless</div>
              <div className="text-sm text-muted-foreground">Transactions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">Real-time</div>
              <div className="text-sm text-muted-foreground">Analytics</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">MiniKit</div>
              <div className="text-sm text-muted-foreground">Integration</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Demo Tabs */}
      <Tabs defaultValue="wallet" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="wallet" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Wallet
          </TabsTrigger>
          <TabsTrigger value="swap" className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Swap
          </TabsTrigger>
          <TabsTrigger value="funding" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Funding
          </TabsTrigger>
          <TabsTrigger value="transaction" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Transaction
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wallet" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-2xl font-semibold mb-4">Connect Your Wallet</h3>
              <p className="text-muted-foreground mb-6">
                Experience seamless wallet connectivity with support for Coinbase Smart Wallet, MetaMask, WalletConnect, and more.
              </p>
              <OnchainWallet />
            </div>
            <div>
              <EnhancedWalletDemo />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="swap" className="space-y-6">
          <div className="text-center space-y-4 mb-8">
            <h3 className="text-2xl font-semibold">Token Swapping</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Swap between ETH, USDC, and cbBTC on Base network with optimized routing and minimal slippage.
            </p>
          </div>
          <div className="flex justify-center">
            <OnchainSwap />
          </div>
        </TabsContent>

        <TabsContent value="funding" className="space-y-6">
          <div className="text-center space-y-4 mb-8">
            <h3 className="text-2xl font-semibold">Fund Your Wallet</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Add funds to your wallet using various payment methods including credit cards and bank transfers.
            </p>
          </div>
          <div className="flex justify-center">
            <OnchainFunding />
          </div>
        </TabsContent>

        <TabsContent value="transaction" className="space-y-6">
          <div className="text-center space-y-4 mb-8">
            <h3 className="text-2xl font-semibold">Send Transactions</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Send ETH and other tokens with real-time transaction tracking and status updates.
            </p>
          </div>
          <div className="flex justify-center">
            <OnchainTransaction />
          </div>
        </TabsContent>
      </Tabs>

      {/* Features Grid */}
      <div className="space-y-4">
        <h3 className="text-2xl font-semibold text-center">Advanced Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                Smart Wallet Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Coinbase Smart Wallet integration with gasless transactions and enhanced security features.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Paymaster Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Sponsored transactions for seamless user experience without requiring gas fees.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-green-500" />
                MiniKit Ready
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Optimized for Coinbase MiniKit with custom iframe communication and notifications.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-8 border-t">
        <p className="text-sm text-muted-foreground">
          Powered by{' '}
          <a 
            href="https://onchainkit.xyz" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            OnchainKit
          </a>
          {' '}and{' '}
          <a 
            href="https://base.org" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Base Network
          </a>
        </p>
      </div>
    </div>
  );
}