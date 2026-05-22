"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flag,
  Link2,
  Lock,
  Search,
  ShieldCheck,
  Star,
  TrendingUp,
} from "lucide-react";
import { campaignsApi, type CampaignEscrowApi } from "@/lib/api";
import { CAMPAIGNS } from "@/lib/campaigns";
import { getStellarExpertTxUrl } from "@/lib/stellar";

function formatPeso(amount: number) {
  return `₱${Math.round(amount).toLocaleString()}`;
}

function formatXlm(amount: number) {
  return `${amount.toLocaleString(undefined, { maximumFractionDigits: 7 })} XLM`;
}

function shortHash(hash: string) {
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

function getInitialCampaignId() {
  if (typeof window === "undefined") return CAMPAIGNS[0].slug;
  return new URLSearchParams(window.location.search).get("campaign") || CAMPAIGNS[0].slug;
}

export default function EscrowPage() {
  const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet" ? "public" : "testnet";
  const donationVaultContract = process.env.NEXT_PUBLIC_CONTRACT_DONATION_VAULT;
  const contractExplorerUrl = donationVaultContract
    ? `https://stellar.expert/explorer/${network}/contract/${donationVaultContract}`
    : `https://stellar.expert/explorer/${network}`;

  const [campaignId, setCampaignId] = useState(CAMPAIGNS[0].slug);
  const [escrow, setEscrow] = useState<CampaignEscrowApi | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCampaignId(getInitialCampaignId());
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadEscrow() {
      try {
        const res = await campaignsApi.escrow(campaignId);
        if (mounted) setEscrow(res.data.data);
      } catch {
        if (mounted) setEscrow(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    setLoading(true);
    loadEscrow();
    const timer = window.setInterval(loadEscrow, 10000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [campaignId]);

  const campaign = escrow?.campaign;
  const summary = escrow?.summary;
  const transactions = escrow?.transactions ?? [];
  const activeContractUrl = transactions[0]
    ? getStellarExpertTxUrl(transactions[0].stellar_tx_hash)
    : contractExplorerUrl;

  const chainSteps = useMemo(
    () => [
      {
        cls: transactions.length ? "cs-done" : "cs-active",
        Icon: ArrowDownToLine,
        label: "Confirmed\nDonations",
        sub: summary ? `${summary.confirmed_donation_count} tx` : "Waiting",
      },
      {
        cls: transactions.length ? "cs-done" : "",
        Icon: Lock,
        label: "Escrow\nTracked",
        sub: summary ? formatPeso(summary.locked_php) : "No funds",
      },
      {
        cls: summary?.released_php ? "cs-done" : "cs-active",
        Icon: CheckCircle2,
        label: "Milestone\nReview",
        sub: summary?.released_php ? "Verified" : "Pending",
      },
      {
        cls: summary?.released_php ? "cs-done" : "",
        Icon: TrendingUp,
        label: "Institution\nRelease",
        sub: summary?.released_php ? formatPeso(summary.released_php) : "Not yet",
      },
      {
        cls: "",
        Icon: Flag,
        label: "Final\nProof",
        sub: "Pending",
      },
    ],
    [summary, transactions.length]
  );

  return (
    <div>
      <div className="esc-hero" style={{ position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -40, top: -40, width: 300, height: 300, background: "radial-gradient(circle,rgba(16,184,145,.2),transparent 70%)", pointerEvents: "none" }} />
        <div className="container">
          <div className="esc-hero-head" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <div style={{ width: 72, height: 72, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <img
                src="/images/protectingfunds.png"
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
              />
            </div>
            <div>
              <div className="section-label" style={{ color: "var(--canopy-light)" }}>ESCROW VAULT</div>
              <h1 style={{ fontSize: 32, fontWeight: 800, color: "#fff" }}>
                {campaign?.title || "Campaign Escrow Dashboard"}
              </h1>
            </div>
          </div>
          <p style={{ color: "rgba(255,255,255,.65)", fontSize: 16, marginBottom: 24 }}>
            Campaign-specific escrow records. Totals below come from confirmed Stellar transaction hashes recorded by LINGAP.
          </p>
          <div className="flex gap-12 esc-hero-badges" style={{ flexWrap: "wrap" }}>
            <span className="badge badge-emerald"><Star size={11} /> Stellar {network === "public" ? "Mainnet" : "Testnet"}</span>
            <a href={contractExplorerUrl} target="_blank" rel="noreferrer" style={{ background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,.85)", display: "inline-flex", alignItems: "center", gap: 5, textDecoration: "none" }}>
              <Link2 size={11} /> Donation Vault Contract
            </a>
            <span style={{ background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,.85)", display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Search size={11} /> Publicly Auditable
            </span>
          </div>
        </div>
      </div>

      <div className="esc-grid">
        {[
          { color: "var(--canopy)", label: "TOTAL ESCROWED", value: summary ? formatPeso(summary.total_escrowed_php) : "₱0", Icon: Lock, sub: summary ? formatXlm(summary.total_escrowed_xlm) : "0 XLM" },
          { color: "var(--amber)", label: "RELEASED", value: summary ? formatPeso(summary.released_php) : "₱0", Icon: TrendingUp, sub: "verified milestone releases" },
          { color: "var(--forest-mid)", label: "LOCKED / PENDING", value: summary ? formatPeso(summary.locked_php) : "₱0", Icon: Clock, sub: "awaiting milestone proof" },
          { color: "#DC2626", label: "CONFIRMED TXS", value: summary ? summary.confirmed_donation_count.toString() : "0", Icon: ShieldCheck, sub: "Stellar-verified donations only" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex flex-center flex-between" style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: "var(--text3)", fontWeight: 700, letterSpacing: .4 }}>{s.label}</div>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: `color-mix(in srgb, ${s.color} 12%, white)`, color: s.color, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid color-mix(in srgb, ${s.color} 22%, transparent)` }}>
                <s.Icon size={14} strokeWidth={1.9} />
              </div>
            </div>
            <div className="stat-value" style={{ color: "var(--forest)" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, display: "inline-block", flexShrink: 0 }} />{s.sub}
            </div>
          </div>
        ))}
      </div>

      <div className="blockchain-viz">
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 28, marginBottom: 24 }}>
          <div className="flex flex-center flex-between mb-24 panel-toolbar">
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--forest)", display: "flex", alignItems: "center", gap: 8 }}>
              <Link2 size={18} color="var(--canopy)" strokeWidth={1.8} /> Escrow Release Flow
            </h3>
            {campaign && (
              <Link href={`/detail/${campaign.slug}`} className="btn btn-outline btn-sm">
                Back to Campaign
              </Link>
            )}
          </div>
          {loading ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--text3)" }}>Loading escrow records...</div>
          ) : !escrow ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--text3)" }}>
              No escrow record found for this campaign yet.
            </div>
          ) : (
            <div className="chain-steps" style={{ justifyContent: "center" }}>
              {chainSteps.map((step, i, arr) => (
                <div key={step.label} style={{ display: "contents" }}>
                  <div className={`chain-step ${step.cls}`}>
                    <div className="cs-icon"><step.Icon size={16} strokeWidth={1.8} /></div>
                    <div className="cs-label" style={{ whiteSpace: "pre-line" }}>{step.label}</div>
                    <div style={{ fontSize: 10, color: step.cls === "cs-done" ? "var(--canopy)" : step.cls === "cs-active" ? "var(--forest-mid)" : "var(--text3)", marginTop: 4 }}>{step.sub}</div>
                  </div>
                  {i < arr.length - 1 && <div className="chain-connector" style={{ flex: 1, height: 2, background: i < Math.max(transactions.length ? 2 : 0, 0) ? "var(--canopy)" : "var(--border)", alignSelf: "center", minWidth: 40 }} />}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 28 }}>
          <div className="flex flex-center flex-between mb-20 panel-toolbar">
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--forest)", display: "flex", alignItems: "center", gap: 8 }}>
              <Search size={18} color="var(--canopy)" strokeWidth={1.8} /> Confirmed Stellar Transactions
            </h3>
            <a href={activeContractUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
              View on Stellar Explorer <ExternalLink size={13} />
            </a>
          </div>

          {transactions.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--text3)", border: "1px dashed var(--border2)", borderRadius: 12 }}>
              No confirmed Stellar donations for this campaign yet. Once a donor completes a Freighter transaction and the backend verifies the tx hash, it will appear here.
            </div>
          ) : (
            transactions.map((tx) => (
              <a
                key={tx.stellar_tx_hash}
                href={getStellarExpertTxUrl(tx.stellar_tx_hash)}
                target="_blank"
                rel="noreferrer"
                className="tx-card"
                style={{ textDecoration: "none" }}
              >
                <div className="tx-icon" style={{ background: "rgba(74,155,106,.1)", color: "var(--canopy)" }}>
                  <CheckCircle2 size={18} strokeWidth={1.8} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "var(--forest)" }}>
                    Donation Received - Escrow Tracked
                  </div>
                  <div className="tx-hash">
                    STELLAR:{shortHash(tx.stellar_tx_hash)} - {new Date(tx.created_at).toLocaleString()}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <span className="badge badge-emerald" style={{ fontSize: 11 }}>Confirmed on Stellar</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="tx-amount" style={{ color: "var(--canopy)" }}>{formatPeso(tx.amount_php)}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)" }}>{formatXlm(tx.amount)}</div>
                </div>
              </a>
            ))
          )}

          <div style={{ marginTop: 20, padding: 16, background: "var(--bg)", borderRadius: 10, border: "1px dashed var(--border2)", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <ShieldCheck size={20} color="var(--canopy)" strokeWidth={1.8} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>
              <strong style={{ color: "var(--forest)" }}>This view is campaign-specific and centralized.</strong> It only displays donations recorded in the backend with confirmed Stellar transaction hashes, so every visible entry can be checked on Stellar Explorer.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
