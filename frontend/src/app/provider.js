'use client';

import '@near-wallet-selector/modal-ui/styles.css';
import { WalletSelectorProvider } from '@near-wallet-selector/react-hook';
import { setupMeteorWallet } from '@near-wallet-selector/meteor-wallet';
import { Navigation } from './components/Navigation';

const walletSelectorConfig = {
    network: "mainnet",
    createAccessKeyFor: process.env.NEXT_PUBLIC_CONTRACT_ID,
    modules: [
      setupMeteorWallet(),
    ],
  }

export function Providers({ children }) {
  return (
    <WalletSelectorProvider config={walletSelectorConfig}>
      <Navigation />
      {children}
    </WalletSelectorProvider>
  );
}