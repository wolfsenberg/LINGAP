"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useFreighter } from "@/hooks/useFreighter";
import { escrowApi, paymongoApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { STELLAR_CONFIG } from "@/lib/stellar";
import { CAMPAIGNS, getCampaign } from "@/lib/campaigns";
import toast from "react-hot-toast";
import VotingPanel from "@/components/stellar/VotingPanel";

function getShareUrl() {
  return typeof window !== "undefined" ? window.location.href : "";
}

function shareFacebook() {
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`, "_blank", "width=600,height=400");
}

function shareMessenger() {
  const url = getShareUrl();
  if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
    window.location.href = `fb-messenger://share?link=${encodeURIComponent(url)}`;
  } else {
    navigator.clipboard.writeText(url).then(() => toast.success("Link copied! Paste it in Messenger."));
  }
}

async function shareTikTok() {
  const url = getShareUrl();
  if (navigator.share) {
    try { await navigator.share({ title: "Help on LINGAP", url }); } catch { /* cancelled */ }
  } else {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied! Share it on TikTok.");
  }
}

const AMOUNTS = [100, 250, 500, 1000, 5000];
const PHP_AMOUNTS = [100, 250, 500, 1000, 2500];

function DetailContent() {
  const params = useSearchParams();
  const campaignId = parseInt(params.get("id") ?? "0", 10);
  const campaign = getCampaign(campaignId) ?? CAMPAIGNS[0];

  const { connected, publicKey, connect } = useFreighter();
  const { isAuthenticated } = useAuthStore();
  const [selectedAmount, setSelectedAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [donating, setDonating] = useState(false);

  const [donateTab, setDonateTab] = useState<"stellar" | "php">("stellar");
  const [phpAmount, setPhpAmount] = useState(500);
  const [customPhp, setCustomPhp] = useState("");
  const [useCustomPhp, setUseCustomPhp] = useState(false);
  const [payingPhp, setPayingPhp] = useState(false);

  const effectiveAmount = useCustom ? parseFloat(customAmount) || 0 : selectedAmount;
  const effectivePhp = useCustomPhp ? parseFloat(customPhp) || 0 : phpAmount;

  async function handleDonate() {
    if (!connected || !publicKey) { await connect(); return; }
    if (effectiveAmount <= 0) { toast.error("Enter a valid amount."); return; }
    setDonating(true);
    try {
      const xdrRes = await escrowApi.getDepositXdr(campaign.id, publicKey, effectiveAmount);
      const unsignedXdr = xdrRes.data.data.xdr;
      const { signTransaction } = await import("@stellar/freighter-api");
      const signResult = await signTransaction(unsignedXdr, { networkPassphrase: STELLAR_CONFIG.network });
      if (signResult.error) throw new Error(signResult.error);
      const submitRes = await escrowApi.submitSignedXdr(signResult.signedTxXdr);
      toast.success(`Donation confirmed! Tx: ${submitRes.data.data.tx_hash.slice(0, 8)}…`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Donation failed");
    } finally {
      setDonating(false);
    }
  }

  async function handlePayMongo() {
    if (!isAuthenticated) { toast.error("Please log in to donate via GCash/Maya."); return; }
    if (effectivePhp < 20) { toast.error("Minimum donation is PHP 20."); return; }
    setPayingPhp(true);
    try {
      const res = await paymongoApi.checkout(effectivePhp, campaign.title);
      window.location.href = res.data.data.checkout_url;
    } catch {
      toast.error("Could not start checkout. Try again.");
    } finally {
      setPayingPhp(false);
    }
  }

  const pctLabel = `${campaign.pct}%`;

  return (
    <div style={{ background: `linear-gradient(180deg,var(--forest) 300px, var(--bg) 300px)` }}>
      <div className="detail-grid">
        {/* LEFT */}
        <div>
          <div className="detail-img" style={{ background: campaign.heroGradient, fontSize: 72, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {campaign.heroIcon}
          </div>
          <div className="flex gap-8 mb-16" style={{ flexWrap: "wrap" }}>
            {campaign.urgencyLabel && <span className={`badge ${campaign.urgencyClass}`}>🔴 {campaign.urgencyLabel}</span>}
            <span className="badge badge-emerald">✅ Blockchain Verified</span>
            <span className="badge badge-navy">🏛️ Institution Bound</span>
            <span className="badge badge-gold">⭐ Credibility: {campaign.credibility}/10</span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--navy)", marginBottom: 12, lineHeight: 1.2 }}>{campaign.title}</h1>
          <div className="flex flex-center gap-16 mb-24" style={{ color: "var(--text2)", fontSize: 14, flexWrap: "wrap" }}>
            <span>🤝 Organized by: {campaign.organizer}</span>
            <span>📍 {campaign.location}</span>
            <span>📅 Started: {campaign.startDate}</span>
          </div>

          {/* Story */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 28, marginBottom: 24 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--navy)", marginBottom: 16 }}>💙 Their Story</h3>
            {campaign.story.map((para, i) => (
              <p key={i} style={{ color: "var(--text2)", lineHeight: 1.75, marginBottom: i < campaign.story.length - 1 ? 14 : 0 }}>{para}</p>
            ))}
          </div>

          {/* Spending breakdown */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 28, marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--navy)", marginBottom: 20 }}>💰 Where Your Donation Goes</h3>
            {campaign.spending.map((s) => (
              <div key={s.label} className="spend-bar">
                <div className="spend-label">{s.label}</div>
                <div className="spend-track"><div className="spend-fill" style={{ width: `${s.pct}%`, background: s.bg }} /></div>
                <div className="spend-amount">{s.amount} <span style={{ color: "var(--text3)" }}>({s.pct}%)</span></div>
              </div>
            ))}
            <div className="disclaimer">
              <div className="flex gap-10 flex-center">
                <span style={{ fontSize: 18, flexShrink: 0 }}>🔒</span>
                <p className="disclaimer-text"><strong>LINGAP&apos;s Promise:</strong> Funds never enter organizer wallets. All donations are released directly to {campaign.institution} through Soroban smart contracts.</p>
              </div>
            </div>
          </div>

          {/* Milestones */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 28 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--navy)", marginBottom: 24 }}>🎯 Milestone Progress</h3>
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
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 28, marginBottom: 20, position: "sticky", top: 84 }}>
            <div className="flex flex-center flex-between mb-16">
              <div>
                <div style={{ fontFamily: "Sora,sans-serif", fontSize: 28, fontWeight: 800, color: "var(--navy)" }}>{campaign.raisedLabel}</div>
                <div style={{ fontSize: 13, color: "var(--text3)" }}>raised of {campaign.goalLabel} goal</div>
              </div>
              <div className="text-right">
                <div style={{ fontSize: 22, fontWeight: 700, color: "var(--emerald)" }}>{pctLabel}</div>
                <div style={{ fontSize: 12, color: "var(--text3)" }}>funded</div>
              </div>
            </div>
            <div className="prog-track mb-8" style={{ height: 12 }}>
              <div className="prog-fill prog-emerald" style={{ width: pctLabel }} />
            </div>
            <div className="flex flex-center flex-between mb-24" style={{ fontSize: 13, color: "var(--text3)" }}>
              <span>👥 {campaign.donors.toLocaleString()} donors</span>
              <span>⏳ {campaign.daysLeft} days left</span>
            </div>

            {/* Tab switcher */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 18, background: "var(--bg)", borderRadius: 10, padding: 4 }}>
              {(["stellar", "php"] as const).map(tab => (
                <button key={tab} onClick={() => setDonateTab(tab)} style={{
                  padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
                  background: donateTab === tab ? "#fff" : "transparent",
                  color: donateTab === tab ? "var(--navy)" : "var(--text3)",
                  boxShadow: donateTab === tab ? "0 1px 4px rgba(0,0,0,.08)" : "none",
                  transition: "all .15s",
                }}>
                  {tab === "stellar" ? "🔗 Stellar (XLM)" : "📱 GCash / Maya"}
                </button>
              ))}
            </div>

            {donateTab === "stellar" ? (
              <>
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", marginBottom: 10 }}>Choose amount (XLM):</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 10 }}>
                    {AMOUNTS.map((a) => (
                      <button key={a} onClick={() => { setSelectedAmount(a); setUseCustom(false); }}
                        className={`btn btn-sm ${!useCustom && selectedAmount === a ? "btn-primary" : "btn-outline"}`}>
                        {a} XLM
                      </button>
                    ))}
                    <button onClick={() => setUseCustom(true)} className={`btn btn-sm ${useCustom ? "btn-primary" : "btn-outline"}`}>Custom</button>
                  </div>
                  {useCustom && (
                    <input type="number" min="1" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="Enter XLM amount"
                      style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                  )}
                </div>
                {!connected && (
                  <div style={{ marginBottom: 12, padding: "10px 14px", background: "rgba(74,155,106,.06)", border: "1px solid rgba(74,155,106,.2)", borderRadius: 8, fontSize: 12, color: "var(--canopy)" }}>
                    🔗 Connect your Freighter wallet to donate on-chain.
                  </div>
                )}
                {connected && publicKey && (
                  <div style={{ marginBottom: 12, padding: "10px 14px", background: "rgba(74,155,106,.06)", border: "1px solid rgba(74,155,106,.2)", borderRadius: 8, fontSize: 12, color: "var(--canopy)" }}>
                    ✅ Wallet: {publicKey.slice(0, 6)}…{publicKey.slice(-4)}
                  </div>
                )}
                <button onClick={handleDonate} disabled={donating} className="btn btn-emerald btn-lg"
                  style={{ width: "100%", justifyContent: "center", marginBottom: 12, opacity: donating ? 0.7 : 1 }}>
                  {donating ? "⏳ Submitting to Stellar…" : connected ? `💸 Donate ${effectiveAmount} XLM` : "🔗 Connect Wallet to Donate"}
                </button>
                <button className="btn btn-outline" style={{ width: "100%", justifyContent: "center", fontSize: 14 }}>🔄 Set Monthly Donation</button>
              </>
            ) : (
              <>
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", marginBottom: 10 }}>Choose amount (PHP ₱):</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 10 }}>
                    {PHP_AMOUNTS.map((a) => (
                      <button key={a} onClick={() => { setPhpAmount(a); setUseCustomPhp(false); }}
                        className={`btn btn-sm ${!useCustomPhp && phpAmount === a ? "btn-primary" : "btn-outline"}`}>
                        ₱{a}
                      </button>
                    ))}
                    <button onClick={() => setUseCustomPhp(true)} className={`btn btn-sm ${useCustomPhp ? "btn-primary" : "btn-outline"}`}>Custom</button>
                  </div>
                  {useCustomPhp && (
                    <input type="number" min="20" value={customPhp} onChange={(e) => setCustomPhp(e.target.value)}
                      placeholder="Min ₱20"
                      style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                  )}
                </div>
                <div style={{ marginBottom: 12, padding: "10px 14px", background: "rgba(74,155,106,.06)", border: "1px solid rgba(74,155,106,.2)", borderRadius: 8, fontSize: 12, color: "var(--canopy)" }}>
                  📱 You will be redirected to PayMongo&apos;s secure checkout to pay via GCash, Maya, or card.
                </div>
                <button onClick={handlePayMongo} disabled={payingPhp} className="btn btn-emerald btn-lg"
                  style={{ width: "100%", justifyContent: "center", marginBottom: 8, opacity: payingPhp ? 0.7 : 1, background: "linear-gradient(135deg,#0070FF,#00B4FF)" }}>
                  {payingPhp ? "⏳ Opening checkout…" : `📱 Pay ₱${effectivePhp} via GCash / Maya`}
                </button>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: "var(--text3)" }}>Secured by</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#0070FF" }}>PayMongo</span>
                  <span style={{ fontSize: 11, color: "var(--text3)" }}>· PCI-DSS Compliant</span>
                </div>
              </>
            )}

            <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 12, textAlign: "center" }}>Donor confidence indicators</div>
              {["Blockchain Verified Transaction", "Protected by Soroban Escrow", "AI Risk Assessment: Low Risk", "Institution-Bound Release"].map((t) => (
                <div key={t} className="flex flex-center gap-8" style={{ marginBottom: 6 }}>
                  <span style={{ color: "var(--emerald)" }}>✅</span>
                  <span style={{ fontSize: 13, color: "var(--text2)" }}>{t}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, padding: 14, background: "var(--bg)", borderRadius: 10 }}>
              <div className="flex flex-center flex-between mb-8">
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)" }}>Transparency Score</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--emerald)" }}>{campaign.transparencyScore}/100</span>
              </div>
              <div className="transparency-meter"><div className="tm-fill" style={{ width: `${campaign.transparencyScore}%` }} /></div>
            </div>
          </div>

          {/* Institution */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text3)", marginBottom: 12 }}>INSTITUTION RECEIVING FUNDS</div>
            <div className="flex gap-14 flex-center">
              <div style={{ width: 48, height: 48, background: campaign.heroGradient, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                {campaign.heroIcon}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "var(--navy)", fontSize: 15 }}>{campaign.institution}</div>
                <div style={{ fontSize: 12, color: "var(--text3)" }}>{campaign.institutionBadge}</div>
                <div className="mt-8"><span className="badge badge-emerald" style={{ fontSize: 11 }}>✅ Verified Institution</span></div>
              </div>
            </div>
          </div>

          {/* Share */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", marginBottom: 12 }}>Share this campaign:</div>
            <div className="flex gap-8">
              <button onClick={shareFacebook} className="btn btn-sm" style={{ background: "#1877F2", color: "#fff", flex: 1, justifyContent: "center" }}>📘 Facebook</button>
              <button onClick={shareMessenger} className="btn btn-sm" style={{ background: "#0078FF", color: "#fff", flex: 1, justifyContent: "center" }}>💬 Messenger</button>
              <button onClick={shareTikTok} className="btn btn-sm" style={{ background: "#000", color: "#fff", flex: 1, justifyContent: "center" }}>🎵 TikTok</button>
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
