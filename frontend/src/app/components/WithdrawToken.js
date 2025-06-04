'use client';

import { useState } from 'react';
import { useWalletSelector } from '@near-wallet-selector/react-hook';

export default function WithdrawToken({ selectedToken }) {
    const { signedAccountId, callFunction } = useWalletSelector();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleWithdraw = async () => {
        if (!selectedToken) {
            setError('Please select a token to withdraw');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await callFunction({
                contractId: process.env.NEXT_PUBLIC_CONTRACT_ID,
                method: 'withdraw_token',
                args: {
                    token_id: selectedToken,
                },
                gas: '100000000000000', // 100 Tgas
            });
            setSuccess(true);
        } catch (err) {
            setError(err.message || 'Transaction failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-100 mt-4">
            <div className="flex justify-center">
                <button
                    onClick={handleWithdraw}
                    disabled={loading || !signedAccountId || !selectedToken}
                    className={`px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50 ${
                        loading || !signedAccountId || !selectedToken
                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                >
                    {loading ? 'Withdrawing...' : 'Withdraw Token'}
                </button>
            </div>
            {error && <div className="text-red-500 mt-2 text-center">{error}</div>}
            {success && <div className="text-green-600 mt-2 text-center">Token withdrawn successfully!</div>}
        </div>
    );
} 