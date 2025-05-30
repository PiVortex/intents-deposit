'use client';

import { useEffect, useState } from "react";
import { useWalletSelector } from '@near-wallet-selector/react-hook';

export const Navigation = () => {
  const { signedAccountId, signIn, signOut } = useWalletSelector();
  const [action, setAction] = useState(() => {});
  const [label, setLabel] = useState("Loading...");

  useEffect(() => {
    if (signedAccountId) {
      setAction(() => signOut);
      setLabel(`Logout ${signedAccountId}`);
    } else {
      setAction(() => signIn);
      setLabel("Login");
    }
  }, [signedAccountId]);

  return (
    <nav className="fixed top-0 right-0 p-4 z-50">
      <button
        onClick={action}
        className="px-6 py-2.5 bg-indigo-600 text-white font-medium text-sm leading-tight rounded-lg shadow-md hover:bg-indigo-700 hover:shadow-lg focus:bg-indigo-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-indigo-800 active:shadow-lg transition duration-150 ease-in-out"
      >
        {label}
      </button>
    </nav>
  );
};