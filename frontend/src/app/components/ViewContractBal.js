'use client';

import { useState, useEffect } from 'react';
import { useWalletSelector } from '@near-wallet-selector/react-hook';
import { formatDecimalAmount } from '../../utils/format';

export default function ViewContractBal({ selectedToken }) {
    const { signedAccountId, viewFunction } = useWalletSelector();
    const [balance, setBalance] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!signedAccountId || !selectedToken) return;

        const fetchBalance = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Make a view call to the intents contract to get the deposit balance
                const result = await viewFunction({
                    contractId: process.env.NEXT_PUBLIC_CONTRACT_ID,
                    method: 'get_token_balance_for_account',
                    args: {
                        account: signedAccountId,
                        token_id: selectedToken.intents_token_id
                    }
                });

                setBalance(result);
            } catch (err) {
                console.error('Error fetching balance:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBalance();
        const intervalId = setInterval(fetchBalance, 5000);
        return () => clearInterval(intervalId);
    }, [signedAccountId, selectedToken, viewFunction]);

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
                    <div className="font-mono">{formatDecimalAmount(balance, selectedToken.decimals)}</div>
                </div>
            </div>
        </div>
    );
} 