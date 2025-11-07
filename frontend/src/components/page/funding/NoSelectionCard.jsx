import { Card, CardContent } from '@/components/ui/card';
import { EyeOff } from 'lucide-react';

export default function NoSelectionCard() {
  return (
    <Card className="border-border shadow-lg bg-card/60 backdrop-blur-sm">
      <CardContent className="py-12 text-center">
        <div className="text-muted-foreground mb-4">
          <EyeOff className="h-8 w-8 mx-auto mb-3 opacity-70" />
          <p className="font-semibold text-sm">No platforms selected</p>
        </div>
        <p className="text-xs text-muted-foreground">Select platforms to view funding rates</p>
      </CardContent>
    </Card>
  );
}
