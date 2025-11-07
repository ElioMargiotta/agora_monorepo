import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ChainSwitcher } from '@/components/wallet/ChainSwitcher';
import { DesktopFallback } from '@/components/ui/ComingSoon';
import { 
  Bell, 
  Shield, 
  Palette, 
  Globe,
  HelpCircle,
  LogOut,
  ChevronRight
} from 'lucide-react';

// Settings page for user preferences
export default function SettingsPage() {
  const settingsContent = (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your app preferences and account settings
          </p>
        </div>

        {/* Appearance */}
        <Card className="p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4">Appearance</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Palette className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Theme</p>
                  <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </Card>

        {/* Network */}
        <Card className="p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4">Network</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Blockchain Network</p>
                  <p className="text-sm text-muted-foreground">Select your preferred network</p>
                </div>
              </div>
              <ChainSwitcher />
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4">Notifications</h2>
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              className="w-full justify-between h-auto p-4"
              size="touch"
            >
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Manage notification preferences</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* Security & Privacy */}
        <Card className="p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4">Security & Privacy</h2>
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              className="w-full justify-between h-auto p-4"
              size="touch"
            >
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="font-medium">Privacy Settings</p>
                  <p className="text-sm text-muted-foreground">Manage your data and privacy</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* Help & Support */}
        <Card className="p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4">Help & Support</h2>
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              className="w-full justify-between h-auto p-4"
              size="touch"
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="font-medium">Help Center</p>
                  <p className="text-sm text-muted-foreground">Get support and documentation</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        <Separator />

        {/* Sign Out */}
        <div className="pt-4">
          <Button 
            variant="outline" 
            className="w-full"
            size="lg"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <DesktopFallback 
      comingSoonTitle="Settings Coming Soon!"
      comingSoonDescription="We're developing a powerful settings interface for mobile. Customize your trading preferences, notifications, security settings, and more!"
    >
      {settingsContent}
    </DesktopFallback>
  );
}
