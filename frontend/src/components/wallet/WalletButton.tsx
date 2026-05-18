"use client";
import { useFreighter } from "@/hooks/useFreighter";

export default function WalletButton() {
  const { connected, publicKey, loading, error, connect, disconnect } = useFreighter();

  const short = (key: string) => `${key.slice(0, 4)}…${key.slice(-4)}`;

  if (loading) {
    return (
      <button className="btn btn-outline btn-sm" disabled>
        <span style={{ opacity: 0.6 }}>Connecting…</span>
      </button>
    );
  }

  if (connected && publicKey) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(16,184,145,.1)",
            border: "1px solid rgba(16,184,145,.3)",
            borderRadius: 20,
            padding: "5px 12px",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--emerald-dark)",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              background: "var(--emerald)",
              borderRadius: "50%",
              display: "inline-block",
            }}
          />
          {short(publicKey)}
        </div>
        <button
          onClick={disconnect}
          className="btn btn-outline btn-sm"
          style={{ fontSize: 11 }}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button onClick={connect} className="btn btn-outline btn-sm">
      {error ? "⚠️ Retry" : "🔗 Connect Wallet"}
    </button>
  );
}
