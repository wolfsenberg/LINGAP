"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, CreditCard, Landmark, Smartphone, Wallet, X, type LucideIcon } from "lucide-react";
import toast from "react-hot-toast";
import { balanceApi, type BalanceApi, type BalanceTransactionApi } from "@/lib/api";
import { useFreighter } from "@/hooks/useFreighter";
import {
  buildPaymentTransaction,
  getStellarExpertContractUrl,
  getStellarExpertTxUrl,
  submitSignedTransactionXdr,
} from "@/lib/stellar";

type PaymentMethod = "pdax" | "gcash" | "maya" | "stellar_wallet";
type AmountMode = "xlm" | "php";

const XLM_PRESETS = [5, 10, 25, 50];
const PHP_PRESETS = [100, 250, 500, 1000];

const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet"
    ? "Public Global Stellar Network ; September 2015"
    : "Test SDF Network ; September 2015";

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
}> = [
  { id: "pdax", title: "PDAX", label: "Primary Digital Asset Channel", Icon: Landmark },
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

function methodSourceLabel(method: PaymentMethod) {
  if (method === "gcash") return "GCash mobile number";
  if (method === "maya") return "Maya mobile number";
  if (method === "pdax") return "PDAX account email";
  return "Connected wallet";
}

function shortAddress(value?: string | null) {
  if (!value) return "Not configured";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export default function TopUpModal({ open, onClose, rate, onConfirmed }: TopUpModalProps) {
  const { connected, publicKey, connect, sign } = useFreighter();
  const [method, setMethod] = useState<PaymentMethod>("pdax");
  const [mode, setMode] = useState<AmountMode>("xlm");
  const [amount, setAmount] = useState("10");
  const [senderReference, setSenderReference] = useState("");
  const [senderName, setSenderName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmedRef, setConfirmedRef] = useState("");
  const [confirmedTxHash, setConfirmedTxHash] = useState("");

  const receivingWallet = process.env.NEXT_PUBLIC_LINGAP_RECEIVER_PUBLIC_KEY || "";
  const vaultContract = process.env.NEXT_PUBLIC_CONTRACT_DONATION_VAULT || "";
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

  function closeModal() {
    if (submitting) return;
    onClose();
  }

  async function handleConfirm() {
    if (amountXlm <= 0) {
      toast.error("Enter an amount greater than 0.");
      return;
    }

    if ((method === "gcash" || method === "maya") && !senderReference.trim()) {
      toast.error(`${method === "gcash" ? "GCash" : "Maya"} number is required.`);
      return;
    }

    if (method === "pdax" && !senderReference.trim() && !senderName.trim()) {
      toast.error("PDAX account email or account name is required.");
      return;
    }

    setSubmitting(true);
    setConfirmedRef("");
    setConfirmedTxHash("");

    try {
      let stellarTxHash: string | undefined;

      // ── ALL methods: send a real Stellar payment through Freighter ──────────
      // This makes every top-up visible on stellar.expert regardless of
      // payment method. The memo identifies the source channel.
      if (!receivingWallet) {
        toast.error("LINGAP receiving wallet is not configured.");
        return;
      }
      if (!connected || !publicKey) {
        toast.error("Connect your Stellar Wallet to continue.");
        await connect();
        return;
      }

      const memoLabel =
        method === "stellar_wallet" ? "LNGP-TOPUP"
        : method === "gcash"        ? "LNGP-TOPUP-GCASH"
        : method === "maya"         ? "LNGP-TOPUP-MAYA"
        :                             "LNGP-TOPUP-PDAX";

      toast("Check your Freighter wallet to sign the top-up.", { icon: "🔐", duration: 8000 });

      const tx = await buildPaymentTransaction(
        publicKey,
        receivingWallet,
        amountXlm.toFixed(7),
        undefined,
        memoLabel,
      );

      let signedXdr: string;
      try {
        signedXdr = await sign(tx.toXDR(), NETWORK_PASSPHRASE);
      } catch (signErr: unknown) {
        const msg = signErr instanceof Error ? signErr.message : String(signErr);
        if (msg.toLowerCase().includes("user declined") || msg.toLowerCase().includes("rejected")) {
          toast.error("Transaction cancelled in Freighter.");
        } else {
          toast.error(`Freighter error: ${msg}`);
        }
        return;
      }

      toast("Submitting to Stellar network...", { icon: "🚀", duration: 6000 });
      const submitResult = await submitSignedTransactionXdr(signedXdr);
      stellarTxHash = submitResult.hash;

      // ── Record in LINGAP backend ─────────────────────────────────────────
      const res = await balanceApi.simulateTopUp({
        paymentMethod: method,
        amountXlm: Number(amountXlm.toFixed(7)),
        senderReference: senderReference.trim() || undefined,
        senderName: senderName.trim() || undefined,
        senderWallet: publicKey,
        stellarTxHash,
      });

      const topUpTx = res.data.data.top_up;
      setConfirmedRef(topUpTx.payment_reference);
      setConfirmedTxHash(topUpTx.stellar_tx_hash || stellarTxHash || "");
      onConfirmed(res.data.data.balance, topUpTx);
      toast.success("Top-up confirmed on Stellar!");
      closeModal();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(err.response?.data?.detail || err.message || "Top-up failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="auth-prompt-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Top up balance"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeModal();
      }}
    >
      <div className="auth-prompt-modal topup-modal" style={{ width: "min(100%, 560px)", textAlign: "left" }}>
        <button
          type="button"
          onClick={closeModal}
          aria-label="Close top-up modal"
          className="auth-prompt-close"
        >
          <X size={19} />
        </button>

        <div className="section-label">LINGAP WALLET</div>
        <h2 style={{ textAlign: "left", fontSize: 24 }}>Top Up Your LINGAP Balance</h2>
        <p style={{ marginLeft: 0, maxWidth: 540 }}>
          Choose a payment channel. Local payment options collect sender details for confirmation; Stellar Wallet sends XLM directly from your connected wallet.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8, marginBottom: 12 }}>
          {methods.map(({ id, title, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setMethod(id);
                setConfirmedRef("");
                setConfirmedTxHash("");
              }}
              className={`btn ${method === id ? "btn-primary" : "btn-outline"}`}
              style={{ height: "auto", justifyContent: "flex-start", alignItems: "flex-start", padding: "11px 12px", textAlign: "left", gap: 9 }}
            >
              <Icon size={18} />
              <span style={{ display: "grid", gap: 3 }}>
                <span style={{ fontWeight: 800, fontSize: 14 }}>{title}</span>
                <span style={{ fontSize: 12, opacity: 0.76 }}>{label}</span>
              </span>
            </button>
          ))}
        </div>

        <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 12, marginBottom: 12, background: "rgba(255,255,255,.45)" }}>
          <div style={{ fontWeight: 800, color: "var(--forest)", marginBottom: 8 }}>
            {method === "stellar_wallet" ? "Source Wallet" : "Payment Source"}
          </div>
          {method === "stellar_wallet" ? (
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ padding: "11px 12px", border: "1px solid var(--border)", borderRadius: 10, background: "var(--bg)", fontSize: 13, color: "var(--forest)", fontWeight: 700, overflowWrap: "anywhere" }}>
                {publicKey || "Connect Stellar Wallet to autofill source wallet"}
              </div>
              <div style={{ fontSize: 12, color: "var(--text3)" }}>
                XLM will move from your connected wallet to the LINGAP receiving wallet.
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              <input
                value={senderReference}
                onChange={(event) => setSenderReference(event.target.value)}
                placeholder={methodSourceLabel(method)}
                style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px", fontSize: 15, boxSizing: "border-box" }}
              />
              {method === "pdax" && (
                <input
                  value={senderName}
                  onChange={(event) => setSenderName(event.target.value)}
                  placeholder="PDAX account name"
                  style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px", fontSize: 15, boxSizing: "border-box" }}
                />
              )}
            </div>
          )}
        </div>

        <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 800, color: "var(--forest)" }}>Amount</div>
              <div style={{ fontSize: 12, color: "var(--text3)" }}>1 XLM = {formatPhp(rate)}</div>
            </div>
            <div style={{ display: "inline-grid", gridTemplateColumns: "1fr 1fr", gap: 4, padding: 3, border: "1px solid var(--border)", borderRadius: 999, background: "var(--bg)" }}>
              <button type="button" className={`btn btn-sm ${mode === "xlm" ? "btn-primary" : "btn-ghost"}`} style={{ borderRadius: 999, minWidth: 58, justifyContent: "center" }} onClick={() => { setMode("xlm"); setAmount(String(XLM_PRESETS[1])); }}>
                XLM
              </button>
              <button type="button" className={`btn btn-sm ${mode === "php" ? "btn-primary" : "btn-ghost"}`} style={{ borderRadius: 999, minWidth: 58, justifyContent: "center" }} onClick={() => { setMode("php"); setAmount(String(PHP_PRESETS[2])); }}>
                PHP
              </button>
            </div>
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
            {formatXlm(amountXlm)} ≈ {formatPhp(amountPhp)}
          </div>
        </div>

        <div style={{ padding: "9px 11px", background: "rgba(74,155,106,.07)", border: "1px solid rgba(74,155,106,.2)", borderRadius: 10, color: "var(--forest)", fontSize: 12, marginBottom: 12, display: "grid", gap: 6 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 800 }}>Receiver</span>
            <span style={{ fontFamily: "Space Mono, monospace", color: "var(--text2)" }}>{shortAddress(receivingWallet)}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 800 }}>Escrow</span>
            <span style={{ fontFamily: "Space Mono, monospace", color: "var(--text2)" }}>{shortAddress(vaultContract)}</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text2)" }}>
            {connected && publicKey ? `Connected source: ${publicKey.slice(0, 6)}...${publicKey.slice(-4)}` : "Connect Stellar Wallet before confirming a top-up."}
          </div>
          {stellarVaultUrl && (
            <a href={stellarVaultUrl} target="_blank" rel="noreferrer" style={{ color: "var(--canopy)", fontWeight: 800, textDecoration: "none" }}>
              Open escrow contract on Stellar
            </a>
          )}
        </div>

        {confirmedRef && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 13, borderRadius: 10, background: "rgba(74,155,106,.09)", color: "var(--forest)", fontSize: 13, marginBottom: 14, flexWrap: "wrap" }}>
            <CheckCircle2 size={16} color="var(--canopy)" /> Payment status: Confirmed · {confirmedRef}
            {confirmedTxHash && (
              <a href={getStellarExpertTxUrl(confirmedTxHash)} target="_blank" rel="noreferrer" style={{ marginLeft: "auto", color: "var(--canopy)", fontWeight: 800, textDecoration: "none" }}>
                View Stellar Tx
              </a>
            )}
          </div>
        )}

        <button type="button" onClick={handleConfirm} disabled={submitting} className="btn btn-emerald btn-lg" style={{ width: "100%", justifyContent: "center" }}>
          {submitting ? "Confirming..." : !connected ? "Connect Wallet to Continue" : method === "stellar_wallet" ? "Send from Stellar Wallet" : "Confirm Top-up"}
        </button>
      </div>
    </div>
  );
}
