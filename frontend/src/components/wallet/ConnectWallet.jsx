'use client';

import { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Wallet, ChevronDown, Copy, ExternalLink, LogOut } from 'lucide-react';
import Image from 'next/image';

// Helper function to get wallet icon path
const getWalletIcon = (connector, connectors = []) => {
  const name = connector.name.toLowerCase();
  const connectorId = connector.id?.toLowerCase() || '';

  // Direct connector name matching
  if (name.includes('metamask') || connectorId.includes('metamask')) {
    return '/wallet-icons/metamask-seeklogo.svg';
  }

  if (name.includes('walletconnect') || connectorId.includes('walletconnect')) {
    return '/wallet-icons/walletconnect-seeklogo.svg';
  }

  if (name.includes('coinbase') || connectorId.includes('coinbase')) {
    return '/wallet-icons/coinbase-coin-seeklogo.svg';
  }

  // For injected wallets, check what's actually available
  if (name === 'injected' || connectorId === 'injected') {
    if (typeof window !== 'undefined' && window.ethereum) {
      // Debug log to see what properties are available
      console.log('Connector details:', {
        name: connector.name,
        id: connector.id,
        connector,
      });
      console.log('Ethereum object properties:', Object.keys(window.ethereum));
      // Enhanced debug for multiple injected connectors
      const injectedConnectors = connectors.filter(
        (c) => c.name === 'Injected'
      );
      const currentConnectorIndex = injectedConnectors.findIndex(
        (c) => c.uid === connector.uid
      );
      console.log(
        `Processing injected connector ${currentConnectorIndex + 1} of ${
          injectedConnectors.length
        }`
      );
      console.log('Connector UID:', connector.uid);

      // For multiple injected connectors, use index-based assignment
      if (injectedConnectors.length > 1) {
        console.log(
          'Multiple injected connectors detected, using index-based assignment'
        );

        // First injected connector - check for Brave
        if (
          currentConnectorIndex === 0 &&
          window.navigator?.userAgent?.includes('Brave')
        ) {
          console.log('✅ First injected connector assigned to Brave');
          return '/wallet-icons/brave-seeklogo.svg';
        }

        // Second injected connector - check for Rabby
        if (currentConnectorIndex === 1) {
          console.log('✅ Second injected connector assigned to Rabby');
          return '/wallet-icons/rabby.svg';
        }

        // Third+ connectors - try to detect
        if (currentConnectorIndex >= 2) {
          console.log(
            '✅ Additional injected connector - using generic detection'
          );
          // Fall through to normal detection
        }
      }

      // Simple Brave detection - if user agent contains Brave, show Brave icon
      if (window.navigator?.userAgent?.includes('Brave')) {
        console.log('✅ Detected Brave via userAgent');
        return '/wallet-icons/brave-seeklogo.svg';
      }

      // Check for Brave wallet property
      if (window.ethereum.isBraveWallet) {
        console.log('✅ Detected Brave via isBraveWallet');
        return '/wallet-icons/brave-seeklogo.svg';
      }

      // Check for navigator.brave
      if (window.navigator?.brave) {
        console.log('✅ Detected Brave via navigator.brave');
        return '/wallet-icons/brave-seeklogo.svg';
      }

      // Check for Rabby - enhanced detection methods
      console.log('🎨 Icon Detection - Checking Rabby...');
      console.log('ethereum.isRabby:', window.ethereum.isRabby);
      console.log('window.rabby:', window.rabby);
      console.log('ethereum.providers:', window.ethereum.providers);
      console.log(
        'userAgent includes rabby:',
        window.navigator?.userAgent?.toLowerCase().includes('rabby')
      );

      // Check for Rabby via multiple methods
      if (window.ethereum.isRabby) {
        console.log('✅ Icon: Detected Rabby via isRabby');
        return '/wallet-icons/rabby.svg';
      }

      if (window.rabby) {
        console.log('✅ Icon: Detected Rabby via window.rabby');
        return '/wallet-icons/rabby.svg';
      }

      // Check if it's Rabby by looking at providers array
      if (
        window.ethereum.providers &&
        window.ethereum.providers.some((p) => p.isRabby)
      ) {
        console.log('✅ Icon: Detected Rabby via providers array');
        return '/wallet-icons/rabby.svg';
      }

      // Check user agent for Rabby
      if (window.navigator?.userAgent?.toLowerCase().includes('rabby')) {
        console.log('✅ Icon: Detected Rabby via userAgent');
        return '/wallet-icons/rabby.svg';
      }

      // Check for Rabby-specific window properties
      if (window.ethereum._rabby || window.ethereum.rabbit) {
        console.log('✅ Icon: Detected Rabby via specific properties');
        return '/wallet-icons/rabby.svg';
      }

      // Check for MetaMask (but not Brave)
      if (window.ethereum.isMetaMask && !window.navigator?.brave) {
        return '/wallet-icons/metamask-seeklogo.svg';
      }

      // Check for Coinbase
      if (window.ethereum.isCoinbaseWallet) {
        return '/wallet-icons/coinbase-coin-seeklogo.svg';
      }
    }
  }

  return null;
};

