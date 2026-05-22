"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, CreditCard, Landmark, Smartphone, Wallet, X, type LucideIcon } from "lucide-react";
import toast from "react-hot-toast";
import { balanceApi, type BalanceApi, type BalanceTransactionApi } from "@/lib/api";
import { useFreighter } from "@/hooks/useFreighter";
import { getStellarExpertContractUrl } from "@/lib/stellar";

type PaymentMethod = "pdax" | "gcash" | "maya" | "stellar_wallet";
type AmountMode = "xlm" | "php";

const XLM_PRESETS = [5, 10, 25, 50];
const PHP_PRESETS = [100, 250, 500, 1000];

type TopUpModalProps = {
  open: boolean;
  onClose: () => void;
  rate: number;
  onConfirmed: (balance: Omit<BalanceApi, "transactions">, transaction: BalanceTransactionApi) => void;
};

const methods: Array<{
  id: PaymentMethod;
  title: string;
  label: string;
  Icon: LucideIcon;
  recommended?: boolean;
}> = [
  { id: "pdax", title: "PDAX", label: "Primary Digital Asset Channel", Icon: Landmark, recommended: true },
  { id: "gcash", title: "GCash", label: "Local Payment Option", Icon: Smartphone },
  { id: "maya", title: "Maya", label: "Local Payment Option", Icon: CreditCard },
  { id: "stellar_wallet", title: "Stellar Wallet", label: "Direct On-Chain Top-up", Icon: Wallet },
];

