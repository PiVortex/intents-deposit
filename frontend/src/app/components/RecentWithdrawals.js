import React, { useEffect, useState } from 'react';
import { formatDecimalAmount } from '../../utils/format';

export default function RecentWithdrawals({ withdrawalHash }) {
  const [status, setStatus] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [manualHash, setManualHash] = useState('');

  // Use manualHash if set, otherwise use prop
  const hashToUse = manualHash || withdrawalHash;

  useEffect(() => {
    if (!hashToUse) return;
    setLoading(true);
    setError(null);
    setStatus(null);
    setData(null);
    fetch('https://bridge.chaindefuser.com/rpc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'withdrawal_status',
        params: [ { withdrawal_hash: hashToUse } ]
      })
    })
      .then(res => res.json())
      .then(res => {
        if (res.result) {
          setStatus(res.result.status);
          setData(res.result.data);
        } else {
          setError('No result from API');
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [hashToUse]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-indigo-100 mt-4">
      <h2 className="text-xl font-semibold text-indigo-600 mb-4">Recent Withdrawals</h2>
      {/* TEMP: Manual hash input for testing */}
      <div className="mb-4">
        <label className="block text-gray-600 mb-1">Manual Withdrawal Hash (for testing):</label>
        <input
          type="text"
          value={manualHash}
          onChange={e => setManualHash(e.target.value)}
          placeholder="Paste withdrawal hash here"
          className="block w-full rounded border-gray-300 px-3 py-2 text-black"
        />
      </div>
      {!hashToUse && <div className="text-gray-500 italic">Recent withdrawals will appear here.</div>}
      {hashToUse && loading && <div className="text-indigo-600">Checking withdrawal status...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {hashToUse && !loading && !error && status && data && (
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