// src/components/trade/SizeInput.jsx
'use client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';

export default function SizeInput({ size, setSize, markPx }) {
  const [mode, setMode] = useState('base'); // 'base' coin units, 'quote' USD size
  const quote = useMemo(() => (markPx && size ? Number(size) * Number(markPx) : ''), [size, markPx]);
  const baseFromQuote = (q) => (markPx ? String(Number(q) / Number(markPx)) : '');

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button type="button" variant={mode === 'base' ? 'default' : 'outline'} onClick={() => setMode('base')}>Coin</Button>
        <Button type="button" variant={mode === 'quote' ? 'default' : 'outline'} onClick={() => setMode('quote')}>USD</Button>
      </div>
      {mode === 'base' ? (
        <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
               type="number" min="0" step="any" value={size} onChange={(e) => setSize(e.target.value)} />
      ) : (
        <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
               type="number" min="0" step="any"
               value={quote}
               onChange={(e) => setSize(baseFromQuote(e.target.value))} />
      )}
      {markPx ? <div className="text-xs text-muted-foreground">Est. ${quote || '—'}</div> : null}
    </div>
  );
}
