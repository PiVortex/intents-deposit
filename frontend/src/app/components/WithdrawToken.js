"use client"

import { useState, useEffect } from "react";
import { useWalletSelector } from '@near-wallet-selector/react-hook';

export default function WithdrawToken({ selectedToken }) {
    const { signedAccountId, viewFunction, signMessage } = useWalletSelector();
    const [address, setAddress] = useState("");
    const [balance, setBalance] = useState(null);
    const [balanceLoading, setBalanceLoading] = useState(false);
    const [balanceError, setBalanceError] = useState(null);
    const [builtMessage, setBuiltMessage] = useState(null);

    // Fetch token balance when selectedToken or signedAccountId changes
    useEffect(() => {
        if (!selectedToken || !signedAccountId) {
            setBalance(null);
            return;
        }
        setBalanceLoading(true);
        setBalanceError(null);
        viewFunction({
            contractId: process.env.NEXT_PUBLIC_CONTRACT_ID,
            method: 'get_token_balance_for_account',
            args: {
                account: signedAccountId,
                token_id: selectedToken.intents_token_id,
            },
        })
        .then(result => setBalance(result))
        .catch(err => {
            setBalanceError(err.message || 'Error fetching balance');
            setBalance(null);
        })
        .finally(() => setBalanceLoading(false));
    }, [selectedToken, signedAccountId, viewFunction]);

    function buildIntentMessage({ deadline, signer_id, intents }) {
        return {
            deadline,
            signer_id,
            intents,
        };
    }

    function generateNonce() {
        const nonce = new Uint8Array(32);
        crypto.getRandomValues(nonce);
        return {
            buffer: Buffer.from(nonce.buffer),
            base64: btoa(String.fromCharCode.apply(null, nonce))
        };
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!selectedToken || !signedAccountId || !balance) return;
        const deadline = new Date(Date.now() + 120 * 1000).toISOString();
        const token = selectedToken.intents_token_id;
        const receiverId = selectedToken.intents_token_id;
        const amount = balance;
        const { buffer: nonceBuffer, base64: nonceBase64 } = generateNonce();
        const intents = [
            {
                intent: "ft_withdraw",
                token,
                receiver_id: receiverId,
                amount,
                memo: `WITHDRAW_TO:${address}`,
            },
        ];
        const message = buildIntentMessage({
            deadline,
            signer_id: signedAccountId,
            intents,
        });
        setBuiltMessage({ message });
        const messageJson = JSON.stringify(message);
        const signature = await signMessage({
            message: messageJson,
            recipient: signedAccountId,
            nonce: nonceBuffer,
        });

        const formattedIntent = {
            id: Date.now(),
            jsonrpc: "2.0",
            method: "publish_intent",
            params: [
                {
                    signed_data: {
                        standard: "nep413",
                        payload: {
                            message: messageJson,
                            nonce: nonceBase64,
                            recipient: signedAccountId
                        },
                        signature: `ed25519:${signature.signature}`,
                        public_key: signature.publicKey
                    }
                }
            ]
        };

        try {
            const response = await fetch('https://solver-relay-v2.chaindefuser.com/rpc', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formattedIntent)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Intent published successfully:', result);
        } catch (error) {
            console.error('Error publishing intent:', error);
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
                    <b>Token:</b> {selectedToken.intents_token_id}
                </div>
                <div className="text-gray-700">
                    <b>Receiver ID:</b> {selectedToken.intents_token_id}
                </div>
                <div className="text-gray-700">
                    <b>Signer ID:</b> {signedAccountId}
                </div>
                <div className="text-gray-700">
                    <b>Amount:</b> {balanceLoading ? 'Loading...' : balanceError ? 'Error' : balance}
                </div>
                <div className="text-gray-700">
                    <b>System:</b> nep413
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
                <button
                    type="submit"
                    disabled={!address || !balance || balanceLoading}
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Build Intent
                </button>
            </form>
            {builtMessage && (
                <div className="mt-6">
                    <div className="font-semibold text-gray-900 mb-2">Built Intent Message:</div>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                        {JSON.stringify(builtMessage, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}