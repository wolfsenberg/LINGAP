import Link from "next/link";

export default function DetailPage() {
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

        {/* RIGHT */}
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
            <div style={{marginBottom:18}}>
              <div style={{fontSize:13,fontWeight:600,color:'var(--text2)',marginBottom:10}}>Choose amount:</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:10}}>
                {['₱100','₱250','₱500','₱1,000','₱5,000','Custom'].map((a,i)=>(
                  <button key={a} className={`btn btn-sm ${i===2?'btn-primary':'btn-outline'}`}>{a}</button>
                ))}
              </div>
            </div>
            <button className="btn btn-emerald btn-lg" style={{width:'100%',justifyContent:'center',marginBottom:12}}>💸 Donate ₱500 Now</button>
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
              <button className="btn btn-sm" style={{background:'#1877F2',color:'#fff',flex:1,justifyContent:'center'}}>📘 Facebook</button>
              <button className="btn btn-sm" style={{background:'#0078FF',color:'#fff',flex:1,justifyContent:'center'}}>💬 Messenger</button>
              <button className="btn btn-sm" style={{background:'#000',color:'#fff',flex:1,justifyContent:'center'}}>🎵 TikTok</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
