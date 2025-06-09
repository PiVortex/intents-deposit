'use client';

import { useState, useEffect } from 'react';
import { useWalletSelector } from '@near-wallet-selector/react-hook';
import { formatDecimalAmount } from '../../utils/format';

export default function DepositBalance({ selectedToken, setBalance, balance }) {
  const { signedAccountId, viewFunction } = useWalletSelector();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!signedAccountId || !selectedToken) {
      setBalance(null);
      setIsLoading(false);
      return;
    }

    const checkBalance = async () => {
      try {
        // Make a view call to the intents contract to get the balance of the token
        const balance = await viewFunction({
          contractId: 'intents.near',
          method: 'mt_balance_of',
          args: {
            account_id: signedAccountId,
            token_id: selectedToken.intents_token_id
          }
        });

        setBalance(balance);
        setError(null);
      } catch (error) {
        console.error('Error checking balance:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    checkBalance();
    const intervalId = setInterval(checkBalance, 5000);
    return () => {
      clearInterval(intervalId);
    };
  }, [signedAccountId, selectedToken, viewFunction, setBalance, balance]);

  if (!signedAccountId) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-100">
        <h3 className="text-lg font-semibold text-indigo-600 mb-2">Token Balance</h3>
        <div className="text-gray-700">
          <div className="font-mono">0</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-100">
        <h3 className="text-lg font-semibold text-indigo-600 mb-2">Token Balance</h3>
        <div className="text-gray-700">
          <div className="font-mono">0</div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-100">
        <h3 className="text-lg font-semibold text-indigo-600 mb-2">Token Balance</h3>
        <div className="text-gray-700">
          <div className="font-mono">0</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-100">
      <h3 className="text-lg font-semibold text-indigo-600 mb-2">Token Balance</h3>
      <div className="text-gray-700">
        <div className="space-y-1">
          <div className="font-mono">{formatDecimalAmount(balance, selectedToken.decimals)}</div>
        </div>
      </div>
    </div>
  );
} 