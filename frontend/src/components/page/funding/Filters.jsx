import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

export default function Filters({ onlyDiff, setOnlyDiff, onlyFavs, setOnlyFavs, minAprPct, setMinAprPct, minOI, setMinOI, minVol, setMinVol, onReset }) {
  return (
    <div className="space-y-4 p-3 max-w-full">
      {/* Toggle Filters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-4 bg-gray-800/60 border border-gray-700/50 rounded-lg min-h-[48px]">
          <div className="flex-1 pr-3">
            <label htmlFor="only-favs" className="text-sm font-semibold text-white block leading-tight tracking-wide">
              Show favorites only
            </label>
            <span className="text-xs text-gray-300">Display only starred assets</span>
          </div>
          <Checkbox id="only-favs" checked={onlyFavs} onCheckedChange={(v) => setOnlyFavs(Boolean(v))} className="flex-shrink-0" />
        </div>
        
        <div className="flex items-center justify-between p-4 bg-gray-800/60 border border-gray-700/50 rounded-lg min-h-[48px]">
          <div className="flex-1 pr-3">
            <label htmlFor="apply-filters" className="text-sm font-semibold text-white block leading-tight tracking-wide">
              Apply filters
            </label>
            <span className="text-xs text-gray-300">Enable/disable number filters below</span>
          </div>
          <Checkbox id="apply-filters" checked={onlyDiff} onCheckedChange={(v) => setOnlyDiff(Boolean(v))} className="flex-shrink-0" />
        </div>
      </div>

      {/* Number Filters */}
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="space-y-2">
            <label htmlFor="min-apr" className="text-sm font-semibold text-white tracking-wide">Min APR (%)</label>
            <Input
              id="min-apr"
              type="number"
              step="0.1"
              min={0}
              className="h-12 w-full bg-gray-800/60 border-gray-700/50 text-white text-base"
              value={minAprPct}
              onChange={(e) => setMinAprPct(e.target.value)}
              placeholder="e.g. 10"
            />
            <p className="text-xs text-gray-300">Annual percentage rate threshold</p>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="minOI" className="text-sm font-semibold text-white tracking-wide">Min Open Interest</label>
            <Input
              id="minOI"
              type="number"
              placeholder="e.g. 1000000"
              value={minOI}
              onChange={(e) => setMinOI(e.target.value)}
              className="h-12 w-full bg-gray-800/60 border-gray-700/50 text-white text-base"
            />
            <p className="text-xs text-gray-300">Minimum open interest in USD</p>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="minVol" className="text-sm font-semibold text-white tracking-wide">Min Volume (24h)</label>
            <Input
              id="minVol"
              type="number"
              placeholder="e.g. 5000000"
              value={minVol}
              onChange={(e) => setMinVol(e.target.value)}
              className="h-12 w-full bg-gray-800/60 border-gray-700/50 text-white text-base"
            />
            <p className="text-xs text-gray-300">Minimum 24h trading volume in USD</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={onReset} className="flex-1">
          Reset Filters
        </Button>
      </div>
    </div>
  );
}
