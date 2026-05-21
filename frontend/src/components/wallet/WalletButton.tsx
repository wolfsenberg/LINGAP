"use client";

import { Wallet } from "lucide-react";
import { useFreighter } from "@/hooks/useFreighter";

export default function WalletButton() {
  const { connected, publicKey, loading, error, connect, disconnect } = useFreighter();

  const short = (key: string) => `${key.slice(0, 4)}...${key.slice(-4)}`;

  if (loading) {
    return (
      <button className="wallet-button" disabled>
        <Wallet size={14} />
        <span style={{ opacity: 0.72 }}>Connecting...</span>
      </button>
    );
  }

  if (connected && publicKey) {
    return (
      <div className="wallet-connected">
        <div className="wallet-pill" title={publicKey}>
          <span className="wallet-dot" />
          <Wallet size={13} />
          <span>{short(publicKey)}</span>
        </div>
        <button onClick={disconnect} className="wallet-disconnect">
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button onClick={connect} className="wallet-button">
      <Wallet size={14} />
      {error ? "Retry Wallet" : "Connect Wallet"}
    </button>
  );
}
