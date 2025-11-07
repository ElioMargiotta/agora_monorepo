'use client';

import { useState } from 'react';

const ProtocolSelector = ({ symbol, onSymbolChange, availableSymbols = [] }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Protocol Dashboard</h2>
      
      <div className="mb-4">
        <label htmlFor="symbol-select" className="block text-sm font-medium text-gray-700 mb-2">
          Select Trading Pair
        </label>
        <select
          id="symbol-select"
          value={symbol}
          onChange={(e) => onSymbolChange(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          {availableSymbols.map((symbolOption) => (
            <option key={symbolOption} value={symbolOption}>
              {symbolOption}
            </option>
          ))}
        </select>
      </div>
      
      <div className="text-sm text-gray-500">
        Currently viewing: <span className="font-medium text-gray-900">{symbol}</span>
      </div>
    </div>
  );
};

export default ProtocolSelector;