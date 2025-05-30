'use client';

import { useState } from 'react';
import AssetSelector from './components/AssetSelector';
import AssetDetails from './components/AssetDetails';

export default function Home() {
  const [selectedAsset, setSelectedAsset] = useState(null);

  return (
    <main className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-indigo-600 mb-8">NEAR Intents</h1>
        
        <AssetSelector onAssetSelect={setSelectedAsset} />
        
        {selectedAsset && (
          <AssetDetails asset={selectedAsset} />
        )}
      </div>
    </main>
  );
}
