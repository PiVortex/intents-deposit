'use client';

import { useState } from 'react';
import TokenSelector from './components/TokenSelector';
import AssetDetails from './components/AssetDetails';
import DepositAddress from './components/DepositAddress';
import RecentDeposits from './components/RecentDeposits';
import DepositBalance from './components/DepositBalance';
import ViewContractBal from './components/ViewContractBal';
import LockInContract from './components/LockInContract';
import UnlockWithdrawToken from './components/UnlockWithdrawToken';
import WithdrawalStatus from './components/WithdrawalStatus';

export default function Home() {
  const [selectedToken, setSelectedToken] = useState(null);
  const [selectedTokenBalance, setSelectedTokenBalance] = useState(null);
  const [lastWithdrawalHash, setLastWithdrawalHash] = useState(null);
  const [mode, setMode] = useState('deposit');

  return (
    <main className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-indigo-600 mb-8">Multichain Deposit</h1>

        <div className="mb-8">
          <TokenSelector
            onChainSelect={setSelectedToken}
          />
          {selectedToken && (
            <>
          <AssetDetails asset={selectedToken} />
          <div className="mb-6" />
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <DepositBalance 
                selectedToken={selectedToken} 
                setBalance={setSelectedTokenBalance}
                balance={selectedTokenBalance}
              />
            </div>
            <div className="flex-1">
              <ViewContractBal 
                selectedToken={selectedToken}
              />
            </div>
          </div>
          <div className="mb-6" />
            </>
          )}
        </div>

        <div className="bg-gray-50 rounded-xl shadow-2xl border-2 border-indigo-200 p-8 mb-8">
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

          {selectedToken && mode === 'deposit' && (
            <div className="mt-8 space-y-4">
              <DepositAddress selectedToken={selectedToken} balance={selectedTokenBalance} />
              <RecentDeposits selectedToken={selectedToken} />
              <LockInContract selectedToken={selectedToken} />
            </div>
          )}

          {selectedToken && mode === 'withdraw' && (
            <div className="mt-8 space-y-4">
              <UnlockWithdrawToken selectedToken={selectedToken} onWithdraw={setLastWithdrawalHash} />
              <WithdrawalStatus withdrawalHash={lastWithdrawalHash} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