// Helper function to get wallet display name
const getWalletDisplayName = (connector, connectors = []) => {
  const name = connector.name;
  const connectorId = connector.id?.toLowerCase() || '';

  // For injected wallets, detect specific wallet
  if (name === 'Injected' || connectorId === 'injected') {
    if (typeof window !== 'undefined' && window.ethereum) {
      // Enhanced debug for multiple injected connectors
      const injectedConnectors = connectors.filter(
        (c) => c.name === 'Injected'
      );
      const currentConnectorIndex = injectedConnectors.findIndex(
        (c) => c.uid === connector.uid
      );
      console.log(
        `📝 Name: Processing injected connector ${
          currentConnectorIndex + 1
        } of ${injectedConnectors.length}`
      );

      // For multiple injected connectors, use index-based assignment
      if (injectedConnectors.length > 1) {
        console.log(
          '📝 Multiple injected connectors detected, using index-based assignment'
        );

        // First injected connector - assign to Brave if Brave browser
        if (
          currentConnectorIndex === 0 &&
          window.navigator?.userAgent?.includes('Brave')
        ) {
          console.log('✅ Name: First injected connector assigned to Brave');
          return 'Brave Wallet';
        }

        // Second injected connector - assign to Rabby
        if (currentConnectorIndex === 1) {
          console.log('✅ Name: Second injected connector assigned to Rabby');
          return 'Rabby Wallet';
        }

        // Third+ connectors - try to detect
        if (currentConnectorIndex >= 2) {
          console.log(
            '📝 Additional injected connector - using generic detection'
          );
          // Fall through to normal detection
        }
      }

      // Simple Brave detection first (fallback for single connector)
      if (window.navigator?.userAgent?.includes('Brave')) {
        return 'Brave Wallet';
      }

      if (window.ethereum.isBraveWallet) {
        return 'Brave Wallet';
      }

      if (window.navigator?.brave) {
        return 'Brave Wallet';
      }

      // Enhanced Rabby detection
      console.log('📝 Name Detection - Checking Rabby...');
      if (window.ethereum.isRabby) {
        console.log('✅ Name: Detected Rabby via isRabby');
        return 'Rabby Wallet';
      }

      if (window.rabby) {
        console.log('✅ Name: Detected Rabby via window.rabby');
        return 'Rabby Wallet';
      }

      if (
        window.ethereum.providers &&
        window.ethereum.providers.some((p) => p.isRabby)
      ) {
        console.log('✅ Name: Detected Rabby via providers array');
        return 'Rabby Wallet';
      }

      if (window.navigator?.userAgent?.toLowerCase().includes('rabby')) {
        console.log('✅ Name: Detected Rabby via userAgent');
        return 'Rabby Wallet';
      }

      if (window.ethereum._rabby || window.ethereum.rabbit) {
        console.log('✅ Name: Detected Rabby via specific properties');
        return 'Rabby Wallet';
      }

      // Check for MetaMask (but not Brave)
      if (window.ethereum.isMetaMask && !window.navigator?.brave) {
        return 'MetaMask (Injected)';
      }

      // Check for Coinbase
      if (window.ethereum.isCoinbaseWallet) {
        return 'Coinbase Wallet (Injected)';
      }

      return 'Browser Wallet';
    }
  }

  return name;
};

// Helper function to get unique wallets (remove duplicates)
const getUniqueConnectors = (connectors) => {
  const seen = new Set();
  return connectors.filter((connector) => {
    const displayName = getWalletDisplayName(connector, connectors);

    // Skip if we've already seen this wallet name
    if (seen.has(displayName)) {
      return false;
    }

    seen.add(displayName);
    return true;
  });
};

export function ConnectWallet() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [isOpen, setIsOpen] = useState(false);

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
    }
  };

  if (isConnected && address) {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="lg"
            className="flex items-center gap-2"
          >
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">{formatAddress(address)}</span>
            <span className="sm:hidden">Wallet</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Connected Wallet</span>
                {chain && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {chain.name}
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {address}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={copyAddress} className="cursor-pointer">
            <Copy className="h-4 w-4 mr-2" />
            Copy Address
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={`https://etherscan.io/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on Explorer
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="/app/profile" className="cursor-pointer">
              <Wallet className="h-4 w-4 mr-2" />
              Wallet Details
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => disconnect()}
            className="cursor-pointer text-destructive"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          size="lg"
          disabled={isPending}
          className="flex items-center gap-2"
        >
          <Wallet className="h-4 w-4" />
          {isPending ? 'Connecting...' : 'Connect Wallet'}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Choose Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {getUniqueConnectors(connectors).map((connector) => (
          <DropdownMenuItem
            key={connector.uid}
            onClick={() => connect({ connector })}
            disabled={isPending}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-3 w-full">
              <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 bg-gray-50 dark:bg-gray-800 rounded border">
                {getWalletIcon(connector, connectors) ? (
                  <Image
                    src={getWalletIcon(connector, connectors)}
                    alt={`${getWalletDisplayName(connector, connectors)} icon`}
                    width={24}
                    height={24}
                    className="w-5 h-5 object-contain object-center"
                    style={{
                      maxWidth: '20px',
                      maxHeight: '20px',
                      width: '20px',
                      height: '20px',
                    }}
                  />
                ) : (
                  <Wallet className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </div>
              <span>{getWalletDisplayName(connector, connectors)}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
