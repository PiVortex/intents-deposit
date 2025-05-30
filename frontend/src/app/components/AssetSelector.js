'use client';

import { useState, useEffect } from 'react';

export default function AssetSelector({ tokens, onAssetSelect }) {
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
      } catch (error) {
        console.error("Error fetching assets:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAssets();
  }, []);

  // Group tokens by asset name
  const groupedTokens = localTokens.reduce((acc, token) => {
    const name = token.asset_name;
    if (!acc[name]) {
      acc[name] = [];
    }
    acc[name].push(token);
    return acc;
  }, {});

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
      <select
        id="asset-select"
        onChange={(event) => {
          const [name, identifier] = event.target.value.split('|');
          const selectedToken = localTokens.find(token => 
            token.asset_name === name && 
            token.defuse_asset_identifier === identifier
          );
          onAssetSelect(selectedToken);
        }}
        className="block w-full max-w-xs px-3 py-2 bg-white border-2 border-indigo-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
      >
        <option value="">Select an asset...</option>
        {Object.entries(groupedTokens).map(([name, tokens]) => (
          <optgroup key={name} label={name}>
            {tokens.map((token) => {
              // Extract chain from identifier (e.g., "eth:1" from "eth:1:0x...")
              const chain = token.defuse_asset_identifier.split(':').slice(0, 2).join(':');
              return (
                <option 
                  key={token.defuse_asset_identifier} 
                  value={`${name}|${token.defuse_asset_identifier}`}
                >
                  {chain}
                </option>
              );
            })}
          </optgroup>
        ))}
      </select>
    </div>
  );
} 