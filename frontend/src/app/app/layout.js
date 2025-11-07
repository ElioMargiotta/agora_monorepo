import { AppNavBar } from '@/components/app/AppNavBar';
import { BottomNavBar } from '@/components/app/BottomNavBar';
import { SafeArea } from '@coinbase/onchainkit/minikit';

// dApp shell layout with navbar and bottom navigation
export default function AppLayout({ children }) {
  return (
    <SafeArea>
      <div className="min-h-screen bg-background">
        <AppNavBar />
        <main className="flex-1 pb-20 md:pb-4">{children}</main>
        <BottomNavBar />
      </div>
    </SafeArea>
  );
}
