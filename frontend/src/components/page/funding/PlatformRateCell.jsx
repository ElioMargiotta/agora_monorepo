import { cn } from '@/lib/utils';

export default function PlatformRateCell({ valuePerUnit, isRowMax, isRowMin, oiUsd, volUsd, formatPct, formatNumber, rateColor }) {
  return (
    <div className="space-y-1 text-center">
      <div className={cn(
        'font-mono font-bold text-sm tabular-nums',
        rateColor(valuePerUnit),
        isRowMax && 'underline decoration-emerald-400 decoration-2 underline-offset-4',
        isRowMin && 'underline decoration-red-400 decoration-2 underline-offset-4'
      )}>
        {formatPct(valuePerUnit, 4)}
      </div>
      <div className="text-[11px] leading-tight">
        {oiUsd != null ? <span className="text-muted-foreground">OI ${formatNumber(oiUsd)}</span> : <span className="text-red-400/80">OI —</span>}
      </div>
      <div className="text-[11px] leading-tight">
        {volUsd != null ? <span className="text-muted-foreground">Vol ${formatNumber(volUsd)}</span> : <span className="text-red-400/80">Vol —</span>}
      </div>
    </div>
  );
}
