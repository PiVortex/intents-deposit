'use client';

import { useState } from 'react';
import { useWalletSelector } from '@near-wallet-selector/react-hook';

export default function LockInContract({ selectedToken }) {
    const { signedAccountId, viewFunction, callFunction } = useWalletSelector();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleDeposit = async () => {
        setLoading(true);
        setError(null);
        setSuccess(false);
        try {
            // Make a view call to the intents contract to get the deposit balance
            const balance = await viewFunction({
                contractId: 'intents.near',
                method: 'mt_balance_of',
                args: {
                    account_id: signedAccountId,
                    token_id: selectedToken.intents_token_id
                }
            });
            if (!balance || balance === '0') {
                setError('No balance to lock.');
                setLoading(false);
                return;
            }

            // Make a call to the intents contract to lock all the funds in the contract
            const result = await callFunction({
                contractId: 'intents.near',
                method: 'mt_transfer_call',
                args: {
                    receiver_id: process.env.NEXT_PUBLIC_CONTRACT_ID,
                    amount: balance,
                    msg: '',
                    token_id: selectedToken.intents_token_id,
                },
                gas: '100000000000000',
                deposit: '1',
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
                    onClick={handleDeposit}
                    disabled={loading || !signedAccountId}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                    {loading ? 'Locking...' : 'Lock Funds In Contract'}
                </button>
            </div>
            {error && <div className="text-red-500 mt-2 text-center">{error}</div>}
            {success && <div className="text-green-600 mt-2 text-center">Funds locked in contract!</div>}
        </div>
    );
} 