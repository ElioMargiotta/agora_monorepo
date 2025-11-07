// src/components/trade/SideTabs.jsx
'use client';
import { Button } from '@/components/ui/button';

export default function SideTabs({ isBuy, onChange }) {
  return (
    <div className="flex gap-2">
      <Button type="button" variant={isBuy ? 'default' : 'outline'} onClick={() => onChange(true)}>Buy</Button>
      <Button type="button" variant={!isBuy ? 'destructive' : 'outline'} onClick={() => onChange(false)}>Sell</Button>
    </div>
  );
}
