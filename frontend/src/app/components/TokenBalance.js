'use client';

import { useState, useEffect } from 'react';
import { useWalletSelector } from '@near-wallet-selector/react-hook';

export default function TokenBalance({ tokenId, decimals }) {
  const { signedAccountId, viewFunction } = useWalletSelector();
  const [balance, setBalance] = useState(null);
  const [standard, setStandard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!signedAccountId || !tokenId) return;

    const checkBalance = async () => {
      try {
        // Try NEP-141 first
        const nep141Balance = await viewFunction({
          contractId: 'intents.near',
          method: 'mt_balance_of',
          args: {
            account_id: signedAccountId,
            token_id: `nep141:${tokenId}`
          }
        });

        // Try NEP-245 if NEP-141 returns 0
        if (nep141Balance === '0') {
          const nep245Balance = await viewFunction({
            contractId: 'intents.near',
            method: 'mt_balance_of',
            args: {
              account_id: signedAccountId,
              token_id: `nep245:${tokenId}`
            }
          });
          if (nep245Balance === '0') {
            setBalance('0');
            setStandard(null);
          } else {
            setBalance(nep245Balance);
            setStandard('NEP-245');
          }
        } else {
          setBalance(nep141Balance);
          setStandard('NEP-141');
        }
        
        setError(null);
      } catch (error) {
        console.error('Error checking balance:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial check
    checkBalance();

    // Set up polling interval
    const intervalId = setInterval(checkBalance, 5000);

    // Cleanup interval on unmount or when dependencies change
    return () => clearInterval(intervalId);
  }, [signedAccountId, tokenId, viewFunction]);

  const formatBalance = (rawBalance) => {
    if (!rawBalance || !decimals) return '0';
    const actualBalance = Number(rawBalance) / Math.pow(10, decimals);
    return actualBalance.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  };

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
          <div className="font-mono">{formatBalance(balance)}</div>
          {standard && (
            <div className="text-sm text-indigo-500">Using {standard}</div>
          )}
        </div>
      </div>
    </div>
  );
} 