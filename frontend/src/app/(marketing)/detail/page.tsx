"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useFreighter } from "@/hooks/useFreighter";
import { campaignsApi, donationsApi, paymongoApi } from "@/lib/api";
import {
  STELLAR_CONFIG,
  buildPaymentTransaction,
  getStellarExpertTxUrl,
  submitSignedTransactionXdr,
} from "@/lib/stellar";
import { applyCampaignSummary, CAMPAIGNS, getCampaign, type PublicCampaignSummary } from "@/lib/campaigns";
import { addPendingDonation, removePendingDonation } from "@/lib/pendingDonations";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import VotingPanel from "@/components/stellar/VotingPanel";
import {
  AlertCircle, CheckCircle2, Lock, Star, Handshake, MapPin, Calendar,
  Hospital, Anchor, School, ShieldCheck, Clock, Users,
  Facebook, MessageCircle, Music2, RefreshCw, Target,
} from "lucide-react";

const AMOUNTS = [100, 250, 500, 1000, 5000];
const PHP_AMOUNTS = [50, 100, 250, 500, 1000];
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

const CATEGORY_ICON: Record<string, React.ElementType> = {
  Medical: Hospital,
  "Disaster Relief": Anchor,
  Education: School,
};

function DetailContent() {
  const params = useSearchParams();
  const campaignId = parseInt(params.get("id") ?? "0", 10);
  const campaign = getCampaign(campaignId) ?? CAMPAIGNS[0];
  const CampaignIcon = CATEGORY_ICON[campaign.category] ?? Hospital;
  const user = useAuthStore((state) => state.user);

  const { connected, publicKey, connect } = useFreighter();
  const [tab, setTab] = useState<"stellar" | "php">("stellar");
  const [selectedAmount, setSelectedAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [selectedPhp, setSelectedPhp] = useState(250);
  const [customPhp, setCustomPhp] = useState("");
  const [useCustomPhp, setUseCustomPhp] = useState(false);
  const [donating, setDonating] = useState(false);
  const [payingPhp, setPayingPhp] = useState(false);
  const [confirmedDonationXlm, setConfirmedDonationXlm] = useState(0);
  const [lastTxHash, setLastTxHash] = useState("");
  const [liveSummary, setLiveSummary] = useState<PublicCampaignSummary | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadCampaign() {
      try {
        const res = await campaignsApi.publicOne(campaign.slug);
        if (mounted) setLiveSummary(res.data.data);
      } catch {
        if (mounted) setLiveSummary(null);
      }
    }

    loadCampaign();
    const timer = window.setInterval(loadCampaign, 10000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [campaign.slug]);

  const effectiveAmount = useCustom ? parseFloat(customAmount) || 0 : selectedAmount;
  const effectivePhp = useCustomPhp ? parseFloat(customPhp) || 0 : selectedPhp;
  const activeCampaign = applyCampaignSummary(campaign, liveSummary ?? undefined);
  const displayRaised = activeCampaign.raised + confirmedDonationXlm * DEMO_XLM_TO_PHP;
  const displayRaisedLabel = `₱${Math.round(displayRaised).toLocaleString()}`;
  const displayPct = Math.min(100, Math.round((displayRaised / activeCampaign.goal) * 100));
  const displayDonors = activeCampaign.donors + (confirmedDonationXlm > 0 ? 1 : 0);

  async function handleDonate() {
    if (!connected || !publicKey) { await connect(); return; }
    if (effectiveAmount <= 0) { toast.error("Enter a valid amount."); return; }
    if (!LINGAP_RECEIVER_PUBLIC_KEY) {
      toast.error("LINGAP receiving wallet is not configured yet.");
      return;
    }
    setDonating(true);
    try {
      const transaction = await buildPaymentTransaction(
        publicKey,
        LINGAP_RECEIVER_PUBLIC_KEY,
        formatXlmAmount(effectiveAmount),
        undefined,
        getDonationMemo(campaign.title, effectiveAmount)
      );
      const { signTransaction } = await import("@stellar/freighter-api");
      const signResult = (await signTransaction(transaction.toXDR(), { networkPassphrase: STELLAR_CONFIG.network })) as FreighterSignResult;
      const signedXdr = getSignedXdr(signResult);
      if (!signedXdr) throw new Error("Freighter did not return a signed transaction.");
      const submitRes = await submitSignedTransactionXdr(signedXdr);
      const txHash = submitRes.hash;
      const donationPurpose = `campaign:${campaign.slug}`;
      addPendingDonation({
        userId: user?.id,
        amount: effectiveAmount,
        asset: "XLM",
        purpose: donationPurpose,
        stellarTxHash: txHash,
        createdAt: new Date().toISOString(),
      });
      setConfirmedDonationXlm((current) => current + effectiveAmount);
      setLastTxHash(txHash);
      toast.success(`Donation confirmed! Tx: ${txHash.slice(0, 8)}…`);
      try {
        await donationsApi.create({
          amount: effectiveAmount,
          asset: "XLM",
          purpose: donationPurpose,
          stellarTxHash: txHash,
        });
        removePendingDonation(txHash);
        setConfirmedDonationXlm(0);
        const latest = await campaignsApi.publicOne(campaign.slug);
        if (latest.data.data) setLiveSummary(latest.data.data);
        toast.success("Donation synced to LINGAP dashboard.");
      } catch {
        toast.error("Donation sent, but dashboard sync failed. Check API/CORS settings.");
      }
    } catch (e: unknown) {
      toast.error(getDonationErrorMessage(e));
    } finally {
      setDonating(false);
    }
  }

  async function handlePhpPay() {
    if (effectivePhp < 20) { toast.error("Minimum donation is ₱20."); return; }
    setPayingPhp(true);
    try {
      const res = await paymongoApi.checkout(effectivePhp, campaign.title);
      window.location.href = res.data.data.checkout_url;
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Payment failed");
      setPayingPhp(false);
    }
  }

  return (
    <div style={{ background: `linear-gradient(180deg,var(--forest) 300px, var(--bg) 300px)` }}>
      <div className="detail-grid">
        {/* LEFT */}
        <div>
          <div className={`detail-img ${campaign.imageSrc ? "has-photo" : ""}`} style={{ background: campaign.heroGradient }}>
            {campaign.imageSrc ? (
              <img className="detail-img-photo" src={campaign.imageSrc} alt={campaign.title} />
            ) : (
              <CampaignIcon size={80} color="rgba(255,255,255,.6)" strokeWidth={1.2} />
            )}
          </div>
          <div className="flex gap-8 mb-16" style={{ flexWrap: "wrap" }}>
            {campaign.urgencyLabel && (
              <span className={`badge ${campaign.urgencyClass}`}><AlertCircle size={11} /> {campaign.urgencyLabel}</span>
            )}
            <span className="badge badge-emerald"><CheckCircle2 size={11} /> Blockchain Verified</span>
            <span className="badge badge-navy"><CampaignIcon size={11} /> Institution Bound</span>
            <span className="badge badge-gold"><Star size={11} /> Credibility: {campaign.credibility}/10</span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--forest)", marginBottom: 12, lineHeight: 1.2 }}>{campaign.title}</h1>
          <div className="flex flex-center gap-16 mb-24" style={{ color: "var(--text2)", fontSize: 14, flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Handshake size={14} /> Organized by: {campaign.organizer}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><MapPin size={14} /> {campaign.location}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Calendar size={14} /> Started: {campaign.startDate}</span>
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 28, marginBottom: 24 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--forest)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <ShieldCheck size={20} color="var(--canopy)" strokeWidth={1.8} /> The Story
            </h3>
            {campaign.story.map((para, i) => (
              <p key={i} style={{ color: "var(--text2)", lineHeight: 1.75, marginBottom: 14 }}>{para}</p>
            ))}
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 28, marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--forest)", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <Target size={18} color="var(--canopy)" strokeWidth={1.8} /> Where Your Donation Goes
            </h3>
            {campaign.spending.map((s) => (
              <div key={s.label} className="spend-bar">
                <div className="spend-label">{s.label}</div>
                <div className="spend-track"><div className="spend-fill" style={{ width: `${s.pct}%`, background: s.bg }} /></div>
                <div className="spend-amount">{s.amount} <span style={{ color: "var(--text3)" }}>({s.pct}%)</span></div>
              </div>
            ))}
            <div className="disclaimer">
              <div className="flex gap-10 flex-center">
                <ShieldCheck size={18} color="var(--forest-light)" strokeWidth={1.8} style={{ flexShrink: 0 }} />
                <p className="disclaimer-text"><strong>LINGAP&apos;s Promise:</strong> Funds never enter organizer wallets. All donations are released directly to {campaign.institution} through Soroban smart contracts.</p>
              </div>
            </div>
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 28 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--forest)", marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
              <Target size={18} color="var(--canopy)" strokeWidth={1.8} /> Milestone Progress
            </h3>
            <div className="milestone-timeline">
              {campaign.milestones.map((m) => (
                <div key={m.title} className="ml-item">
                  <div className={`ml-dot ${m.dot}`} />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div><div className="ml-title">{m.title}</div><div className="ml-sub">{m.sub}</div></div>
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
                <div style={{ fontFamily: "Sora,sans-serif", fontSize: 28, fontWeight: 800, color: "var(--forest)" }}>{displayRaisedLabel}</div>
                <div style={{ fontSize: 13, color: "var(--text3)" }}>raised of {activeCampaign.goalLabel} goal</div>
              </div>
              <div className="text-right">
                <div style={{ fontSize: 22, fontWeight: 700, color: "var(--canopy)" }}>{displayPct}%</div>
                <div style={{ fontSize: 12, color: "var(--text3)" }}>funded</div>
              </div>
            </div>
            <div className="prog-track mb-8" style={{ height: 12 }}><div className="prog-fill prog-emerald" style={{ width: `${displayPct}%` }} /></div>
            <div className="flex flex-center flex-between mb-24" style={{ fontSize: 13, color: "var(--text3)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Users size={13} /> {displayDonors.toLocaleString()} donors</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={13} /> {activeCampaign.daysLeft} days left</span>
            </div>

            {/* Tab switcher */}
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              <button onClick={() => setTab("stellar")} className={`btn btn-sm ${tab === "stellar" ? "btn-primary" : "btn-outline"}`} style={{ flex: 1, justifyContent: "center" }}>⭐ Stellar (XLM)</button>
              <button onClick={() => setTab("php")} className={`btn btn-sm ${tab === "php" ? "btn-primary" : "btn-outline"}`} style={{ flex: 1, justifyContent: "center" }}>📱 GCash / Maya</button>
            </div>

            {tab === "stellar" && (
              <>
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", marginBottom: 10 }}>Choose amount (XLM):</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 10 }}>
                    {AMOUNTS.map((a) => (
                      <button key={a} onClick={() => { setSelectedAmount(a); setUseCustom(false); }} className={`btn btn-sm ${!useCustom && selectedAmount === a ? "btn-primary" : "btn-outline"}`}>{a} XLM</button>
                    ))}
                    <button onClick={() => setUseCustom(true)} className={`btn btn-sm ${useCustom ? "btn-primary" : "btn-outline"}`}>Custom</button>
                  </div>
                  {useCustom && (
                    <input type="number" min="1" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} placeholder="Enter XLM amount" style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                  )}
                </div>
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
                <button onClick={handleDonate} disabled={donating} className="btn btn-emerald btn-lg" style={{ width: "100%", justifyContent: "center", marginBottom: 12, opacity: donating ? 0.7 : 1 }}>
                  {donating ? "Submitting to Stellar…" : connected ? `Donate ${effectiveAmount} XLM` : "Connect Wallet to Donate"}
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
              </>
            )}

            {tab === "php" && (
              <>
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", marginBottom: 10 }}>Choose amount (PHP ₱):</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 10 }}>
                    {PHP_AMOUNTS.map((a) => (
                      <button key={a} onClick={() => { setSelectedPhp(a); setUseCustomPhp(false); }} className={`btn btn-sm ${!useCustomPhp && selectedPhp === a ? "btn-primary" : "btn-outline"}`}>₱{a}</button>
                    ))}
                    <button onClick={() => setUseCustomPhp(true)} className={`btn btn-sm ${useCustomPhp ? "btn-primary" : "btn-outline"}`}>Custom</button>
                  </div>
                  {useCustomPhp && (
                    <input type="number" min="20" value={customPhp} onChange={(e) => setCustomPhp(e.target.value)} placeholder="Enter PHP amount" style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                  )}
                </div>
                <button onClick={handlePhpPay} disabled={payingPhp} className="btn btn-emerald btn-lg" style={{ width: "100%", justifyContent: "center", marginBottom: 12, opacity: payingPhp ? 0.7 : 1 }}>
                  {payingPhp ? "⏳ Opening checkout…" : `📱 Pay ₱${effectivePhp} via GCash / Maya`}
                </button>
              </>
            )}

            <button className="btn btn-outline" style={{ width: "100%", justifyContent: "center", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <RefreshCw size={14} /> Set Monthly Donation
            </button>
            <Link href="/escrow" className="btn btn-outline" style={{ width: "100%", justifyContent: "center", fontSize: 14, display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
              <Lock size={14} /> View Escrow Dashboard
            </Link>

            <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 12, textAlign: "center" }}>Donor confidence indicators</div>
              {[
                { Icon: CheckCircle2, text: "Blockchain Verified Transaction" },
                { Icon: Lock, text: "Protected by Soroban Escrow" },
                { Icon: ShieldCheck, text: "AI Risk Assessment: Low Risk" },
                { Icon: CampaignIcon, text: "Institution-Bound Release" },
              ].map(({ Icon, text }) => (
                <div key={text} className="flex flex-center gap-8" style={{ marginBottom: 6 }}>
                  <Icon size={14} color="var(--canopy)" strokeWidth={2} />
                  <span style={{ fontSize: 13, color: "var(--text2)" }}>{text}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, padding: 14, background: "var(--bg2)", borderRadius: 10 }}>
              <div className="flex flex-center flex-between mb-8">
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)" }}>Transparency Score</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--canopy)" }}>{campaign.transparencyScore}/100</span>
              </div>
              <div className="transparency-meter"><div className="tm-fill" style={{ width: `${campaign.transparencyScore}%` }} /></div>
            </div>
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text3)", marginBottom: 12 }}>INSTITUTION RECEIVING FUNDS</div>
            <div className="flex gap-14 flex-center">
              <div style={{ width: 48, height: 48, background: campaign.heroGradient, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <CampaignIcon size={22} color="rgba(255,255,255,.8)" strokeWidth={1.5} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "var(--forest)", fontSize: 15 }}>{campaign.institution}</div>
                <div style={{ fontSize: 12, color: "var(--text3)" }}>{campaign.institutionBadge}</div>
                <div className="mt-8"><span className="badge badge-emerald" style={{ fontSize: 11 }}><CheckCircle2 size={10} /> Verified Institution</span></div>
              </div>
            </div>
          </div>

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

          <VotingPanel campaignId={campaign.id} campaignName={campaign.title} />
        </div>
      </div>
    </div>
  );
}

export default function DetailPage() {
  return (
    <Suspense fallback={null}>
      <DetailContent />
    </Suspense>
  );
}
