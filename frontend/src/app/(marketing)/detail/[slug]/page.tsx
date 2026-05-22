"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useFreighter } from "@/hooks/useFreighter";
import { donationsApi } from "@/lib/api";
import {
  STELLAR_CONFIG,
  buildPaymentTransaction,
  getStellarExpertTxUrl,
  submitSignedTransactionXdr,
} from "@/lib/stellar";
import toast from "react-hot-toast";
import VotingPanel from "@/components/stellar/VotingPanel";
import { CAMPAIGNS } from "@/lib/campaigns";
import {
  AlertCircle, CheckCircle2, Lock, Star, Handshake, MapPin, Calendar,
  Home, Cat, PawPrint, ShieldCheck, Clock, Users,
  Facebook, MessageCircle, Music2, RefreshCw, Target, Banknote
} from "lucide-react";

const AMOUNTS = [100, 250, 500, 1000, 5000];
const DEMO_XLM_TO_PHP = 10;
const LINGAP_RECEIVER_PUBLIC_KEY = process.env.NEXT_PUBLIC_LINGAP_RECEIVER_PUBLIC_KEY || "";

type FreighterSignResult =
  | string
  | {
      signedTxXdr?: string;
      signedTxXDR?: string;
      error?: string;
    };

function getDonationErrorMessage(error: unknown) {
  const err = error as { message?: string; response?: { data?: { detail?: string } } };
  return err.response?.data?.detail || err.message || "Donation failed";
}

function formatXlmAmount(amount: number) {
  return amount.toFixed(7).replace(/\.?0+$/, "");
}

function getSignedXdr(signResult: FreighterSignResult) {
  if (typeof signResult === "string") return signResult;
  if (signResult.error) throw new Error(signResult.error);
  return signResult.signedTxXdr ?? signResult.signedTxXDR;
}

function truncateMemo(value: string) {
  const maxBytes = 28;
  const encoder = new TextEncoder();
  if (encoder.encode(value).length <= maxBytes) return value;

  const suffix = "...";
  let output = "";
  for (const char of value) {
    if (encoder.encode(`${output}${char}${suffix}`).length > maxBytes) break;
    output += char;
  }
  return `${output.trimEnd()}${suffix}`;
}

