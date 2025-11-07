import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function ErrorCard({ selectedPlatforms, hyperliquidData, extendedData, asterData, lighterData, paradexData }) {
  return (
    <Card className="border-destructive/20 shadow-lg bg-card/60 backdrop-blur-sm">
      <CardContent className="py-6 text-center">
        <div className="text-destructive mb-2">
          <AlertCircle className="h-6 w-6 mx-auto mb-1" />
          <p className="font-semibold text-sm">Failed to load funding data</p>
        </div>
        <div className="text-xs text-muted-foreground space-y-1 max-w-md mx-auto">
          {selectedPlatforms.includes('hyperliquid') && hyperliquidData.error && (<p>• Hyperliquid: {String(hyperliquidData.error)}</p>)}
          {selectedPlatforms.includes('extended') && extendedData.error && (<p>• Extended: {String(extendedData.error)}</p>)}
          {selectedPlatforms.includes('aster') && asterData.error && (<p>• Aster: {String(asterData.error)}</p>)}
          {selectedPlatforms.includes('lighter') && lighterData.error && (<p>• Lighter: {String(lighterData.error)}</p>)}
          {selectedPlatforms.includes('paradex') && paradexData.error && (<p>• Paradex: {String(paradexData.error)}</p>)}
        </div>
      </CardContent>
    </Card>
  );
}
