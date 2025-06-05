"use client"

import { useState } from "react";
import { getChainDisplayName } from '../../utils/chainNames';
import { useWalletSelector } from '@near-wallet-selector/react-hook';

export default function WithdrawToken({ selectedToken, balance, onWithdraw }) {
    const { signedAccountId, callFunction, wallet } = useWalletSelector();
    const [address, setAddress] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!selectedToken) {
        return <div className="text-gray-500">Please select a token to withdraw.</div>;
    }

    const chain = selectedToken.defuse_asset_identifier
        ? selectedToken.defuse_asset_identifier.split(":").slice(0, 2).join(":")
        : "";

    async function handleSubmit(e) {
        e.preventDefault();
        if (!selectedToken || !signedAccountId || !balance) return;
        setLoading(true);
        setError(null);
        try {
            const outcome = await wallet.signAndSendTransaction({
                receiverId: "intents.near",
                actions: [
                    {
                        type: "FunctionCall",
                        params: {
                            methodName: "ft_withdraw",
                            args: {
                                token: selectedToken.near_token_id,
                                receiver_id: selectedToken.near_token_id,
                                amount: balance,
                                memo: `WITHDRAW_TO:${address}`,
                            },
                            gas: "100000000000000",
                            deposit: "1",
                        },
                    },
                ],
            });
            onWithdraw(outcome.transaction.hash);
            console.log(outcome.transaction.hash);

            // await callFunction({
            //     contractId: "intents.near",
            //     method: 'ft_withdraw',
            //     args: {
            //         token: selectedToken.near_token_id,
            //         receiver_id: selectedToken.near_token_id,
            //         amount: balance,
            //         memo: `WITHDRAW_TO:${address}`,
            //     },
            //     gas: '100000000000000',
            //     deposit: '1',
            // });
            setAddress("");
        } catch (err) {
            setError(err.message || 'Error making withdrawal');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-indigo-100">
            <h2 className="text-xl font-semibold text-indigo-600 mb-4">Withdraw Address</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <span className="text-gray-600">Chain:</span>
                    <span className="ml-2 font-mono text-gray-800">{getChainDisplayName(chain)}</span>
                </div>
                <div>
                    <span className="text-gray-600">Address:</span>
                    <input
                        type="text"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-black"
                        required
                        spellCheck={false}
                    />
                </div>
                {error && (
                    <div className="text-red-500 bg-red-50 p-2 rounded border border-red-200">{error}</div>
                )}
                <button
                    type="submit"
                    disabled={!address || !balance || loading}
                    className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition-colors duration-200 w-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Processing...' : 'Withdraw'}
                </button>
            </form>
        </div>
    );
}