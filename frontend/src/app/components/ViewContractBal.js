'use client';

import { useState, useEffect } from 'react';
import { useWalletSelector } from '@near-wallet-selector/react-hook';
import { formatDecimalAmount } from '../../utils/format';

export default function ViewContractBal({ tokenId, decimals, onBalanceChange }) {
    const { signedAccountId, viewFunction } = useWalletSelector();
    const [balance, setBalance] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!signedAccountId || !tokenId) return;

        const fetchBalance = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const result = await viewFunction({
                    contractId: process.env.NEXT_PUBLIC_CONTRACT_ID,
                    method: 'get_token_balance_for_account',
                    args: {
                        account: signedAccountId,
                        token_id: tokenId
                    }
                });

                setBalance(result);
                // Call the callback with the new balance
                if (onBalanceChange) {
                    onBalanceChange(result);
                }
            } catch (err) {
                console.error('Error fetching balance:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        // Initial fetch
        fetchBalance();

        // Set up polling interval (5 seconds)
        const intervalId = setInterval(fetchBalance, 5000);

        // Cleanup interval on unmount or when dependencies change
        return () => clearInterval(intervalId);
    }, [signedAccountId, tokenId, viewFunction, onBalanceChange]);

    // Only show loading UI if balance is null (initial load)
    if (!signedAccountId || error || (isLoading && balance === null)) {
        return (
            <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-100">
                <h3 className="text-lg font-semibold text-indigo-600 mb-2">Contract Balance</h3>
                <div className="text-gray-700">
                    <div className="font-mono">0</div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-100">
            <h3 className="text-lg font-semibold text-indigo-600 mb-2">Contract Balance</h3>
            <div className="text-gray-700">
                <div className="space-y-1">
                    <div className="font-mono">{formatDecimalAmount(balance, decimals)}</div>
                </div>
            </div>
        </div>
    );
} 