function getDonationMemo(campaignTitle: string, amount: number) {
  const safeTitle = campaignTitle.replace(/[^a-zA-Z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  return truncateMemo(`${formatXlmAmount(amount)}XLM ${safeTitle}`);
}

export default function DetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const campaign = CAMPAIGNS.find((c) => c.slug === slug);
  const { connected, publicKey, connect } = useFreighter();
  const [selectedAmount, setSelectedAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [donating, setDonating] = useState(false);
  const [confirmedDonationXlm, setConfirmedDonationXlm] = useState(0);
  const [lastTxHash, setLastTxHash] = useState("");

  const [dbCampaign, setDbCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(!campaign && !!slug);
  const [error, setError] = useState(false);


  useEffect(() => {
    if (!campaign && slug) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      fetch(`${baseUrl}/api/v1/aid-requests/${slug}`)
        .then((res) => {
          if (!res.ok) throw new Error("Not found");
          return res.json();
        })
        .then((data) => {
          setDbCampaign({
            id: data.id,
            slug: data.id,
            category: "Community",
            urgencyLabel: "Active",
            urgencyClass: "badge-blue",
            title: `Aid Request for ${data.beneficiary_name}`,
            shortTitle: `Aid for ${data.beneficiary_name}`,
            description: data.purpose,
            story: [data.purpose],
            organizer: data.beneficiary_name,
            location: "Local Community",
            startDate: new Date().toLocaleDateString(),
            institution: "LINGAP Network",
            institutionBadge: "Verified Recipient",
            institutionDesc: "Community Verified",
            raisedLabel: `0 ${data.asset}`,
            raised: 0,
            goal: data.requested_amount,
            goalLabel: `${data.requested_amount} ${data.asset}`,
            asset: data.asset,
            donors: 0,
            daysLeft: 30,
            pct: 0,
            credibility: 8.5,
            transparencyScore: 85,
            heroGradient: "linear-gradient(135deg,#1a2a3a,#2d4a6a)",
            heroIcon: "🏠",
            accentColor: "var(--canopy)",
            spending: [
              { label: "Core Need", pct: 100, amount: `${data.requested_amount} ${data.asset}`, bg: "linear-gradient(90deg,var(--forest),var(--forest-light))" }
            ],
            milestones: [
              { dot: "ml-dot-active", title: `Status: ${data.status.toUpperCase()}`, sub: "Currently tracked on-chain.", badge: "badge-blue", badgeText: data.status }
            ],
          });
          setLoading(false);
        })
        .catch(() => {
          setError(true);
          setLoading(false);
        });
    }
  }, [campaign, slug]);

  const activeCampaign: any = campaign || dbCampaign;

  if (loading) return <div style={{ padding: 100, textAlign: "center", color: "var(--forest)", fontWeight: 600 }}>Loading campaign details...</div>;
  if (!activeCampaign || error) return notFound();

  const Icon =
    activeCampaign.heroIcon === "🏠" ? Home
    : activeCampaign.heroIcon === "🐱" ? Cat
    : PawPrint;

  const progressColor = activeCampaign.category === "Animal Rescue" ? "prog-gold" : "prog-emerald";
  const accentHex = activeCampaign.category === "Animal Rescue" ? "var(--amber)" : "var(--canopy)";


  const effectiveAmount = useCustom ? parseFloat(customAmount) || 0 : selectedAmount;
  const usesXlmGoal = activeCampaign.asset === "XLM" || /XLM/i.test(activeCampaign.goalLabel || "");
  const displayRaised = activeCampaign.raised + confirmedDonationXlm * (usesXlmGoal ? 1 : DEMO_XLM_TO_PHP);
  const displayRaisedLabel = usesXlmGoal
    ? `${displayRaised.toLocaleString()} XLM`
    : `₱${Math.round(displayRaised).toLocaleString()}`;
  const displayPct = Math.min(100, Math.round((displayRaised / activeCampaign.goal) * 100));
  const displayDonors = activeCampaign.donors + (confirmedDonationXlm > 0 ? 1 : 0);

  async function handleDonate() {
    if (!connected || !publicKey) {
      await connect();
      return;
    }
    if (effectiveAmount <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    if (!LINGAP_RECEIVER_PUBLIC_KEY) {
      toast.error("LINGAP receiving wallet is not configured yet.");
      return;
    }
    setDonating(true);
    try {
      const memo = getDonationMemo(activeCampaign.title, effectiveAmount);
      const transaction = await buildPaymentTransaction(
        publicKey,
        LINGAP_RECEIVER_PUBLIC_KEY,
        formatXlmAmount(effectiveAmount),
        undefined,
        memo
      );
      const { signTransaction } = await import("@stellar/freighter-api");
      const signResult = (await signTransaction(transaction.toXDR(), {
        networkPassphrase: STELLAR_CONFIG.network,
      })) as FreighterSignResult;
      const signedXdr = getSignedXdr(signResult);
      if (!signedXdr) throw new Error("Freighter did not return a signed transaction.");
      const submitRes = await submitSignedTransactionXdr(signedXdr);
      const txHash = submitRes.hash;
      await donationsApi.create({
        amount: effectiveAmount,
        asset: "XLM",
        purpose: `campaign:${activeCampaign.slug || activeCampaign.id}`,
        stellarTxHash: txHash,
      });
      setConfirmedDonationXlm((current) => current + effectiveAmount);
      setLastTxHash(txHash);
      toast.success(`Donation confirmed! Tx: ${txHash.slice(0, 8)}…`);
    } catch (e: unknown) {
      toast.error(getDonationErrorMessage(e));
    } finally {
      setDonating(false);
    }
  }

  return (
    <div style={{ background: `linear-gradient(180deg,var(--forest) 300px, var(--bg) 300px)` }}>
      <div className="detail-grid">
        {/* LEFT */}
        <div>
          {/* Hero image */}
          <div className="detail-img" style={{ background: activeCampaign.heroGradient }}>
            <Icon size={80} color="rgba(255,255,255,.6)" strokeWidth={1.2} />
          </div>

          {/* Badges */}
          <div className="flex gap-8 mb-16" style={{ flexWrap: "wrap" }}>
            {activeCampaign.urgencyLabel && (
              <span className={`badge ${activeCampaign.urgencyClass}`}>
                <AlertCircle size={11} /> {activeCampaign.urgencyLabel}
              </span>
            )}
            <span className="badge badge-emerald"><CheckCircle2 size={11} /> Blockchain Verified</span>
            <span className="badge badge-navy"><Banknote size={11} /> Institution Bound</span>
            <span className="badge badge-gold"><Star size={11} /> Credibility: {activeCampaign.credibility}/10</span>
          </div>

          {/* Title */}
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--forest)", marginBottom: 12, lineHeight: 1.2 }}>
            {activeCampaign.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-center gap-16 mb-24" style={{ color: "var(--text2)", fontSize: 14, flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Handshake size={14} /> Organized by: {activeCampaign.organizer}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <MapPin size={14} /> {activeCampaign.location}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Calendar size={14} /> Started: {activeCampaign.startDate}
            </span>
          </div>

          {/* Story */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 28, marginBottom: 24 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--forest)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <ShieldCheck size={20} color="var(--canopy)" strokeWidth={1.8} /> The Story
            </h3>
            {activeCampaign.story.map((para: string, i: number) => (
              <p key={i} style={{ color: "var(--text2)", lineHeight: 1.75, marginBottom: i < activeCampaign.story.length - 1 ? 14 : 0 }}>
                {para}
              </p>
            ))}
          </div>

          {/* Spending breakdown */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 28, marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--forest)", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <Target size={18} color="var(--canopy)" strokeWidth={1.8} /> Where Your Donation Goes
            </h3>
            {activeCampaign.spending.map((s: any) => (
              <div key={s.label} className="spend-bar">
                <div className="spend-label">{s.label}</div>
                <div className="spend-track">
                  <div className="spend-fill" style={{ width: `${s.pct}%`, background: s.bg }} />
                </div>
                <div className="spend-amount">{s.amount} <span style={{ color: "var(--text3)" }}>({s.pct}%)</span></div>
              </div>
            ))}
            <div className="disclaimer">
              <div className="flex gap-10 flex-center">
                <ShieldCheck size={18} color="var(--forest-light)" strokeWidth={1.8} style={{ flexShrink: 0 }} />
                <p className="disclaimer-text">
                  <strong>LINGAP&apos;s Promise:</strong> Funds never enter organizer wallets. All donations are released directly to {activeCampaign.institution} through Soroban smart contracts.
                </p>
              </div>
            </div>
          </div>

          {/* Milestones */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 28 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--forest)", marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
              <Target size={18} color="var(--canopy)" strokeWidth={1.8} /> Milestone Progress
            </h3>
            <div className="milestone-timeline">
              {activeCampaign.milestones.map((m: any) => (
                <div key={m.title} className="ml-item">
                  <div className={`ml-dot ${m.dot}`} />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div className="ml-title">{m.title}</div>
                      <div className="ml-sub">{m.sub}</div>
                    </div>
                    <span className={`badge ${m.badge}`}>{m.badgeText}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — sticky donate card */}
        <div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 28, marginBottom: 20, position: "sticky", top: 84 }}>
            <div className="flex flex-center flex-between mb-16">
              <div>
                <div style={{ fontFamily: "Sora,sans-serif", fontSize: 28, fontWeight: 800, color: "var(--forest)" }}>
                  {displayRaisedLabel}
                </div>
                <div style={{ fontSize: 13, color: "var(--text3)" }}>raised of {activeCampaign.goalLabel} goal</div>
              </div>
              <div className="text-right">
                <div style={{ fontSize: 22, fontWeight: 700, color: accentHex }}>{displayPct}%</div>
                <div style={{ fontSize: 12, color: "var(--text3)" }}>funded</div>
              </div>
            </div>
            <div className={`prog-track mb-8`} style={{ height: 12 }}>
              <div className={`prog-fill ${progressColor}`} style={{ width: `${displayPct}%` }} />
            </div>
            <div className="flex flex-center flex-between mb-24" style={{ fontSize: 13, color: "var(--text3)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Users size={13} /> {displayDonors.toLocaleString()} donors
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={13} /> {activeCampaign.daysLeft} days left
              </span>
            </div>

            {/* Amount picker */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", marginBottom: 10 }}>Choose amount (XLM):</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 10 }}>
                {AMOUNTS.map((a) => (
                  <button
                    key={a}
                    onClick={() => { setSelectedAmount(a); setUseCustom(false); }}
                    className={`btn btn-sm ${!useCustom && selectedAmount === a ? "btn-primary" : "btn-outline"}`}
                  >
                    {a} XLM
                  </button>
                ))}
                <button
                  onClick={() => setUseCustom(true)}
                  className={`btn btn-sm ${useCustom ? "btn-primary" : "btn-outline"}`}
                >
                  Custom
                </button>
              </div>
              {useCustom && (
                <input
                  type="number"
                  min="1"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Enter XLM amount"
                  style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                />
              )}
            </div>

            {/* Wallet hint */}
            {!connected && (
              <div style={{ marginBottom: 12, padding: "10px 14px", background: "rgba(74,155,106,.06)", border: "1px solid rgba(74,155,106,.2)", borderRadius: 8, fontSize: 12, color: "var(--forest-light)", display: "flex", alignItems: "center", gap: 6 }}>
                <Lock size={12} /> Connect your Freighter wallet to donate on-chain.
              </div>
            )}
            {connected && publicKey && (
              <div style={{ marginBottom: 12, padding: "10px 14px", background: "rgba(74,155,106,.06)", border: "1px solid rgba(74,155,106,.2)", borderRadius: 8, fontSize: 12, color: "var(--forest-light)", display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircle2 size={12} /> Wallet: {publicKey.slice(0, 6)}…{publicKey.slice(-4)}
              </div>
            )}

            <button
              onClick={handleDonate}
              disabled={donating}
              className="btn btn-emerald btn-lg"
              style={{ width: "100%", justifyContent: "center", marginBottom: 12, opacity: donating ? 0.7 : 1 }}
            >
              {donating
                ? "Submitting to Stellar…"
                : connected
                  ? `Donate ${effectiveAmount} XLM`
                  : "Connect Wallet to Donate"}
            </button>
            {lastTxHash && (
              <a
                href={getStellarExpertTxUrl(lastTxHash)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline"
                style={{ width: "100%", justifyContent: "center", fontSize: 14, display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}
              >
                <CheckCircle2 size={14} /> View transaction on Stellar Explorer
              </a>
            )}
            <button className="btn btn-outline" style={{ width: "100%", justifyContent: "center", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <RefreshCw size={14} /> Set Monthly Donation
            </button>
            <Link href="/escrow" className="btn btn-outline" style={{ width: "100%", justifyContent: "center", fontSize: 14, display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
              <Lock size={14} /> View Escrow Dashboard
            </Link>

            {/* Confidence indicators */}
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 12, textAlign: "center" }}>Donor confidence indicators</div>
              {[
                { Icon: CheckCircle2, text: "Blockchain Verified Transaction" },
                { Icon: Lock, text: "Protected by Soroban Escrow" },
                { Icon: ShieldCheck, text: `AI Risk Assessment: ${activeCampaign.credibility >= 9 ? "Low" : "Medium"} Risk` },
                { Icon: Banknote, text: "Institution-Bound Release" },
              ].map(({ Icon: I, text }) => (
                <div key={text} className="flex flex-center gap-8" style={{ marginBottom: 6 }}>
                  <I size={14} color="var(--canopy)" strokeWidth={2} />
                  <span style={{ fontSize: 13, color: "var(--text2)" }}>{text}</span>
                </div>
              ))}
            </div>

            {/* Transparency score */}
            <div style={{ marginTop: 16, padding: 14, background: "var(--bg2)", borderRadius: 10 }}>
              <div className="flex flex-center flex-between mb-8">
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)" }}>Transparency Score</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: accentHex }}>{activeCampaign.transparencyScore}/100</span>
              </div>
              <div className="transparency-meter">
                <div className="tm-fill" style={{ width: `${activeCampaign.transparencyScore}%` }} />
              </div>
            </div>
          </div>

          {/* Institution card */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text3)", marginBottom: 12 }}>INSTITUTION RECEIVING FUNDS</div>
            <div className="flex gap-14 flex-center">
              <div style={{ width: 48, height: 48, background: activeCampaign.heroGradient, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={22} color="rgba(255,255,255,.8)" strokeWidth={1.5} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "var(--forest)", fontSize: 15 }}>{activeCampaign.institution}</div>
                <div style={{ fontSize: 12, color: "var(--text3)" }}>{activeCampaign.institutionBadge}</div>
                <div className="mt-8">
                  <span className="badge badge-emerald" style={{ fontSize: 11 }}>
                    <CheckCircle2 size={10} /> {activeCampaign.institutionDesc}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Share */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", marginBottom: 12 }}>Share this campaign:</div>
            <div className="flex gap-8">
              <button className="btn btn-sm" style={{ background: "#1877F2", color: "#fff", flex: 1, justifyContent: "center", gap: 6 }}>
                <Facebook size={13} /> Facebook
              </button>
              <button className="btn btn-sm" style={{ background: "#0078FF", color: "#fff", flex: 1, justifyContent: "center", gap: 6 }}>
                <MessageCircle size={13} /> Messenger
              </button>
              <button className="btn btn-sm" style={{ background: "#000", color: "#fff", flex: 1, justifyContent: "center", gap: 6 }}>
                <Music2 size={13} /> TikTok
              </button>
            </div>
          </div>

          <VotingPanel campaignId={activeCampaign.id} campaignName={activeCampaign.title} />
        </div>
      </div>
    </div>
  );
}
