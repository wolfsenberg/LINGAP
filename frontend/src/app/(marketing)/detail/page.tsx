"use client";
import { useState } from "react";
import { useFreighter } from "@/hooks/useFreighter";
import { escrowApi } from "@/lib/api";
import { STELLAR_CONFIG } from "@/lib/stellar";
import toast from "react-hot-toast";
import VotingPanel from "@/components/stellar/VotingPanel";

function getShareUrl() {
  return typeof window !== "undefined" ? window.location.href : "";
}

function shareFacebook() {
  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`,
    "_blank", "width=600,height=400"
  );
}

function shareMessenger() {
  const url = getShareUrl();
  if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
    window.location.href = `fb-messenger://share?link=${encodeURIComponent(url)}`;
  } else {
    navigator.clipboard.writeText(url).then(() =>
      toast.success("Link copied! Paste it in Messenger.")
    );
  }
}

async function shareTikTok() {
  const url = getShareUrl();
  if (navigator.share) {
    try { await navigator.share({ title: "Help Maria Santos on LINGAP", url }); } catch { /* cancelled */ }
  } else {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied! Share it on TikTok.");
  }
}

const CAMPAIGN_ID = 0; // first on-chain campaign
const AMOUNTS = [100, 250, 500, 1000, 5000];

export default function DetailPage() {
  const { connected, publicKey, connect } = useFreighter();
  const [selectedAmount, setSelectedAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [donating, setDonating] = useState(false);

  const effectiveAmount = useCustom ? parseFloat(customAmount) || 0 : selectedAmount;

  async function handleDonate() {
    if (!connected || !publicKey) {
      await connect();
      return;
    }
    if (effectiveAmount <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    setDonating(true);
    try {
      // 1. Get unsigned XDR from backend
      const xdrRes = await escrowApi.getDepositXdr(CAMPAIGN_ID, publicKey, effectiveAmount);
      const unsignedXdr = xdrRes.data.data.xdr;

      // 2. Sign with Freighter
      const { signTransaction } = await import("@stellar/freighter-api");
      const signResult = await signTransaction(unsignedXdr, {
        networkPassphrase: STELLAR_CONFIG.network,
      });
      if (signResult.error) throw new Error(signResult.error);

      // 3. Submit signed XDR
      const submitRes = await escrowApi.submitSignedXdr(signResult.signedTxXdr);
      const txHash = submitRes.data.data.tx_hash;

      toast.success(`Donation confirmed! Tx: ${txHash.slice(0, 8)}…`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Donation failed";
      toast.error(msg);
    } finally {
      setDonating(false);
    }
  }

  return (
    <div style={{background:'linear-gradient(180deg,var(--navy) 300px, var(--bg) 300px)'}}>
      <div className="detail-grid">
        {/* LEFT */}
        <div>
          <div className="detail-img" style={{background:'linear-gradient(135deg,#1e3a8a,#2563eb)'}}>🏥</div>
          <div className="flex gap-8 mb-16" style={{flexWrap:'wrap'}}>
            <span className="badge badge-red">🔴 URGENT</span>
            <span className="badge badge-emerald">✅ Blockchain Verified</span>
            <span className="badge badge-navy">🏥 Institution Bound</span>
            <span className="badge badge-gold">⭐ Credibility: 9.4/10</span>
          </div>
          <h1 style={{fontSize:32,fontWeight:800,color:'var(--navy)',marginBottom:12,lineHeight:1.2}}>Maria Santos — Stage 3 Ovarian Cancer Treatment</h1>
          <div className="flex flex-center gap-16 mb-24" style={{color:'var(--text2)',fontSize:14,flexWrap:'wrap'}}>
            <span>🤝 Organized by: Ana Santos (Daughter)</span>
            <span>📍 Quezon City</span>
            <span>📅 Started: Nov 12, 2025</span>
          </div>

          <div style={{background:'#fff',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:28,marginBottom:24}}>
            <h3 style={{fontSize:20,fontWeight:700,color:'var(--navy)',marginBottom:16}}>💙 Maria&apos;s Story</h3>
            <p style={{color:'var(--text2)',lineHeight:1.75,marginBottom:14}}>Maria Santos is a 37-year-old mother of three beautiful children from Quezon City. Last March 2025, she was diagnosed with Stage 3 Ovarian Cancer at the Philippine General Hospital. Despite the devastating news, Maria continues to fight — not just for herself, but for her children who need her most.</p>
            <p style={{color:'var(--text2)',lineHeight:1.75,marginBottom:14}}>Her chemotherapy treatment costs ₱35,000 every 3 weeks. She has already completed 3 cycles but needs at least 5 more to achieve remission. Her husband, a jeepney driver, cannot sustain the cost alone.</p>
            <p style={{color:'var(--text2)',lineHeight:1.75}}><strong style={{color:'var(--navy)'}}>All funds go directly to PGH&apos;s billing department through LINGAP&apos;s escrow system.</strong> Not a single peso will enter Maria&apos;s or her family&apos;s personal accounts.</p>
          </div>

          <div style={{background:'#fff',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:28,marginBottom:24}}>
            <h3 style={{fontSize:18,fontWeight:700,color:'var(--navy)',marginBottom:20}}>💰 Where Your Donation Goes</h3>
            {[
              {label:'🏥 Chemotherapy (PGH)',pct:60,amount:'₱150,000',bg:'linear-gradient(90deg,var(--navy-mid),var(--navy-light))'},
              {label:'💊 Medications',pct:20,amount:'₱50,000',bg:'linear-gradient(90deg,var(--emerald-dark),var(--emerald))'},
              {label:'🩺 Lab Tests & Imaging',pct:12,amount:'₱30,000',bg:'linear-gradient(90deg,var(--gold-darker),var(--gold-dark))'},
              {label:'🚗 Transport & Logistics',pct:8,amount:'₱20,000',bg:'linear-gradient(90deg,#6d28d9,#8b5cf6)'},
            ].map((s)=>(
              <div key={s.label} className="spend-bar">
                <div className="spend-label">{s.label}</div>
                <div className="spend-track"><div className="spend-fill" style={{width:`${s.pct}%`,background:s.bg}}/></div>
                <div className="spend-amount">{s.amount} <span style={{color:'var(--text3)'}}>({s.pct}%)</span></div>
              </div>
            ))}
            <div className="disclaimer">
              <div className="flex gap-10 flex-center">
                <span style={{fontSize:18,flexShrink:0}}>🐘</span>
                <p className="disclaimer-text"><strong>Gabo&apos;s Promise:</strong> Funds never enter organizer wallets. All donations are released directly to Philippine General Hospital and accredited pharmacies through Soroban smart contracts.</p>
              </div>
            </div>
          </div>

          <div style={{background:'#fff',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:28}}>
            <h3 style={{fontSize:18,fontWeight:700,color:'var(--navy)',marginBottom:24}}>🎯 Milestone Progress</h3>
            <div className="milestone-timeline">
              {[
                {dot:'ml-dot-done',title:'✅ Campaign Created & Verified',sub:'Nov 12, 2025 • Documents reviewed by LINGAP team',badge:'badge-emerald',badgeText:'Complete'},
                {dot:'ml-dot-done',title:'✅ Milestone 1: Chemo Cycles 1–3',sub:'Nov 28, 2025 • ₱75,000 released to PGH Billing',badge:'badge-emerald',badgeText:'₱75,000 Released'},
                {dot:'ml-dot-active',title:'⏳ Milestone 2: Chemo Cycles 4–6',sub:'In progress • Receipts submitted, pending verification',badge:'badge-blue',badgeText:'Under Review'},
                {dot:'ml-dot-pending',title:'🔒 Milestone 3: Medication & Lab Tests',sub:'Locked • Will unlock after Milestone 2 completion',badge:'badge-navy',badgeText:'Locked'},
                {dot:'ml-dot-pending',title:'🏁 Final: Recovery & Post-Treatment',sub:'Locked • Pending previous milestones',badge:'badge-navy',badgeText:'Locked'},
              ].map((m)=>(
                <div key={m.title} className="ml-item">
                  <div className={`ml-dot ${m.dot}`}/>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
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
          <div style={{background:'#fff',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:28,marginBottom:20,position:'sticky',top:84}}>
            <div className="flex flex-center flex-between mb-16">
              <div><div style={{fontFamily:'Sora,sans-serif',fontSize:28,fontWeight:800,color:'var(--navy)'}}>₱182,400</div><div style={{fontSize:13,color:'var(--text3)'}}>raised of ₱250,000 goal</div></div>
              <div className="text-right"><div style={{fontSize:22,fontWeight:700,color:'var(--emerald)'}}>73%</div><div style={{fontSize:12,color:'var(--text3)'}}>funded</div></div>
            </div>
            <div className="prog-track mb-8" style={{height:12}}><div className="prog-fill prog-emerald" style={{width:'73%'}}/></div>
            <div className="flex flex-center flex-between mb-24" style={{fontSize:13,color:'var(--text3)'}}>
              <span>👥 342 donors</span><span>⏳ 12 days left</span>
            </div>

            {/* Amount picker */}
            <div style={{marginBottom:18}}>
              <div style={{fontSize:13,fontWeight:600,color:'var(--text2)',marginBottom:10}}>Choose amount (XLM):</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:10}}>
                {AMOUNTS.map((a) => (
                  <button
                    key={a}
                    onClick={() => { setSelectedAmount(a); setUseCustom(false); }}
                    className={`btn btn-sm ${!useCustom && selectedAmount === a ? 'btn-primary' : 'btn-outline'}`}
                  >
                    {a} XLM
                  </button>
                ))}
                <button
                  onClick={() => setUseCustom(true)}
                  className={`btn btn-sm ${useCustom ? 'btn-primary' : 'btn-outline'}`}
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
                  style={{width:'100%',border:'1px solid var(--border)',borderRadius:8,padding:'8px 12px',fontSize:14,outline:'none',boxSizing:'border-box'}}
                />
              )}
            </div>

            {/* Wallet status hint */}
            {!connected && (
              <div style={{marginBottom:12,padding:'10px 14px',background:'rgba(16,184,145,.06)',border:'1px solid rgba(16,184,145,.2)',borderRadius:8,fontSize:12,color:'var(--emerald-dark)'}}>
                🔗 Connect your Freighter wallet to donate on-chain.
              </div>
            )}
            {connected && publicKey && (
              <div style={{marginBottom:12,padding:'10px 14px',background:'rgba(16,184,145,.06)',border:'1px solid rgba(16,184,145,.2)',borderRadius:8,fontSize:12,color:'var(--emerald-dark)'}}>
                ✅ Wallet: {publicKey.slice(0,6)}…{publicKey.slice(-4)}
              </div>
            )}

            <button
              onClick={handleDonate}
              disabled={donating}
              className="btn btn-emerald btn-lg"
              style={{width:'100%',justifyContent:'center',marginBottom:12,opacity:donating?0.7:1}}
            >
              {donating
                ? '⏳ Submitting to Stellar…'
                : connected
                  ? `💸 Donate ${effectiveAmount} XLM`
                  : '🔗 Connect Wallet to Donate'}
            </button>
            <button className="btn btn-outline" style={{width:'100%',justifyContent:'center',fontSize:14}}>🔄 Set Monthly Donation</button>

            <div style={{marginTop:20,paddingTop:20,borderTop:'1px solid var(--border)'}}>
              <div style={{fontSize:12,color:'var(--text3)',marginBottom:12,textAlign:'center'}}>Donor confidence indicators</div>
              {['Blockchain Verified Transaction','Protected by Soroban Escrow','AI Risk Assessment: Low Risk','Institution-Bound Release'].map((t)=>(
                <div key={t} className="flex flex-center gap-8" style={{marginBottom:6}}><span style={{color:'var(--emerald)'}}>✅</span><span style={{fontSize:13,color:'var(--text2)'}}>{t}</span></div>
              ))}
            </div>
            <div style={{marginTop:16,padding:14,background:'var(--bg)',borderRadius:10}}>
              <div className="flex flex-center flex-between mb-8"><span style={{fontSize:12,fontWeight:600,color:'var(--text2)'}}>Transparency Score</span><span style={{fontSize:14,fontWeight:700,color:'var(--emerald)'}}>94/100</span></div>
              <div className="transparency-meter"><div className="tm-fill" style={{width:'94%'}}/></div>
            </div>
          </div>

          <div style={{background:'#fff',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:20,marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:600,color:'var(--text3)',marginBottom:12}}>INSTITUTION RECEIVING FUNDS</div>
            <div className="flex gap-14 flex-center">
              <div style={{width:48,height:48,background:'linear-gradient(135deg,#1e3a8a,#2563eb)',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>🏥</div>
              <div><div style={{fontWeight:700,color:'var(--navy)',fontSize:15}}>Philippine General Hospital</div><div style={{fontSize:12,color:'var(--text3)'}}>DOH Accredited Level 4 Hospital</div><div className="mt-8"><span className="badge badge-emerald" style={{fontSize:11}}>✅ Verified Institution</span></div></div>
            </div>
          </div>

          <div style={{background:'#fff',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:20}}>
            <div style={{fontSize:13,fontWeight:600,color:'var(--text2)',marginBottom:12}}>Share this campaign:</div>
            <div className="flex gap-8">
              <button onClick={shareFacebook} className="btn btn-sm" style={{background:'#1877F2',color:'#fff',flex:1,justifyContent:'center'}}>📘 Facebook</button>
              <button onClick={shareMessenger} className="btn btn-sm" style={{background:'#0078FF',color:'#fff',flex:1,justifyContent:'center'}}>💬 Messenger</button>
              <button onClick={shareTikTok} className="btn btn-sm" style={{background:'#000',color:'#fff',flex:1,justifyContent:'center'}}>🎵 TikTok</button>
            </div>
          </div>

          <VotingPanel campaignId={CAMPAIGN_ID} campaignName="Maria Santos — Stage 3 Ovarian Cancer Treatment" />
        </div>
      </div>
    </div>
  );
}
