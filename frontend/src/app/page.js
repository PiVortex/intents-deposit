'use client';

import { useState } from 'react';
import TokenSelector from './components/TokenSelector';
import AssetDetails from './components/AssetDetails';
import DepositAddress from './components/DepositAddress';
import RecentDeposits from './components/RecentDeposits';
import DepositBalance from './components/DepositBalance';
import ViewContractBal from './components/ViewContractBal';
import LockInContract from './components/LockInContract';
import UnlockToken from './components/UnlockToken';
import WithdrawToken from './components/WithdrawToken';

export default function Home() {
  const [tokens, setTokens] = useState([]);
  const [selectedToken, setSelectedToken] = useState(null);
  const [selectedTokenBalance, setSelectedTokenBalance] = useState(null);

  return (
    <main className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-indigo-600 mb-8">Multichain Deposit</h1>

        <div className="mb-8">
          <TokenSelector
            onChainSelect={setSelectedToken}
            onTokensLoaded={setTokens}
          />
          {selectedToken && (
            <>
              <AssetDetails asset={selectedToken} />
              <div className="mt-8 space-y-4">
                <DepositAddress selectedAsset={selectedToken} />
                <RecentDeposits selectedAsset={selectedToken} />
                <DepositBalance 
                  tokenId={selectedToken.intents_token_id} 
                  decimals={selectedToken.decimals}
                  onBalanceChange={setSelectedTokenBalance}
                />
                <LockInContract tokenId={selectedToken.intents_token_id} />
                <ViewContractBal 
                    tokenId={selectedToken.intents_token_id}
                    decimals={selectedToken.decimals}
                  />
              <UnlockToken selectedToken={selectedToken.intents_token_id} />
              <WithdrawToken selectedToken={selectedToken} balance={selectedTokenBalance} />

              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
