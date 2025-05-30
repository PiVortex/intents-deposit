'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [tokens, setTokens] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAssets() {
      try {
        const response = await fetch('/api/assets');
        if (!response.ok) {
          throw new Error('Failed to fetch assets');
        }
        const data = await response.json();
        setTokens(data);
      } catch (error) {
        console.error("Error fetching assets:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAssets();
  }, []);

  const handleAssetSelect = (event) => {
    const selectedToken = tokens.find(token => token.asset_name === event.target.value);
    setSelectedAsset(selectedToken);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-indigo-600">NEAR Intents</h1>

        {error && (
          <div className="text-red-500 mb-6 bg-red-50 p-4 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-indigo-600 bg-indigo-50 p-4 rounded-lg">Loading assets...</div>
        ) : (
          <div className="mb-6">
            <select
              id="asset-select"
              onChange={handleAssetSelect}
              className="block w-full max-w-xs px-3 py-2 bg-white border-2 border-indigo-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
            >
              <option value="">Select an asset...</option>
              {tokens.map((token) => (
                <option key={token.defuse_asset_identifier} value={token.asset_name}>
                  {token.asset_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedAsset && (
          <div className="bg-indigo-50 shadow-lg rounded-lg p-6 border-2 border-indigo-100">
            <h2 className="text-xl font-semibold mb-4 text-indigo-600">Selected Asset Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-md shadow-sm">
                <p className="text-sm text-indigo-500">Asset Name</p>
                <p className="font-medium text-gray-700">{selectedAsset.asset_name}</p>
              </div>
              <div className="bg-white p-3 rounded-md shadow-sm">
                <p className="text-sm text-indigo-500">Asset Identifier</p>
                <p className="font-medium text-gray-700">{selectedAsset.defuse_asset_identifier}</p>
              </div>
              <div className="bg-white p-3 rounded-md shadow-sm">
                <p className="text-sm text-indigo-500">Decimals</p>
                <p className="font-medium text-gray-700">{selectedAsset.decimals}</p>
              </div>
              <div className="bg-white p-3 rounded-md shadow-sm">
                <p className="text-sm text-indigo-500">Min Deposit</p>
                <p className="font-medium text-gray-700">{selectedAsset.min_deposit_amount}</p>
              </div>
              <div className="bg-white p-3 rounded-md shadow-sm">
                <p className="text-sm text-indigo-500">Min Withdrawal</p>
                <p className="font-medium text-gray-700">{selectedAsset.min_withdrawal_amount}</p>
              </div>
              <div className="bg-white p-3 rounded-md shadow-sm">
                <p className="text-sm text-indigo-500">Withdrawal Fee</p>
                <p className="font-medium text-gray-700">{selectedAsset.withdrawal_fee}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
