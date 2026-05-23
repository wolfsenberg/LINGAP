"use client";

import { useCallback, useEffect, useState } from "react";
import { Vote, ShieldAlert } from "lucide-react";
import { escrowApi } from "@/lib/api";
import { useFreighter } from "@/hooks/useFreighter";
import { useAuthStore } from "@/store/authStore";

const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet"
    ? "Public Global Stellar Network ; September 2015"
    : "Test SDF Network ; September 2015";

const PAUSE_THRESHOLD_PCT = 60;

interface VotingPanelProps {
  campaignId: number | string;
  campaignName?: string;
}

interface VoteState {
  hasVoted: boolean | null;
  voteWeightXdr: string | null;
  loading: boolean;
  error: string | null;
}

function getNumericCampaignId(campaignId: number | string) {
  if (typeof campaignId === "number" && Number.isInteger(campaignId)) return campaignId;
  if (typeof campaignId === "string" && /^\d+$/.test(campaignId)) return Number(campaignId);
  return null;
}

export default function VotingPanel({ campaignId, campaignName }: VotingPanelProps) {
  const { connected, publicKey, connect, sign } = useFreighter();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "admin";
  const numericCampaignId = getNumericCampaignId(campaignId);
  const [vote, setVote] = useState<VoteState>({
    hasVoted: null,
    voteWeightXdr: null,
    loading: true,
    error: null,
  });
  const [txLoading, setTxLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [clawbackLoading, setClawbackLoading] = useState(false);
  const [clawbackHash, setClawbackHash] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (numericCampaignId === null) {
      setVote({
        hasVoted: null,
        voteWeightXdr: null,
        loading: false,
        error: "On-chain voting is not active for this campaign yet.",
      });
      return;
    }

    setVote((state) => ({ ...state, loading: true, error: null }));
    try {
      const res = await escrowApi.getVoteStatus(numericCampaignId, publicKey ?? undefined);
      setVote({
        hasVoted: res.data.data.donor_has_voted,
        voteWeightXdr: res.data.data.campaign_xdr,
        loading: false,
        error: null,
      });
    } catch {
      setVote((state) => ({ ...state, loading: false, error: "Failed to load vote status" }));
    }
  }, [numericCampaignId, publicKey]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  async function handleVote(action: "vote" | "revoke") {
    if (!publicKey || numericCampaignId === null) return;
    setTxLoading(true);
    setTxError(null);
    setTxHash(null);
    try {
      const xdrRes =
        action === "vote"
          ? await escrowApi.getVoteXdr(numericCampaignId, publicKey)
          : await escrowApi.getRevokeVoteXdr(numericCampaignId, publicKey);

      const xdr = xdrRes.data.data.xdr;
      const signedXdr = await sign(xdr, NETWORK_PASSPHRASE);
      const submitRes = await escrowApi.submitSignedXdr(signedXdr);
      setTxHash(submitRes.data.data.tx_hash);
      await fetchStatus();
    } catch (error: unknown) {
      setTxError(error instanceof Error ? error.message : "Transaction failed");
    } finally {
      setTxLoading(false);
    }
  }

  async function handleClawback() {
    if (numericCampaignId === null || !isAdmin) return;
    setClawbackLoading(true);
    setTxError(null);
    try {
      const res = await escrowApi.executeClawback(numericCampaignId);
      setClawbackHash(res.data.data.tx_hash);
      await fetchStatus();
    } catch (error: unknown) {
      setTxError(error instanceof Error ? error.message : "Clawback failed");
    } finally {
      setClawbackLoading(false);
    }
  }

  const hasVoted = vote.hasVoted === true;

  return (
    <div
      className="voting-panel"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r)",
        padding: 24,
      }}
    >
      <div className="voting-panel-head" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, background: "rgba(74,155,106,.1)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Vote size={18} color="var(--canopy)" strokeWidth={1.8} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "var(--forest)" }}>Donor Voting</div>
          {campaignName && <div style={{ fontSize: 12, color: "var(--text3)" }}>{campaignName}</div>}
        </div>
        <span
          className="voting-panel-badge"
          style={{
            marginLeft: "auto",
            background: "rgba(220,38,38,.1)",
            color: "#DC2626",
            border: "1px solid rgba(220,38,38,.25)",
            borderRadius: 20,
            padding: "3px 10px",
            fontSize: 11,
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <ShieldAlert size={10} /> Clawback Protection
        </span>
      </div>

      <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 20, lineHeight: 1.6 }}>
        If you believe this campaign is fraudulent or stalled, vote to pause it. When{" "}
        <strong>{PAUSE_THRESHOLD_PCT}%</strong> of deposited funds vote to pause, the campaign is
        frozen and eligible unspent funds can be refunded proportionally to donors.
      </p>

      {numericCampaignId === null && (
        <div
          style={{
            background: "rgba(200,134,10,.08)",
            border: "1px solid rgba(200,134,10,.24)",
            borderRadius: 10,
            padding: "12px 14px",
            marginBottom: 18,
            fontSize: 13,
            color: "var(--text2)",
            lineHeight: 1.55,
          }}
        >
          This campaign is tracked in LINGAP records, but it does not have a numeric Soroban escrow campaign id yet. Donor voting and clawback controls activate once its escrow contract campaign is registered.
        </div>
      )}

      {vote.loading ? (
        <div style={{ color: "var(--text3)", fontSize: 13, marginBottom: 16 }}>Loading vote status...</div>
      ) : vote.error ? (
        <div style={{ color: numericCampaignId === null ? "var(--amber)" : "#DC2626", fontSize: 13, marginBottom: 16 }}>
          {vote.error}
        </div>
      ) : (
        <div
          style={{
            background: "var(--bg2)",
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 20,
            border: "1px solid var(--border)",
          }}
        >
          <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 6 }}>YOUR VOTE STATUS</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: hasVoted ? "#DC2626" : "var(--text3)",
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--forest)" }}>
              {vote.hasVoted === null ? "Connect wallet to check" : hasVoted ? "You have voted to pause" : "You have not voted"}
            </span>
          </div>
        </div>
      )}

      <div
        style={{
          background: "rgba(220,38,38,.05)",
          border: "1px dashed rgba(220,38,38,.25)",
          borderRadius: 8,
          padding: "10px 14px",
          marginBottom: 20,
          fontSize: 13,
          color: "var(--text2)",
        }}
      >
        <strong style={{ color: "#DC2626" }}>{PAUSE_THRESHOLD_PCT}% quorum</strong> of deposited
        XLM weight is required before admin clawback can execute.
      </div>

      {numericCampaignId !== null && (!connected ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={connect}
            style={{
              width: "100%",
              padding: "10px 0",
              background: "var(--forest)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Connect Freighter Wallet
          </button>
          {isAdmin && <AdminClawbackButton loading={clawbackLoading} onClick={handleClawback} />}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {!hasVoted ? (
            <button
              onClick={() => handleVote("vote")}
              disabled={txLoading}
              style={{
                padding: "10px 0",
                background: txLoading ? "var(--text3)" : "#DC2626",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                cursor: txLoading ? "not-allowed" : "pointer",
                width: "100%",
              }}
            >
              {txLoading ? "Waiting for signature..." : "Vote to Pause Campaign"}
            </button>
          ) : (
            <button
              onClick={() => handleVote("revoke")}
              disabled={txLoading}
              style={{
                padding: "10px 0",
                background: txLoading ? "var(--text3)" : "transparent",
                color: txLoading ? "#fff" : "#DC2626",
                border: "1px solid #DC2626",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                cursor: txLoading ? "not-allowed" : "pointer",
                width: "100%",
              }}
            >
              {txLoading ? "Waiting for signature..." : "Revoke My Vote"}
            </button>
          )}

          {isAdmin && <AdminClawbackButton loading={clawbackLoading} onClick={handleClawback} />}
        </div>
      ))}

      {txHash && (
        <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(74,155,106,.08)", border: "1px solid rgba(74,155,106,.25)", borderRadius: 8, fontSize: 12, color: "var(--canopy)" }}>
          Transaction confirmed: <span style={{ fontFamily: "monospace", wordBreak: "break-all" }}>{txHash}</span>
        </div>
      )}
      {clawbackHash && (
        <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(74,155,106,.08)", border: "1px solid rgba(74,155,106,.25)", borderRadius: 8, fontSize: 12, color: "var(--canopy)" }}>
          Clawback executed: <span style={{ fontFamily: "monospace", wordBreak: "break-all" }}>{clawbackHash}</span>
        </div>
      )}
      {txError && (
        <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.25)", borderRadius: 8, fontSize: 12, color: "#DC2626" }}>
          {txError}
        </div>
      )}
    </div>
  );
}

function AdminClawbackButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        padding: "10px 0",
        background: loading ? "var(--text3)" : "rgba(220,38,38,.1)",
        color: loading ? "#fff" : "#DC2626",
        border: "1px solid rgba(220,38,38,.25)",
        borderRadius: 8,
        fontWeight: 600,
        fontSize: 13,
        cursor: loading ? "not-allowed" : "pointer",
        width: "100%",
      }}
    >
      {loading ? "Processing clawback..." : "Execute Clawback"}
    </button>
  );
}
