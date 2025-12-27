'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Plus,
  Search,
  TrendingUp
} from 'lucide-react';

const bottomNavItems = [
  {
    href: '/app',
    icon: LayoutDashboard,
    label: 'Dashboard',
    exactMatch: true,
    comingSoon: false,
  },
  {
    href: '/app/spaces/my',
    icon: Users,
    label: 'My Spaces',
    exactMatch: false,
    comingSoon: false,
  },
  {
    href: '/app/prediction',
    icon: TrendingUp,
    label: 'Markets',
    exactMatch: false,
    comingSoon: false,
  },
  {
    href: '/app/spaces/create',
    icon: Plus,
    label: 'Create',
    exactMatch: false,
    comingSoon: false,
  },
  {
    href: '/app/spaces',
    icon: Search,
    label: 'Explore',
    exactMatch: false,
    comingSoon: false,
  },
];

export function BottomNavBar() {
  const pathname = usePathname();

  const isActiveRoute = (item) => {
    if (item.exactMatch) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border supports-[backdrop-filter]:bg-background/80 md:hidden">
        <div className="flex items-center justify-around px-2 py-2">
          {bottomNavItems.map((item) => {
            const isActive = isActiveRoute(item);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all duration-200 min-h-[44px] min-w-[44px] cursor-pointer', // 44px minimum touch target
                  'hover:bg-muted/50 active:scale-95',
                  isActive 
                    ? 'text-primary bg-primary/10' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div className="relative">
                  <Icon className={cn(
                    'h-5 w-5 mb-1',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )} />
                </div>
                
                <span className={cn(
                  'text-xs font-medium',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}