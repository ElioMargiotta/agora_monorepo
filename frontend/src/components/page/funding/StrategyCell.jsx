export default function StrategyCell({ longPlatform, shortPlatform, meta }) {
  return (
    <div className="mt-2 flex items-center justify-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-muted-foreground hidden sm:inline">Long</span>
        {longPlatform ? (
          <img src={meta[longPlatform].image} alt={meta[longPlatform].name} title={meta[longPlatform].name} className="h-5 w-5 rounded" />
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-muted-foreground hidden sm:inline">Short</span>
        {shortPlatform ? (
          <img src={meta[shortPlatform].image} alt={meta[shortPlatform].name} title={meta[shortPlatform].name} className="h-5 w-5 rounded" />
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </div>
    </div>
  );
}
