import { useState, useEffect } from 'react';
import { useMultichain, getAllFundingRateSources } from '@/hooks/useMultichain';
import { ChainSwitcher } from '@/components/wallet/ChainSwitcher';

export default function MultichainFundingComparison() {
  const { currentChain, isConnected, getFundingProtocolsForChain } = useMultichain();
  const [selectedChain, setSelectedChain] = useState(null);
  const [fundingData, setFundingData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mock funding data - replace with actual API calls
  const mockFundingRates = {
    'GMX V2': [
      { pair: 'ETH-USD', rate: 0.0125, volume: '$2.4M', chainId: 42161 },
      { pair: 'BTC-USD', rate: 0.0089, volume: '$1.8M', chainId: 42161 },
    ],
    'Gains Network': [
      { pair: 'ETH-USD', rate: 0.0134, volume: '$890K', chainId: 42161 },
      { pair: 'BTC-USD', rate: 0.0098, volume: '$650K', chainId: 137 },
    ],
    'dYdX V4': [
      { pair: 'ETH-USD', rate: 0.0119, volume: '$5.2M', chainId: 1 },
      { pair: 'BTC-USD', rate: 0.0085, volume: '$4.1M', chainId: 1 },
    ],
    'Hyperliquid': [
      { pair: 'ETH-USD', rate: 0.0142, volume: '$12.4M', chainId: 'universal' },
      { pair: 'BTC-USD', rate: 0.0091, volume: '$8.7M', chainId: 'universal' },
    ],
  };

  useEffect(() => {
    if (!selectedChain) {
      // Load data from all chains
      setLoading(true);
      const allSources = getAllFundingRateSources();
      const aggregatedData = [];
      
      allSources.forEach(source => {
        if (mockFundingRates[source.name]) {
          aggregatedData.push(...mockFundingRates[source.name].map(rate => ({
            ...rate,
            protocol: source.name,
            url: source.url,
            supported: source.supported,
          })));
        }
      });
      
      setFundingData(aggregatedData);
      setLoading(false);
    } else {
      // Load data for specific chain
      setLoading(true);
      const chainProtocols = getFundingProtocolsForChain(selectedChain);
      const chainData = [];
      
      chainProtocols.forEach(protocol => {
        if (mockFundingRates[protocol]) {
          chainData.push(...mockFundingRates[protocol]
            .filter(rate => rate.chainId === selectedChain || rate.chainId === 'universal')
            .map(rate => ({
              ...rate,
              protocol,
              supported: true,
            }))
          );
        }
      });
      
      setFundingData(chainData);
      setLoading(false);
    }
  }, [selectedChain, getFundingProtocolsForChain]);

  const handleChainFilter = (chainId) => {
    setSelectedChain(chainId === selectedChain ? null : chainId);
  };

  const getChainIcon = (chainId) => {
    const chainMap = {
      1: '/chain-icons/eth.svg', // Ethereum
      42161: '/chain-icons/arb.svg', // Arbitrum
      10: '/chain-icons/op.svg', // Optimism
      8453: '/chain-icons/base.svg', // Base
      137: '/chain-icons/matic.svg', // Polygon
      56: '/chain-icons/bnb.svg', // BSC
      'universal': '🌐', // Cross-chain (keep emoji for universal)
    };
    return chainMap[chainId] || '❓';
  };

  const getChainName = (chainId) => {
    const chainMap = {
      1: 'Ethereum',
      42161: 'Arbitrum',
      10: 'Optimism',
      8453: 'Base',
      137: 'Polygon',
      56: 'BSC',
      'universal': 'Universal',
    };
    return chainMap[chainId] || 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Multichain Funding Rates
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Compare funding rates across different networks and protocols
          </p>
        </div>
        
        {isConnected && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Connected to:</span>
            <ChainSwitcher />
          </div>
        )}
      </div>

      {/* Chain Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedChain(null)}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            !selectedChain
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          All Chains
        </button>
        
        {[1, 42161, 10, 8453, 137, 56].map(chainId => (
          <button
            key={chainId}
            onClick={() => handleChainFilter(chainId)}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-colors ${
              selectedChain === chainId
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {typeof getChainIcon(chainId) === 'string' && getChainIcon(chainId).startsWith('/') ? (
              <img 
                src={getChainIcon(chainId)} 
                alt={getChainName(chainId)}
                className="w-4 h-4"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <span>{getChainIcon(chainId)}</span>
            )}
            <span>{getChainName(chainId)}</span>
          </button>
        ))}
      </div>

      {/* Funding Rates Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {selectedChain ? `${getChainName(selectedChain)} Funding Rates` : 'All Chains Funding Rates'}
          </h3>
        </div>

        {loading ? (
          <div className="px-6 py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading funding rates...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Pair
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Protocol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Chain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Funding Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    24h Volume
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {fundingData.map((rate, index) => (
                  <tr key={`${rate.protocol}-${rate.pair}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {rate.pair}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <a 
                        href={rate.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {rate.protocol}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        {typeof getChainIcon(rate.chainId) === 'string' && getChainIcon(rate.chainId).startsWith('/') ? (
                          <img 
                            src={getChainIcon(rate.chainId)} 
                            alt={getChainName(rate.chainId)}
                            className="w-4 h-4"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span>{getChainIcon(rate.chainId)}</span>
                        )}
                        <span>{getChainName(rate.chainId)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${
                        rate.rate > 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {rate.rate > 0 ? '+' : ''}{(rate.rate * 100).toFixed(3)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {rate.volume}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        rate.supported
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                      }`}>
                        {rate.supported ? 'Live' : 'Coming Soon'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Chain Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 42161, 10, 8453, 137, 56].map(chainId => {
          const chainData = fundingData.filter(rate => rate.chainId === chainId);
          const avgRate = chainData.length > 0 
            ? chainData.reduce((sum, rate) => sum + rate.rate, 0) / chainData.length 
            : 0;
          
          return (
            <div 
              key={chainId}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-center gap-3 mb-2">
                {typeof getChainIcon(chainId) === 'string' && getChainIcon(chainId).startsWith('/') ? (
                  <img 
                    src={getChainIcon(chainId)} 
                    alt={getChainName(chainId)}
                    className="w-5 h-5"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-lg">{getChainIcon(chainId)}</span>
                )}
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {getChainName(chainId)}
                </h4>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Protocols:</span>
                  <span className="text-gray-900 dark:text-white">{chainData.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Avg Rate:</span>
                  <span className={`font-medium ${
                    avgRate > 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {avgRate > 0 ? '+' : ''}{(avgRate * 100).toFixed(3)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}