export function getChainDisplayName(chainId) {
  // Handle mainnet chains generically
  if (chainId.endsWith(':mainnet')) {
    const chainName = chainId.split(':')[0].toUpperCase();
    // Special case for Solana
    if (chainName === 'SOL') {
      return 'Solana';
    }
    return chainName;
  }

  const chainMap = {
    'eth:1': 'Ethereum',
    'eth:42161': 'Arbitrum One',
    'eth:56': 'BNB Smart Chain',
    'eth:8453': 'Base',
    'eth:100': 'Gnosis',
    'eth:137': 'Polygon',
    'eth:80094': 'Berachain',
  };

  return chainMap[chainId] || chainId;
} 