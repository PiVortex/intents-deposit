'use client';

import { useState, useEffect } from 'react';
import { useWalletSelector } from '@near-wallet-selector/react-hook';
import { formatDecimalAmount } from '../../utils/format';
import { getChainDisplayName } from '../../utils/chainNames';

export default function UsersLockedTokens({ tokens }) {
  const { signedAccountId, viewFunction } = useWalletSelector();
  const [lockedTokens, setLockedTokens] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!signedAccountId) return;
    setIsLoading(true);
    setError(null);
    async function fetchTokens() {
      try {
        const result = await viewFunction({
          contractId: process.env.NEXT_PUBLIC_CONTRACT_ID,
          method: 'get_tokens_for_account',
          args: {
            account: signedAccountId,
            from_index: null,
            limit: null,
          },
        });
        setLockedTokens(result);
      } catch (err) {
        setError(err.message);
        setLockedTokens([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTokens();
  }, [signedAccountId, viewFunction]);

  const getTokenDetails = (tokenId) => {
    // Remove the nep141: prefix if it exists
    const nearTokenId = tokenId.startsWith('nep141:') ? tokenId.slice(7) : tokenId;
    return tokens.find(token => token.near_token_id === nearTokenId);
  };

  if (!signedAccountId) {
    return <div className="text-gray-500">Please connect your wallet to view your locked tokens.</div>;
  }
  if (isLoading) {
    return <div className="text-indigo-600">Loading locked tokens...</div>;
  }
  if (error) {
    return <div className="text-red-500">{error}</div>;
  }
  if (!lockedTokens || lockedTokens.length === 0) {
    return <div className="text-gray-500">You have not locked any tokens.</div>;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-100">
      <h3 className="text-lg font-semibold text-indigo-600 mb-2">Your Locked Tokens</h3>
      <ul className="divide-y divide-indigo-50">
        {lockedTokens.map(([tokenId, amount], idx) => {
          const tokenDetails = getTokenDetails(tokenId);
          const chainName = tokenDetails?.defuse_asset_identifier 
            ? getChainDisplayName(tokenDetails.defuse_asset_identifier.split(':')[0] + ':' + tokenDetails.defuse_asset_identifier.split(':')[1])
            : 'Unknown Chain';
          
          return (
            <li key={tokenId} className="py-4 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-700">
                  {tokenDetails?.asset_name || 'Unknown'} on {chainName}
                </p>
                <p className="text-sm text-gray-500 break-all">{tokenId}</p>
              </div>
              <span className="font-mono text-indigo-700">
                {formatDecimalAmount(amount, tokenDetails?.decimals || 0)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
} 