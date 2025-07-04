import React, { useEffect, useState } from 'react';
import { formatDecimalAmount } from '../../utils/format';

export default function WithdrawalStatus({ withdrawalHash }) {
  const [withdrawal, setWithdrawal] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!withdrawalHash) return;
    const fetchStatus = async () => {
      try {
        // Make an api call to get the withdrawal status for the withdrawal hash
        const response = await fetch('https://bridge.chaindefuser.com/rpc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'withdrawal_status',
            params: [ { withdrawal_hash: withdrawalHash } ]
          })
        });

        if (!response.ok) {
          console.error('Failed to fetch withdrawal status');
        }
        
        const data = await response.json();
        if (data.result) {
          setWithdrawal(data.result);
        } 
      } catch (error) {
        console.error(error);
      }
    };

    fetchStatus();
    const intervalId = setInterval(fetchStatus, 1000);
    return () => clearInterval(intervalId);
  }, [withdrawalHash]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-indigo-100 mt-4">
      <h2 className="text-xl font-semibold text-indigo-600 mb-4">Withdrawal Status</h2>
      {!withdrawalHash && <div className="text-gray-500 italic">Withdrawal status will appear here.</div>}
      {isLoading && <div className="text-indigo-600">Checking withdrawal status...</div>}
      {withdrawalHash && !isLoading && withdrawal === null && (
        <div className="text-yellow-600">Pending... (withdrawal not found yet)</div>
      )}
      {withdrawalHash && !isLoading && withdrawal && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-600">Amount:</span>
              <span className="ml-2 font-mono text-gray-800">
                {formatDecimalAmount(withdrawal.data.amount, withdrawal.data.decimals)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <span className="ml-2 font-mono text-gray-800">{withdrawal.status || 'Unknown'}</span>
            </div>
            <div>
              <span className="text-gray-600">Transfer Tx Hash:</span>
              <span className="ml-2 font-mono text-gray-800 break-all">{withdrawal.data.transfer_tx_hash || '-'}</span>
            </div>
            <div>
              <span className="text-gray-600">Timestamp:</span>
              <span className="ml-2 font-mono text-gray-800">
                {withdrawal.data.created_at ? new Date(withdrawal.data.created_at).toLocaleString() : '-'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 