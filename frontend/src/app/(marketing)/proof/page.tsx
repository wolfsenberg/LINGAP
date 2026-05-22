"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bot,
  Camera,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Receipt,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { campaignsApi, type ProofCenterApi } from "@/lib/api";
import { getStellarExpertTxUrl } from "@/lib/stellar";

type Filter = "All" | "Transactions" | "Receipts" | "Photos" | "Documents";

function formatPeso(amount: number) {
  return `₱${Math.round(amount).toLocaleString()}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function shortHash(hash?: string | null) {
  if (!hash) return "No Stellar anchor";
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

function iconForKind(kind: string) {
  if (kind === "stellar_transaction") return ShieldCheck;
  if (kind === "receipt" || kind === "invoice") return Receipt;
  if (kind === "photo") return Camera;
  return FileText;
}

function matchesFilter(item: ProofCenterApi["documents"][number], filter: Filter) {
  if (filter === "All") return true;
  if (filter === "Transactions") return item.source === "confirmed_donation";
  if (filter === "Receipts") return ["receipt", "invoice"].includes(item.kind);
  if (filter === "Photos") return item.kind === "photo";
  if (filter === "Documents") return !["stellar_transaction", "receipt", "invoice", "photo"].includes(item.kind);
  return true;
}

export default function ProofPage() {
  const [proofCenter, setProofCenter] = useState<ProofCenterApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("All");

  useEffect(() => {
    let mounted = true;

    async function loadProofCenter() {
      try {
        const res = await campaignsApi.proofCenter();
        if (mounted) setProofCenter(res.data.data);
      } catch {
        if (mounted) setProofCenter(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProofCenter();
    const timer = window.setInterval(loadProofCenter, 10000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const documents = proofCenter?.documents ?? [];
  const filteredDocuments = useMemo(
    () => documents.filter((item) => matchesFilter(item, filter)),
    [documents, filter]
  );
  const riskFeed = proofCenter?.risk_feed ?? [];
  const stats = proofCenter?.stats;

  return (
    <div>
      <div style={{ background: "var(--forest)", padding: "48px 40px" }}>
        <div className="container">
          <div className="section-label" style={{ color: "var(--canopy-light)" }}>VERIFICATION CENTER</div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: "#fff", marginBottom: 12 }}>Proof of Progress & Reality</h1>
          <p style={{ color: "rgba(255,255,255,.65)", fontSize: 16 }}>
            Live verification records from confirmed Stellar transactions and anchored proof documents.
          </p>
        </div>
      </div>

      <div className="page-inner">
        <div className="grid-4 mb-32">
          {[
            { label: "Verified Proofs", value: stats?.verified_documents ?? 0, sub: "confirmed txs + anchored docs", Icon: ShieldCheck, color: "var(--canopy)" },
            { label: "Stellar Donations", value: stats?.confirmed_donations ?? 0, sub: "blockchain-confirmed", Icon: CheckCircle2, color: "var(--forest-light)" },
            { label: "Anchored Docs", value: stats?.anchored_documents ?? 0, sub: "documents with tx anchors", Icon: FileText, color: "var(--amber)" },
            { label: "Verified Amount", value: formatPeso(stats?.verified_amount_php ?? 0), sub: "from confirmed donations", Icon: Receipt, color: "var(--canopy)" },
          ].map((item) => (
            <div key={item.label} className="stat-card">
              <div className="flex flex-center flex-between" style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: "var(--text3)", fontWeight: 700, letterSpacing: .4 }}>{item.label}</div>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: `color-mix(in srgb, ${item.color} 12%, white)`, color: item.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <item.Icon size={14} strokeWidth={1.9} />
                </div>
              </div>
              <div className="stat-value" style={{ color: "var(--forest)" }}>{item.value}</div>
              <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 6 }}>{item.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 24, marginBottom: 28 }}>
          <div className="flex flex-center gap-12 mb-20">
            <div style={{ width: 40, height: 40, background: "rgba(74,155,106,.1)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bot size={20} color="var(--canopy)" strokeWidth={1.8} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--forest)" }}>Live Verification Feed</h3>
          </div>

          {loading ? (
            <div style={{ padding: 24, color: "var(--text3)", textAlign: "center" }}>Loading proof records...</div>
          ) : riskFeed.length === 0 ? (
            <div className="ai-alert ai-alert-med">
              <div className="flex flex-center gap-8 mb-4">
                <span className="badge badge-gold" style={{ fontSize: 11, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Clock size={10} /> AWAITING PROOF
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--forest)" }}>No campaign proof records yet</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--text2)" }}>
                Once donations are confirmed or documents are anchored on-chain, they will appear here.
              </div>
            </div>
          ) : (
            riskFeed.map((item) => {
              const isVerified = item.level === "LOW RISK";
              return (
                <div key={item.campaign_id} className={`ai-alert ${isVerified ? "ai-alert-low" : "ai-alert-med"} mb-8`}>
                  <div className="flex flex-center flex-between mb-4">
                    <div className="flex flex-center gap-8">
                      <span className={`badge ${isVerified ? "badge-emerald" : "badge-gold"}`} style={{ fontSize: 11, display: "inline-flex", alignItems: "center", gap: 4 }}>
                        {isVerified ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />}
                        {item.level}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--forest)" }}>{item.campaign_title}</span>
                    </div>
                    <span style={{ fontSize: 12, color: "var(--text3)" }}>{formatDate(item.created_at)}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text2)" }}>
                    {item.status} {item.confidence > 0 ? `Confidence: ${item.confidence}%` : ""}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex flex-center flex-between mb-20">
          <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--forest)", display: "flex", alignItems: "center", gap: 8 }}>
            <ShieldCheck size={20} color="var(--canopy)" strokeWidth={1.8} /> Verified Proof Records
          </h3>
          <div className="flex gap-8">
            {(["All", "Transactions", "Receipts", "Photos", "Documents"] as Filter[]).map((item) => (
              <button key={item} onClick={() => setFilter(item)} className={`filter-chip${filter === item ? " active" : ""}`}>
                {item}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text3)" }}>Loading proof records...</div>
        ) : filteredDocuments.length === 0 ? (
          <div style={{ background: "var(--surface)", border: "1px dashed var(--border2)", borderRadius: "var(--r)", padding: 36, textAlign: "center", color: "var(--text2)" }}>
            <ShieldCheck size={34} color="var(--canopy)" style={{ marginBottom: 12 }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--forest)", marginBottom: 8 }}>No verified proof records yet</h3>
            <p style={{ maxWidth: 560, margin: "0 auto", lineHeight: 1.6 }}>
              Proof Center only shows real backend records: confirmed Stellar donations and uploaded documents with on-chain anchors. Nothing is faked here.
            </p>
          </div>
        ) : (
          <div className="proof-grid">
            {filteredDocuments.map((proof) => {
              const Icon = iconForKind(proof.kind);
              const isTx = proof.source === "confirmed_donation";
              const txHref = proof.stellar_tx_hash ? getStellarExpertTxUrl(proof.stellar_tx_hash) : undefined;
              return (
                <div key={proof.id} className="proof-card">
                  <div className="proof-thumb" style={{ background: isTx ? "linear-gradient(135deg,rgba(74,155,106,.1),rgba(61,122,82,.1))" : "linear-gradient(135deg,rgba(200,134,10,.1),rgba(160,113,74,.1))" }}>
                    <Icon size={48} strokeWidth={1.2} />
                    <div style={{ position: "absolute", top: 10, right: 10 }}>
                      <span className="badge badge-emerald" style={{ fontSize: 11 }}>{proof.status}</span>
                    </div>
                  </div>
                  <div className="proof-body">
                    <div style={{ fontWeight: 600, fontSize: 14, color: "var(--forest)", marginBottom: 4 }}>{proof.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 10 }}>
                      {proof.campaign_title} · {formatDate(proof.created_at)}
                    </div>
                    <div className="flex flex-center flex-between" style={{ gap: 8 }}>
                      <span className="badge badge-navy" style={{ fontSize: 11 }}>{formatPeso(proof.claimed_amount)}</span>
                      {txHref ? (
                        <a href={txHref} target="_blank" rel="noreferrer" className="badge badge-emerald" style={{ fontSize: 11, textDecoration: "none" }}>
                          {shortHash(proof.stellar_tx_hash)} <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span className="badge badge-gold" style={{ fontSize: 11 }}>No anchor</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 28, marginTop: 28 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--forest)", marginBottom: 20 }}>Badge Verification System</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 12 }}>
            {[
              { Icon: CheckCircle2, text: "VERIFIED", bg: "rgba(74,155,106,.06)", border: "rgba(74,155,106,.2)", color: "var(--forest-light)" },
              { Icon: Clock, text: "AWAITING PROOF", bg: "rgba(200,134,10,.06)", border: "rgba(200,134,10,.2)", color: "var(--amber)" },
              { Icon: AlertTriangle, text: "FLAGGED", bg: "rgba(220,38,38,.06)", border: "rgba(220,38,38,.2)", color: "#991B1B" },
              { Icon: ShieldCheck, text: "STELLAR CONFIRMED", bg: "rgba(74,155,106,.06)", border: "rgba(74,155,106,.2)", color: "var(--forest-light)" },
              { Icon: FileText, text: "DOC ANCHORED", bg: "rgba(200,134,10,.06)", border: "rgba(200,134,10,.2)", color: "var(--amber)" },
              { Icon: XCircle, text: "NOT SHOWN IF FAKE", bg: "rgba(220,38,38,.06)", border: "rgba(220,38,38,.2)", color: "#991B1B" },
            ].map((badge) => (
              <div key={badge.text} style={{ textAlign: "center", padding: 16, background: badge.bg, border: `1px solid ${badge.border}`, borderRadius: 12 }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                  <badge.Icon size={28} color={badge.color} strokeWidth={1.5} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: badge.color }}>{badge.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
