"use client"

import { useState } from "react";
import { getChainDisplayName } from '../../utils/chainNames';
import { useWalletSelector } from '@near-wallet-selector/react-hook';

export default function UnlockWithdrawToken({ selectedToken, onWithdraw }) {
    const { signedAccountId, wallet, callFunction, viewFunction } = useWalletSelector();
    const [address, setAddress] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [unlockSuccess, setUnlockSuccess] = useState(false);

    if (!selectedToken) {
        return <div className="text-gray-500">Please select a token to withdraw.</div>;
    }

    const chain = selectedToken.defuse_asset_identifier
        ? selectedToken.defuse_asset_identifier.split(":").slice(0, 2).join(":")
        : "";

    const handleUnlock = async () => {
        if (!selectedToken) {
            setError('Please select a token to unlock');
            return;
        }

        setLoading(true);
        setError(null);
        setUnlockSuccess(false);

        try {
            const result = await callFunction({
                contractId: process.env.NEXT_PUBLIC_CONTRACT_ID,
                method: 'withdraw_token',
                args: {
                    token_id: selectedToken.intents_token_id,
                },
                gas: '100000000000000', // 100 Tgas
            });
            console.log(result);
            setUnlockSuccess(true);
            return true;
        } catch (err) {
            setError(err.message || 'Unlock transaction failed');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const getDepositBalance = async () => {
        try {
            const balance = await viewFunction({
                contractId: 'intents.near',
                method: 'mt_balance_of',
                args: {
                  account_id: signedAccountId,
                  token_id: selectedToken.intents_token_id
                }
              });
            return balance;
        } catch (err) {
            console.error('Error fetching contract balance:', err);
            throw new Error('Failed to fetch contract balance');
        }
    };

    async function handleSubmit(e) {
        e.preventDefault();
        if (!selectedToken || !signedAccountId) return;
        
        setLoading(true);
        setError(null);
        
        try {
            // Try to unlock the token, but continue even if it fails
            const unlockResult = await handleUnlock();
            if (unlockResult) {
                setUnlockSuccess(true);
            }

            // Get the current contract balance
            let depositBalance;
            try {
                depositBalance = await getDepositBalance();
            } catch (err) {
                setError('Failed to fetch balance. Please try again.');
                return;
            }

            if (!depositBalance || depositBalance === "0") {
                setError('No balance available to withdraw');
                return;
            }

            // Then proceed with withdrawal
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
                                amount: depositBalance,
                                memo: `WITHDRAW_TO:${address}`,
                            },
                            gas: "100000000000000",
                            deposit: "1",
                        },
                    },
                ],
            });
            onWithdraw(outcome.transaction.hash);
            console.log(outcome);
            setAddress("");
            setUnlockSuccess(false); // Reset unlock success state
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
                {unlockSuccess && (
                    <div className="text-green-600 bg-green-50 p-2 rounded border border-green-200">
                        Token unlocked successfully! Proceeding with withdrawal...
                    </div>
                )}
                <button
                    type="submit"
                    disabled={!address || loading}
                    className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition-colors duration-200 w-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Processing...' : 'Unlock and Withdraw'}
                </button>
            </form>
        </div>
    );
}