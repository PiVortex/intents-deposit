import React, { useEffect, useState } from 'react';
import { formatDecimalAmount } from '../../utils/format';

export default function RecentWithdrawals({ withdrawalHash }) {
  const [status, setStatus] = useState(null);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!withdrawalHash) return;

    const fetchStatus = async () => {
      setIsLoading(true);
      setError(null);
      try {
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
        if (!response.ok) throw new Error('Failed to fetch withdrawal status');
        const res = await response.json();
        if (res.result) {
          setStatus(res.result.status);
          setData(res.result.data);
        } else {
          setError('No result from API');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchStatus();
    // Set up polling interval
    const intervalId = setInterval(fetchStatus, 1000);
    // Cleanup interval on unmount or when hash changes
    return () => clearInterval(intervalId);
  }, [withdrawalHash]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-indigo-100 mt-4">
      <h2 className="text-xl font-semibold text-indigo-600 mb-4">Recent Withdrawals</h2>
      {!withdrawalHash && <div className="text-gray-500 italic">Recent withdrawals will appear here.</div>}
      {isLoading && <div className="text-indigo-600">Checking withdrawal status...</div>}
      {withdrawalHash && !isLoading && status === 'NOT_FOUND' && (
        <div className="text-yellow-600">Pending... (withdrawal not found yet)</div>
      )}
      {error && <div className="text-red-500">{error}</div>}
      {withdrawalHash && !isLoading && status && data && status !== 'NOT_FOUND' && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-600">Amount:</span>
              <span className="ml-2 font-mono text-gray-800">
                {formatDecimalAmount(data.amount, data.decimals)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <span className="ml-2 font-mono text-gray-800">{status}</span>
            </div>
            <div>
              <span className="text-gray-600">Transfer Tx Hash:</span>
              <span className="ml-2 font-mono text-gray-800 break-all">{data.transfer_tx_hash || '-'}</span>
            </div>
            <div>
              <span className="text-gray-600">Timestamp:</span>
              <span className="ml-2 font-mono text-gray-800">
                {data.created_at ? new Date(data.created_at).toLocaleString() : '-'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 