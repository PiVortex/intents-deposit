'use client';

import { useState, useEffect } from 'react';
import { getChainDisplayName } from '../../utils/chainNames';
import { useWalletSelector } from '@near-wallet-selector/react-hook';

export default function DepositAddress({ selectedAsset }) {
  const { signedAccountId } = useWalletSelector();
  const [depositInfo, setDepositInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDepositAddress() {
      if (!selectedAsset || !signedAccountId) return;

      setIsLoading(true);
      setError(null);

      try {
        // Extract chain from the asset identifier (e.g., "eth:1" from "eth:1:0x...")
        const chain = selectedAsset.defuse_asset_identifier.split(':').slice(0, 2).join(':');
        
        const response = await fetch("https://bridge.chaindefuser.com/rpc", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "deposit_address",
            params: [
              {
                account_id: signedAccountId,
                chain: chain,
              },
            ],
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch deposit address');
        }

        const data = await response.json();
        setDepositInfo(data.result);
      } catch (error) {
        console.error("Error fetching deposit address:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDepositAddress();
  }, [selectedAsset, signedAccountId]);

  const handleCopy = async () => {
    if (!depositInfo?.address) return;
    try {
      await navigator.clipboard.writeText(depositInfo.address);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!selectedAsset) return null;

  if (!signedAccountId) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-indigo-100">
        <h2 className="text-xl font-semibold text-indigo-600 mb-4">Deposit Address</h2>
        <div className="text-center py-6">
          <p className="text-gray-600">Please connect your wallet to view deposit information</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 mb-6 bg-red-50 p-4 rounded-lg border border-red-200">
        {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-indigo-600 bg-indigo-50 p-4 rounded-lg mb-6">
        Loading deposit address...
      </div>
    );
  }

  if (!depositInfo) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-indigo-100">
      <h2 className="text-xl font-semibold text-indigo-600 mb-4">Deposit Address</h2>
      <div className="space-y-3">
        <div>
          <span className="text-gray-600">Chain:</span>
          <span className="ml-2 font-mono text-gray-800">{getChainDisplayName(depositInfo.chain)}</span>
        </div>
        <div>
          <span className="text-gray-600">Address:</span>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-mono text-gray-800 break-all">{depositInfo.address}</span>
            <button
              onClick={handleCopy}
              className="px-3 py-1 text-sm bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition-colors duration-200"
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 