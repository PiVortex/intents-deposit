'use client';

import { useState, useEffect } from 'react';
import { useWalletSelector } from '@near-wallet-selector/react-hook';
import { formatDecimalAmount } from '../../utils/format';

export default function RecentDeposits({ selectedAsset }) {
  const { signedAccountId } = useWalletSelector();
  const [deposits, setDeposits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedAsset) return;

    const fetchDeposits = async () => {
      try {
        const chain = selectedAsset.defuse_asset_identifier.split(':').slice(0, 2).join(':');
        
        const response = await fetch("https://bridge.chaindefuser.com/rpc", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "recent_deposits",
            params: [
              {
                account_id: signedAccountId,
                chain: chain,
              },
            ],
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch recent deposits');
        }

        const data = await response.json();
        
        // Check if we have deposits in the response
        if (data.result && data.result.deposits) {
          setDeposits([...data.result.deposits].reverse());
        } else {
          setDeposits([]);
        }
        setError(null);
      } catch (error) {
        console.error("Error fetching recent deposits:", error);
        setError(error.message);
        setDeposits([]); // Reset deposits on error
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchDeposits();

    // Set up polling interval
    const intervalId = setInterval(fetchDeposits, 1000);

    // Cleanup interval on unmount or when selectedAsset changes
    return () => clearInterval(intervalId);
  }, [selectedAsset]);

  if (!selectedAsset) return null;

  if (error) {
    return (
      <div className="text-red-500 mb-6 bg-red-50 p-4 rounded-lg border border-red-200">
        {error}
      </div>
    );
  }

  return (
    <details className="bg-indigo-50 shadow-lg rounded-lg border-2 border-indigo-100 group mt-6">
      <summary className="p-6 cursor-pointer flex items-center justify-between">
        <h2 className="text-xl font-semibold text-indigo-600">Recent Deposits</h2>
        <svg 
          className="w-6 h-6 text-indigo-600 transform transition-transform duration-200 group-open:rotate-180" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="p-6 pt-0">
        {isLoading ? (
          <div className="text-indigo-600 bg-indigo-50 p-4 rounded-lg">
            Loading deposits...
          </div>
        ) : !Array.isArray(deposits) || deposits.length === 0 ? (
          <div className="text-gray-500 italic">No recent deposits found</div>
        ) : (
          <div className="space-y-4">
            {deposits.map((deposit, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600">Amount:</span>
                    <span className="ml-2 font-mono text-gray-800">
                      {formatDecimalAmount(deposit.amount, deposit.decimals)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className="ml-2 font-mono text-gray-800">{deposit.status}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Transaction Hash:</span>
                    <span className="ml-2 font-mono text-gray-800 break-all">{deposit.tx_hash}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Timestamp:</span>
                    <span className="ml-2 font-mono text-gray-800">
                      {new Date(deposit.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </details>
  );
} 