"use client";

import { useState, useEffect, useCallback } from "react";
import { escrowApi } from "@/lib/api";
import { useFreighter } from "@/hooks/useFreighter";
import { Vote, ShieldAlert } from "lucide-react";

const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet"
    ? "Public Global Stellar Network ; September 2015"
    : "Test SDF Network ; September 2015";

// 60% threshold mirrors the contract constant.
const PAUSE_THRESHOLD_PCT = 60;

interface VotingPanelProps {
  campaignId: number;
  campaignName?: string;
}

interface VoteState {
  hasVoted: boolean | null;
  voteWeightXdr: string | null;
  loading: boolean;
  error: string | null;
}

export default function VotingPanel({ campaignId, campaignName }: VotingPanelProps) {
  const { connected, publicKey, connect, sign } = useFreighter();
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
    setVote((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await escrowApi.getVoteStatus(campaignId, publicKey ?? undefined);
      setVote({
        hasVoted: res.data.data.donor_has_voted,
        voteWeightXdr: res.data.data.campaign_xdr,
        loading: false,
        error: null,
      });
    } catch {
      setVote((s) => ({ ...s, loading: false, error: "Failed to load vote status" }));
    }
  }, [campaignId, publicKey]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  async function handleVote(action: "vote" | "revoke") {
    if (!publicKey) return;
    setTxLoading(true);
    setTxError(null);
    setTxHash(null);
    try {
      const xdrRes =
        action === "vote"
          ? await escrowApi.getVoteXdr(campaignId, publicKey)
          : await escrowApi.getRevokeVoteXdr(campaignId, publicKey);

      const xdr = xdrRes.data.data.xdr;
      const signedXdr = await sign(xdr, NETWORK_PASSPHRASE);
      const submitRes = await escrowApi.submitSignedXdr(signedXdr);
      setTxHash(submitRes.data.data.tx_hash);
      await fetchStatus();
    } catch (e: unknown) {
      setTxError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setTxLoading(false);
    }
  }

  async function handleClawback() {
    setClawbackLoading(true);
    setTxError(null);
    try {
      const res = await escrowApi.executeClawback(campaignId);
      setClawbackHash(res.data.data.tx_hash);
      await fetchStatus();
    } catch (e: unknown) {
      setTxError(e instanceof Error ? e.message : "Clawback failed");
    } finally {
      setClawbackLoading(false);
    }
  }

  const hasVoted = vote.hasVoted === true;

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r)",
        padding: 24,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, background: "rgba(74,155,106,.1)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Vote size={18} color="var(--canopy)" strokeWidth={1.8} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "var(--forest)" }}>
            Donor Voting
          </div>
          {campaignName && (
            <div style={{ fontSize: 12, color: "var(--text3)" }}>{campaignName}</div>
          )}
        </div>
        <span
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
        automatically frozen and unspent funds can be refunded proportionally to all donors.
      </p>

      {/* Vote status */}
      {vote.loading ? (
        <div style={{ color: "var(--text3)", fontSize: 13, marginBottom: 16 }}>
          Loading vote status…
        </div>
      ) : vote.error ? (
        <div style={{ color: "#DC2626", fontSize: 13, marginBottom: 16 }}>{vote.error}</div>
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
          <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 6 }}>
            YOUR VOTE STATUS
          </div>
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
              {vote.hasVoted === null
                ? "Connect wallet to check"
                : hasVoted
                ? "You have voted to pause"
                : "You have not voted"}
            </span>
          </div>
        </div>
      )}

      {/* Threshold info */}
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
        XLM weight required to trigger an auto-pause and unlock clawback.
      </div>

      {/* Actions */}
      {!connected ? (
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
              {txLoading ? "Waiting for signature…" : "Vote to Pause Campaign"}
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
              {txLoading ? "Waiting for signature…" : "Revoke My Vote"}
            </button>
          )}

          {/* Clawback — only shown after quorum */}
          <button
            onClick={handleClawback}
            disabled={clawbackLoading}
            style={{
              padding: "10px 0",
              background: clawbackLoading ? "var(--text3)" : "rgba(220,38,38,.1)",
              color: clawbackLoading ? "#fff" : "#DC2626",
              border: "1px solid rgba(220,38,38,.25)",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 13,
              cursor: clawbackLoading ? "not-allowed" : "pointer",
              width: "100%",
            }}
          >
            {clawbackLoading ? "Processing clawback…" : "Execute Clawback (Admin)"}
          </button>
        </div>
      )}

      {/* Tx feedback */}
      {txHash && (
        <div
          style={{
            marginTop: 14,
            padding: "10px 14px",
            background: "rgba(74,155,106,.08)",
            border: "1px solid rgba(74,155,106,.25)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--canopy)",
          }}
        >
          Transaction confirmed:{" "}
          <span style={{ fontFamily: "monospace", wordBreak: "break-all" }}>{txHash}</span>
        </div>
      )}
      {clawbackHash && (
        <div
          style={{
            marginTop: 14,
            padding: "10px 14px",
            background: "rgba(74,155,106,.08)",
            border: "1px solid rgba(74,155,106,.25)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--canopy)",
          }}
        >
          Clawback executed:{" "}
          <span style={{ fontFamily: "monospace", wordBreak: "break-all" }}>{clawbackHash}</span>
        </div>
      )}
      {txError && (
        <div
          style={{
            marginTop: 14,
            padding: "10px 14px",
            background: "rgba(220,38,38,.08)",
            border: "1px solid rgba(220,38,38,.25)",
            borderRadius: 8,
            fontSize: 12,
            color: "#DC2626",
          }}
        >
          {txError}
        </div>
      )}
    </div>
  );
}
