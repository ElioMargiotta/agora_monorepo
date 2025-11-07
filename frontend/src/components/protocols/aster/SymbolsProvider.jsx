'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAsterMarkets } from '../../../hooks/protocols/aster';

const SymbolsContext = createContext();

export const useSymbols = () => {
  const context = useContext(SymbolsContext);
  if (!context) {
    throw new Error('useSymbols must be used within a SymbolsProvider');
  }
  return context;
};

export default function SymbolsProvider({ children }) {
  const { markets, loading, error } = useAsterMarkets();
  
  // Extract symbols from markets data
  const symbols = markets?.map(market => market.symbol) || [];
  const isUsingRealData = !error && !loading && symbols.length > 0;

  return (
    <SymbolsContext.Provider value={{
      symbols,
      isUsingRealData,
      symbolsLoading: loading,
      symbolsError: error,
      markets
    }}>
      {typeof children === 'function' 
        ? children({ symbols, isUsingRealData, symbolsLoading: loading, symbolsError: error })
        : children
      }
    </SymbolsContext.Provider>
  );
}
