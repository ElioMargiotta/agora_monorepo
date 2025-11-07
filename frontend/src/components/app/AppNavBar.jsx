import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { OnchainWallet } from '@/components/wallet/OnchainWallet';

export function AppNavBar() {
  return (
    <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2">
          <a className="flex items-center space-x-2" href="/app/zama-game">
            <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              Zama Voting Game
            </span>
          </a>
        </div>
        <div className="flex items-center space-x-2 md:space-x-3">
          <div className="hidden md:flex items-center space-x-3">
            <ThemeToggle />
          </div>
          <OnchainWallet />
        </div>
      </div>
    </nav>
  );
}