function formatXlm(value: number) {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} XLM`;
}

function formatPhp(value: number) {
  return `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function TopUpModal({ open, onClose, rate, onConfirmed }: TopUpModalProps) {
  const { connected, publicKey, connect } = useFreighter();
  const [method, setMethod] = useState<PaymentMethod>("pdax");
  const [mode, setMode] = useState<AmountMode>("xlm");
  const [amount, setAmount] = useState("10");
  const [submitting, setSubmitting] = useState(false);
  const [confirmedRef, setConfirmedRef] = useState("");
  const stellarVaultUrl = getStellarExpertContractUrl();
  const presets = mode === "xlm" ? XLM_PRESETS : PHP_PRESETS;

  const numericAmount = Number(amount) || 0;
  const amountXlm = useMemo(
    () => (mode === "xlm" ? numericAmount : numericAmount / rate),
    [mode, numericAmount, rate]
  );
  const amountPhp = useMemo(
    () => (mode === "php" ? numericAmount : numericAmount * rate),
    [mode, numericAmount, rate]
  );

  if (!open) return null;

  async function handleConfirm() {
    if (!connected || !publicKey) {
      toast.error("Connect your Stellar Wallet before topping up.");
      await connect();
      return;
    }

    if (amountXlm <= 0) {
      toast.error("Enter an amount greater than 0.");
      return;
    }

    if (method === "stellar_wallet") {
      toast("Connect Stellar Wallet to continue with a direct on-chain top-up.");
      return;
    }

    setSubmitting(true);
    setConfirmedRef("");
    try {
      const res = await balanceApi.simulateTopUp({
        paymentMethod: method,
        amountXlm: mode === "xlm" ? Number(amountXlm.toFixed(2)) : undefined,
        amountPhp: mode === "php" ? Number(amountPhp.toFixed(2)) : undefined,
      });
      const tx = res.data.data.top_up;
      setConfirmedRef(tx.payment_reference);
      onConfirmed(res.data.data.balance, tx);
      toast.success(`${tx.payment_reference} confirmed.`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(err.response?.data?.detail || err.message || "Top-up failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-prompt-backdrop" role="dialog" aria-modal="true" aria-label="Top up balance">
      <div className="auth-prompt-modal" style={{ width: "min(100%, 620px)", textAlign: "left" }}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close top-up modal"
          style={{ position: "absolute", right: 16, top: 16, border: 0, background: "transparent", cursor: "pointer", color: "var(--text3)" }}
        >
          <X size={19} />
        </button>

        <div className="section-label">LINGAP WALLET</div>
        <h2 style={{ textAlign: "left" }}>Top Up Your LINGAP Balance</h2>
        <p style={{ marginLeft: 0, maxWidth: 540 }}>
          Choose a payment channel to add XLM to your LINGAP balance. PDAX, GCash, and Maya create payment confirmations, while Stellar Wallet represents a direct on-chain flow.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 10, marginBottom: 16 }}>
          {methods.map(({ id, title, label, Icon, recommended }) => (
            <button
              key={id}
              type="button"
              onClick={() => setMethod(id)}
              className={`btn ${method === id ? "btn-primary" : "btn-outline"}`}
              style={{ height: "auto", justifyContent: "flex-start", alignItems: "flex-start", padding: 14, textAlign: "left", gap: 10 }}
            >
              <Icon size={18} />
              <span style={{ display: "grid", gap: 3 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 800 }}>
                  {title}
                  {recommended && <span className="badge badge-gold" style={{ fontSize: 10 }}>Recommended</span>}
                </span>
                <span style={{ fontSize: 12, opacity: 0.76 }}>{label}</span>
              </span>
            </button>
          ))}
        </div>

        <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <div style={{ fontWeight: 800, color: "var(--forest)", marginBottom: 10 }}>XLM / PHP Converter</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 8, marginBottom: 10 }}>
              <button type="button" className={`btn btn-sm ${mode === "xlm" ? "btn-primary" : "btn-outline"}`} onClick={() => { setMode("xlm"); setAmount(String(XLM_PRESETS[1])); }}>
                Enter amount in XLM
              </button>
              <button type="button" className={`btn btn-sm ${mode === "php" ? "btn-primary" : "btn-outline"}`} onClick={() => { setMode("php"); setAmount(String(PHP_PRESETS[2])); }}>
                Enter amount in PHP
              </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(96px,1fr))", gap: 8, marginBottom: 10 }}>
            {presets.map((preset) => (
              <button
                key={`${mode}-${preset}`}
                type="button"
                onClick={() => setAmount(String(preset))}
                className={`btn btn-sm ${Number(amount) === preset ? "btn-primary" : "btn-outline"}`}
                style={{ justifyContent: "center" }}
              >
                {mode === "xlm" ? `${preset} XLM` : formatPhp(preset)}
              </button>
            ))}
          </div>
          <input
            type="number"
            min="0"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder={mode === "xlm" ? "Amount in XLM" : "Amount in PHP"}
            style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px", fontSize: 15, boxSizing: "border-box" }}
          />
          <div style={{ marginTop: 10, fontSize: 13, color: "var(--text2)" }}>
            1 XLM = {formatPhp(rate)} · {formatXlm(amountXlm)} ≈ {formatPhp(amountPhp)}
          </div>
        </div>

        <div style={{ padding: 13, background: "rgba(74,155,106,.07)", border: "1px solid rgba(74,155,106,.2)", borderRadius: 10, color: "var(--forest)", fontSize: 13, marginBottom: 14 }}>
          {connected && publicKey ? `Connected wallet: ${publicKey.slice(0, 6)}...${publicKey.slice(-4)}` : "Connect Stellar Wallet to continue before any top-up is confirmed."}
          {stellarVaultUrl && (
            <a href={stellarVaultUrl} target="_blank" rel="noreferrer" style={{ display: "block", color: "var(--canopy)", fontWeight: 800, marginTop: 6, textDecoration: "none" }}>
              View LINGAP vault on Stellar
            </a>
          )}
        </div>

        {confirmedRef && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 13, borderRadius: 10, background: "rgba(74,155,106,.09)", color: "var(--forest)", fontSize: 13, marginBottom: 14 }}>
            <CheckCircle2 size={16} color="var(--canopy)" /> Payment status: Confirmed · {confirmedRef}
          </div>
        )}

        <button type="button" onClick={handleConfirm} disabled={submitting} className="btn btn-emerald btn-lg" style={{ width: "100%", justifyContent: "center" }}>
          {submitting ? "Confirming..." : !connected ? "Connect Wallet to Continue" : method === "stellar_wallet" ? "Continue with Stellar Wallet" : "Confirm Top-up"}
        </button>
      </div>
    </div>
  );
}
