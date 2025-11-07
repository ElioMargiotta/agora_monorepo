'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useHyperliquidMarkets } from '@/hooks/protocols/hyperliquid';

const SymbolsContext = createContext();

export const SymbolsProvider = ({ children }) => {
    const { data: markets, loading, error, lastUpdate } = useHyperliquidMarkets();
  const [isUsingRealData, setIsUsingRealData] = useState(true);
  const [symbolsLoading, setSymbolsLoading] = useState(true);
  const [symbolsError, setSymbolsError] = useState(null);

  useEffect(() => {
    setSymbolsLoading(loading);
    setSymbolsError(error);
  }, [loading, error]);

  const value = {
    symbols: markets,
    isUsingRealData,
    symbolsLoading,
    symbolsError,
    setIsUsingRealData
  };

  return (
    <SymbolsContext.Provider value={value}>
      {children}
    </SymbolsContext.Provider>
  );
};

export const useSymbols = () => {
  const context = useContext(SymbolsContext);
  if (!context) {
    throw new Error('useSymbols must be used within a SymbolsProvider');
  }
  return context;
};

export default SymbolsProvider;
