'use client';

import { useState } from 'react';
import AssetSelector from './components/AssetSelector';
import ChainSelector from './components/ChainSelector';
import AssetDetails from './components/AssetDetails';
import DepositAddress from './components/DepositAddress';

export default function Home() {
  const [tokens, setTokens] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedToken, setSelectedToken] = useState(null);

  const handleAssetSelect = (asset) => {
    setSelectedAsset(asset);
    setSelectedToken(null); 
  };

  return (
    <main className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-indigo-600 mb-8">NEAR Intents</h1>
        
        <AssetSelector 
          onAssetSelect={handleAssetSelect}
          onTokensLoaded={setTokens}
        />
        
        {selectedAsset && (
          <>
            <ChainSelector 
              tokens={tokens}
              selectedAsset={selectedAsset}
              onChainSelect={setSelectedToken}
            />
            
            {selectedToken && (
              <>
                <AssetDetails asset={selectedToken} />
                <DepositAddress selectedAsset={selectedToken} />
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
