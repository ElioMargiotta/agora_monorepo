'use client';

import { useState, useEffect } from 'react';
import { useAsterMarkets } from '@/hooks/protocols/aster';
import ProtocolSelector from '@/components/dashboard/ProtocolSelector';

export default function ProtocolDashboard() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const { markets: availableSymbols, loading } = useAsterMarkets();

  return (
    <div className="min-h-screen bg-gray-50">
      <ProtocolSelector
        symbol={symbol}
        onSymbolChange={setSymbol}
        availableSymbols={availableSymbols.length > 0 ? availableSymbols.slice(0, 20) : ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT']}
      />
    </div>
  );
}
