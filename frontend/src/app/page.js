'use client';

import { useState } from 'react';
import AssetSelector from './components/AssetSelector';
import ChainSelector from './components/ChainSelector';
import AssetDetails from './components/AssetDetails';
import DepositAddress from './components/DepositAddress';
import RecentDeposits from './components/RecentDeposits';
import DepositBalance from './components/DepositBalance';
import ViewContractBal from './components/ViewContractBal';
import LockInContract from './components/LockInContract';

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
        <h1 className="text-4xl font-bold text-indigo-600 mb-8">Multichain Deposit</h1>
        
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <AssetSelector 
              onAssetSelect={handleAssetSelect}
              onTokensLoaded={setTokens}
            />
          </div>
          {selectedAsset && (
            <div className="flex-1">
              <ChainSelector 
                tokens={tokens}
                selectedAsset={selectedAsset}
                onChainSelect={setSelectedToken}
              />
            </div>
          )}
        </div>
        
        {selectedAsset && (
          <>
            {selectedToken && (
              <>
                <AssetDetails asset={selectedToken} />
                <div className="mt-8 space-y-4">
                  <DepositAddress selectedAsset={selectedToken} />
                  <RecentDeposits selectedAsset={selectedToken} />
                  <DepositBalance 
                    tokenId={selectedToken.near_token_id} 
                    decimals={selectedToken.decimals}
                  />
                  <LockInContract tokenId={selectedToken.near_token_id} />
                  <ViewContractBal 
                      tokenId={selectedToken.near_token_id}
                      decimals={selectedToken.decimals}
                    />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
