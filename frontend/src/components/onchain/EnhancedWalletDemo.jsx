'use client';

import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownBasename,
  WalletDropdownDisconnect,
  WalletDropdownFundLink,
  WalletDropdownLink,
} from '@coinbase/onchainkit/wallet';
import { 
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance 
} from '@coinbase/onchainkit/identity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet as WalletIcon,
  Shield,
  Zap,
  Users
} from 'lucide-react';

export function EnhancedWalletDemo() {
  return (
    <Card className="p-6">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="flex items-center gap-2">
          <WalletIcon className="h-5 w-5" />
          Enhanced Wallet Features
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        {/* Main Wallet Component */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Connect with any supported wallet including Coinbase Smart Wallet
          </p>
          
          <Wallet>
            <ConnectWallet>
              <Avatar className="h-6 w-6" />
              <Name />
            </ConnectWallet>
            <WalletDropdown>
              <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                <Avatar />
                <Name />
                <Address />
                <EthBalance />
              </Identity>
              <WalletDropdownBasename />
              <WalletDropdownLink
                icon="wallet"
                href="https://keys.coinbase.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Wallet Settings
              </WalletDropdownLink>
              <WalletDropdownFundLink />
              <WalletDropdownDisconnect />
            </WalletDropdown>
          </Wallet>
        </div>

        {/* Supported Wallets */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Supported Wallets</h4>
          <div className="grid grid-cols-2 gap-2">
            <Badge variant="outline" className="justify-center py-2">
              <img src="/wallet-icons/coinbase-coin-seeklogo.svg" alt="Coinbase" className="w-4 h-4 mr-2" />
              Coinbase
            </Badge>
            <Badge variant="outline" className="justify-center py-2">
              <img src="/wallet-icons/metamask-seeklogo.svg" alt="MetaMask" className="w-4 h-4 mr-2" />
              MetaMask
            </Badge>
            <Badge variant="outline" className="justify-center py-2">
              <img src="/wallet-icons/walletconnect-seeklogo.svg" alt="WalletConnect" className="w-4 h-4 mr-2" />
              WalletConnect
            </Badge>
            <Badge variant="outline" className="justify-center py-2">
              <WalletIcon className="w-4 h-4 mr-2" />
              Rabby
            </Badge>
            <Badge variant="outline" className="justify-center py-2">
              <Shield className="w-4 h-4 mr-2" />
              Trust Wallet
            </Badge>
            <Badge variant="outline" className="justify-center py-2">
              <Users className="w-4 h-4 mr-2" />
              Frame
            </Badge>
          </div>
        </div>

        {/* Enhanced Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-500/10 rounded-lg mx-auto mb-2">
              <Shield className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-xs font-medium">Smart Wallet</p>
            <p className="text-xs text-muted-foreground">Gasless transactions</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-green-500/10 rounded-lg mx-auto mb-2">
              <Zap className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-xs font-medium">Fast Connect</p>
            <p className="text-xs text-muted-foreground">One-click connection</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-purple-500/10 rounded-lg mx-auto mb-2">
              <Users className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-xs font-medium">Multi-Wallet</p>
            <p className="text-xs text-muted-foreground">Support all wallets</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}