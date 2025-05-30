'use client';

import { useEffect } from 'react';
import { getChainDisplayName } from '../../utils/chainNames';

export default function ChainSelector({ tokens, selectedAsset, onChainSelect }) {
  if (!selectedAsset) return null;

  // Get all tokens with the same asset name
  const availableChains = tokens.filter(token => token.asset_name === selectedAsset.asset_name);

  // Use useEffect to handle automatic chain selection
  useEffect(() => {
    if (availableChains.length === 1) {
      onChainSelect(availableChains[0]);
    }
  }, [availableChains, onChainSelect]);

  // If there's only one chain available, just display it
  if (availableChains.length === 1) {
    const chain = availableChains[0].defuse_asset_identifier.split(':').slice(0, 2).join(':');
    return (
      <div className="mb-6">
        <div className="text-gray-600 mb-2">Chain:</div>
        <div className="px-3 py-2 bg-gray-50 border-2 border-indigo-200 rounded-md text-gray-700">
          {getChainDisplayName(chain)}
        </div>
      </div>
    );
  }

  // If there are multiple chains, show a dropdown
  return (
    <div className="mb-6">
      <label htmlFor="chain-select" className="block text-gray-600 mb-2">
        Select Chain:
      </label>
      <select
        id="chain-select"
        onChange={(event) => {
          const selectedToken = tokens.find(token => 
            token.defuse_asset_identifier === event.target.value
          );
          onChainSelect(selectedToken);
        }}
        className="block w-full max-w-xs px-3 py-2 bg-white border-2 border-indigo-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
      >
        <option value="">Select a chain...</option>
        {availableChains.map((token) => {
          const chain = token.defuse_asset_identifier.split(':').slice(0, 2).join(':');
          return (
            <option 
              key={token.defuse_asset_identifier} 
              value={token.defuse_asset_identifier}
            >
              {getChainDisplayName(chain)}
            </option>
          );
        })}
      </select>
    </div>
  );
} 