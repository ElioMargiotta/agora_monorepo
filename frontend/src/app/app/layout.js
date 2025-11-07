import { AppNavBar } from '@/components/app/AppNavBar';
import { BottomNavBar } from '@/components/app/BottomNavBar';

// dApp shell layout with navbar and bottom navigation
export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      <AppNavBar />
      <main className="flex-1 pb-20 md:pb-4">{children}</main>
      <BottomNavBar />
    </div>
  );
}
