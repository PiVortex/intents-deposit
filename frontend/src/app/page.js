'use client';

import { useState, useEffect } from 'react';
import AssetDetails from './components/AssetDetails';
import AssetSelector from './components/AssetSelector';

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
        console.log('Received tokens in frontend:', data.length);
        console.log('Token identifiers:', data.map(t => t.defuse_asset_identifier));
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
          <AssetSelector 
            tokens={tokens} 
            onAssetSelect={setSelectedAsset} 
          />
        )}

        <AssetDetails asset={selectedAsset} />
      </div>
    </div>
  );
}
