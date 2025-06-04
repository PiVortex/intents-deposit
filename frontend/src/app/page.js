'use client';

import { useState } from 'react';
import TokenSelector from './components/TokenSelector';
import AssetDetails from './components/AssetDetails';
import DepositAddress from './components/DepositAddress';
import RecentDeposits from './components/RecentDeposits';
import DepositBalance from './components/DepositBalance';
import ViewContractBal from './components/ViewContractBal';
import LockInContract from './components/LockInContract';
import UsersLockedTokens from './components/UsersLockedTokens';
import WithdrawToken from './components/WithdrawToken';

export default function Home() {
  const [tokens, setTokens] = useState([]);
  const [selectedToken, setSelectedToken] = useState(null);
  const [selectedWithdrawToken, setSelectedWithdrawToken] = useState(null);
  const [mode, setMode] = useState('deposit'); 

  return (
    <main className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-indigo-600 mb-8">Multichain Deposit</h1>

        <div className="flex justify-center gap-8 mb-8">
          <button
            className={`flex-1 px-6 py-3 text-lg rounded-lg font-semibold border transition-colors duration-150 ${mode === 'deposit' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'}`}
            onClick={() => setMode('deposit')}
          >
            Deposit
          </button>
          <button
            className={`flex-1 px-6 py-3 text-lg rounded-lg font-semibold border transition-colors duration-150 ${mode === 'withdraw' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'}`}
            onClick={() => setMode('withdraw')}
          >
            Withdraw
          </button>
        </div>

        {mode === 'deposit' && (
          <>
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
                  />
                  <LockInContract tokenId={selectedToken.intents_token_id} />
                  <ViewContractBal 
                      tokenId={selectedToken.intents_token_id}
                      decimals={selectedToken.decimals}
                    />
                </div>
              </>
            )}
          </>
        )}
        {mode === 'withdraw' && (
          <div className="space-y-4">
            <UsersLockedTokens 
              tokens={tokens} 
              selectedToken={selectedWithdrawToken}
              onTokenSelect={setSelectedWithdrawToken}
            />
            <WithdrawToken selectedToken={selectedWithdrawToken} />
          </div>
        )}
      </div>
    </main>
  );
}
