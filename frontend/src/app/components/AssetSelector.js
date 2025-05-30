'use client';

import { useState, useEffect } from 'react';

export default function AssetSelector({ onAssetSelect, onTokensLoaded }) {
  const [localTokens, setLocalTokens] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAssets() {
      try {
        const response = await fetch('https://bridge.chaindefuser.com/rpc', {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            "id": 1,
            "jsonrpc": "2.0",
            "method": "supported_tokens",
            "params": [
              {
                "chains": [], 
              }
            ]
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch assets');
        }

        const data = await response.json();
        setLocalTokens(data.result.tokens);
        onTokensLoaded(data.result.tokens);
      } catch (error) {
        console.error("Error fetching assets:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAssets();
  }, [onTokensLoaded]);

  // Get unique asset names
  const uniqueAssets = [...new Set(localTokens.map(token => token.asset_name))];

  if (error) {
    return (
      <div className="text-red-500 mb-6 bg-red-50 p-4 rounded-lg border border-red-200">
        {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-indigo-600 bg-indigo-50 p-4 rounded-lg mb-6">
        Loading assets...
      </div>
    );
  }

  return (
    <div className="mb-6">
      <label htmlFor="asset-select" className="block text-gray-600 mb-2">
        Select Asset:
      </label>
      <select
        id="asset-select"
        onChange={(event) => {
          const selectedToken = localTokens.find(token => 
            token.asset_name === event.target.value
          );
          onAssetSelect(selectedToken);
        }}
        className="block w-full max-w-xs px-3 py-2 bg-white border-2 border-indigo-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
      >
        <option value="">Select an asset...</option>
        {uniqueAssets.map((assetName) => (
          <option key={assetName} value={assetName}>
            {assetName}
          </option>
        ))}
      </select>
    </div>
  );
} 