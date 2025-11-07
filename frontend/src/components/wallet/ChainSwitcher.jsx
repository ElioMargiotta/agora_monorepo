'use client';

import { useAccount, useSwitchChain } from 'wagmi';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Check } from 'lucide-react';
import { supportedChains } from '@/lib/wagmi';
import { useEffect, useState } from 'react';

export function ChainSwitcher() {
  const { chain } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || !chain) {
    return null;
  }

  const currentChain = supportedChains[chain.id];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          {currentChain && (
            <>
              <img 
                src={currentChain.icon} 
                alt={currentChain.name}
                className="w-4 h-4"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <span className="hidden sm:inline">{currentChain.shortName}</span>
            </>
          )}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 dropdown-solid selection-interface">
        <DropdownMenuLabel className="text-foreground font-semibold">Switch Network</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.entries(supportedChains).map(([chainId, chainInfo]) => (
          <DropdownMenuItem
            key={chainId}
            onClick={() => switchChain({ chainId: parseInt(chainId) })}
            disabled={isPending || chain.id === parseInt(chainId)}
            className={`cursor-pointer px-3 py-2 ${
              chain.id === parseInt(chainId) 
                ? 'bg-primary/10 text-primary font-medium' 
                : 'hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <img 
                  src={chainInfo.icon} 
                  alt={chainInfo.name}
                  className="w-5 h-5"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div className="flex flex-col">
                  <span className="font-medium">{chainInfo.name}</span>
                  <span className="text-xs text-muted-foreground">{chainInfo.shortName}</span>
                </div>
              </div>
              {chain.id === parseInt(chainId) && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
