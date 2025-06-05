"use client"

import { useState } from "react";
import { useWalletSelector } from '@near-wallet-selector/react-hook';

export default function WithdrawToken({ selectedToken, balance }) {
    const { signedAccountId, callFunction } = useWalletSelector();
    const [address, setAddress] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!selectedToken || !signedAccountId || !balance) return;
        
        setLoading(true);
        setError(null);

        try {
            // Make the withdrawal call
            await callFunction({
                contractId: "intents.near",
                method: 'ft_withdraw',
                args: {
                    token: selectedToken.near_token_id,
                    receiver_id: selectedToken.near_token_id, // Same as token for POA bridge
                    amount: balance,
                    memo: `WITHDRAW_TO:${address}`,
                },
                gas: '100000000000000', // 100 Tgas
                deposit: '1', // 1 yoctoNEAR
            });

            // Clear form on success
            setAddress("");
        } catch (err) {
            setError(err.message || 'Error making withdrawal');
        } finally {
            setLoading(false);
        }
    }

    if (!selectedToken) {
        return <div className="text-gray-500">Please select a token to withdraw.</div>;
    }

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-900">Withdraw Token</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="text-gray-700">
                    <b>Token:</b> {selectedToken.near_token_id}
                </div>
                <div className="text-gray-700">
                    <b>Receiver ID:</b> {selectedToken.near_token_id}
                </div>
                <div className="text-gray-700">
                    <b>Signer ID:</b> {signedAccountId}
                </div>
                <div className="text-gray-700">
                    <b>Amount:</b> {balance || '0'}
                </div>
                <div className="space-y-2">
                    <label className="block text-gray-700 font-medium">
                        Destination Address:
                        <input
                            type="text"
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                        />
                    </label>
                </div>
                {error && (
                    <div className="text-red-600">
                        {error}
                    </div>
                )}
                <button
                    type="submit"
                    disabled={!address || !balance || loading}
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Processing...' : 'Withdraw'}
                </button>
            </form>
        </div>
    );
}