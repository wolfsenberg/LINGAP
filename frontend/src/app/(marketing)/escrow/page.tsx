export default function EscrowPage() {
  return (
    <div>
      <div className="esc-hero" style={{position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',right:-40,top:-40,width:300,height:300,background:'radial-gradient(circle,rgba(16,184,145,.2),transparent 70%)',pointerEvents:'none'}}/>
        <div className="container">
          <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:16}}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="12" fill="rgba(16,184,145,0.15)" stroke="rgba(16,184,145,0.3)" strokeWidth="1"/>
              <rect x="16" y="7" width="16" height="12" rx="3" fill="#9AA3B2"/>
              <rect x="11" y="8" width="6" height="8" rx="2" fill="#F4A6B2"/>
              <rect x="31" y="8" width="6" height="8" rx="2" fill="#F4A6B2"/>
              <rect x="13" y="9" width="4" height="7" rx="1.5" fill="#F4A6B2" fillOpacity="0.7"/>
              <rect x="31" y="9" width="4" height="7" rx="1.5" fill="#F4A6B2" fillOpacity="0.7"/>
              <rect x="20" y="9" width="4" height="4" rx="2" fill="#1a1a2e"/>
              <rect x="28" y="9" width="4" height="4" rx="2" fill="#1a1a2e"/>
              <rect x="21" y="10" width="2" height="2" rx="1" fill="white"/>
              <rect x="29" y="10" width="2" height="2" rx="1" fill="white"/>
              <rect x="14" y="21" width="20" height="12" rx="3" fill="#1E3A8A"/>
              <circle cx="36" cy="26" r="8" fill="#FFDD57" stroke="#D97706" strokeWidth="1.5"/>
              <rect x="33" y="24" width="6" height="1.5" rx="1" fill="#92400E"/>
              <rect x="34" y="26" width="4" height="1.5" rx="1" fill="#92400E"/>
              <rect x="33" y="28" width="6" height="1.5" rx="1" fill="#92400E"/>
              <rect x="18" y="33" width="6" height="6" rx="2" fill="#9AA3B2"/>
              <rect x="26" y="33" width="6" height="6" rx="2" fill="#9AA3B2"/>
            </svg>
            <div>
              <div className="section-label" style={{color:'var(--emerald)'}}>ESCROW VAULT</div>
              <h1 style={{fontSize:32,fontWeight:800,color:'#fff'}}>Milestone Escrow Dashboard</h1>
            </div>
          </div>
          <p style={{color:'rgba(255,255,255,.65)',fontSize:16,marginBottom:24}}>Blockchain-secured fund management. Every peso tracked, every release verified.</p>
          <div className="flex gap-12" style={{flexWrap:'wrap'}}>
            <span className="badge badge-emerald">⭐ Stellar Mainnet Live</span>
            <span style={{background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.2)',borderRadius:20,padding:'5px 12px',fontSize:12,fontWeight:600,color:'rgba(255,255,255,.85)'}}>🔐 Soroban Smart Contract</span>
            <span style={{background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.2)',borderRadius:20,padding:'5px 12px',fontSize:12,fontWeight:600,color:'rgba(255,255,255,.85)'}}>🔍 Publicly Auditable</span>
          </div>
        </div>
      </div>

      <div className="esc-grid">
        {[
          {color:'var(--emerald)',label:'TOTAL ESCROWED',value:'₱48.2M',sub:'🔒 486 active escrow vaults'},
          {color:'var(--gold-dark)',label:'RELEASED THIS MONTH',value:'₱8.4M',sub:'✅ 234 milestone releases'},
          {color:'var(--navy-mid)',label:'PENDING VERIFICATION',value:'₱3.1M',sub:'⏳ 47 milestones awaiting'},
          {color:'#EF4444',label:'FRAUD PREVENTED',value:'₱3.1M',sub:'🛡️ 0 successful fraud cases'},
        ].map((s)=>(
          <div key={s.label} className="stat-card" style={{borderLeft:`4px solid ${s.color}`}}>
            <div style={{fontSize:12,color:'var(--text3)',marginBottom:8}}>{s.label}</div>
            <div className="stat-value" style={{color:s.color}}>{s.value}</div>
            <div style={{fontSize:12,color:'var(--text3)',marginTop:6}}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="blockchain-viz">
        <div style={{background:'#fff',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:28,marginBottom:24}}>
          <div className="flex flex-center flex-between mb-24">
            <h3 style={{fontSize:18,fontWeight:700,color:'var(--navy)'}}>⛓️ Escrow Release Flow — Maria Santos Campaign</h3>
            <span className="badge badge-emerald">🔴 Live on Stellar</span>
          </div>
          <div className="chain-steps" style={{justifyContent:'center'}}>
            {[
              {cls:'cs-done',icon:'💸',label:'Donation\nReceived',sub:'₱182,400'},
              {cls:'cs-done',icon:'🔒',label:'Escrow\nLocked',sub:'Contract Live'},
              {cls:'cs-done',icon:'✅',label:'Milestone 1\nVerified',sub:'Nov 28'},
              {cls:'cs-done',icon:'🏥',label:'₱75,000\nto PGH',sub:'Released'},
              {cls:'cs-active',icon:'⏳',label:'Milestone 2\nVerification',sub:'In Review'},
              {cls:'',icon:'🏁',label:'Next\nRelease',sub:'Pending'},
            ].map((step,i,arr)=>(
              <div key={i} style={{display:'contents'}}>
                <div className={`chain-step ${step.cls}`}>
                  <div className="cs-icon">{step.icon}</div>
                  <div className="cs-label" style={{whiteSpace:'pre-line'}}>{step.label}</div>
                  <div style={{fontSize:10,color:step.cls==='cs-done'?'var(--emerald)':step.cls==='cs-active'?'var(--navy-mid)':'var(--text3)',marginTop:4}}>{step.sub}</div>
                </div>
                {i < arr.length-1 && <div style={{flex:1,height:2,background:i<3?'var(--emerald)':'var(--border)',alignSelf:'center',minWidth:40}}/>}
              </div>
            ))}
          </div>
        </div>

        <div style={{background:'#fff',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:28}}>
          <div className="flex flex-center flex-between mb-20">
            <h3 style={{fontSize:18,fontWeight:700,color:'var(--navy)'}}>🔍 Recent Blockchain Transactions</h3>
            <button className="btn btn-outline btn-sm">View All on Stellar Explorer</button>
          </div>
          {[
            {icon:'✅',iconBg:'rgba(16,184,145,.1)',title:'Milestone Release — PGH Billing',hash:'STELLAR:0x4a8f...3c2b • Nov 28, 2025 at 14:32 PHT',badge:'badge-emerald',badgeText:'Immutable Record',amount:'₱75,000',dest:'To: PGH Hospital',amountColor:'var(--emerald)'},
            {icon:'💸',iconBg:'rgba(255,221,87,.15)',title:'Donation Received — Escrow Lock',hash:'STELLAR:0x7d2e...9a1f • Nov 24, 2025 at 09:15 PHT',badge:'badge-gold',badgeText:'Publicly Verifiable',amount:'₱182,400',dest:'Escrow Vault',amountColor:'var(--gold-dark)'},
            {icon:'🔐',iconBg:'rgba(37,99,235,.1)',title:'Campaign Verification — Smart Contract Deploy',hash:'STELLAR:0x2f9c...8e4a • Nov 12, 2025 at 16:44 PHT',badge:'badge-blue',badgeText:'Blockchain Verified',amount:'Contract Live',dest:'Soroban',amountColor:'var(--navy-light)'},
          ].map((tx)=>(
            <div key={tx.title} className="tx-card">
              <div className="tx-icon" style={{background:tx.iconBg}}>{tx.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:14,color:'var(--navy)'}}>{tx.title}</div>
                <div className="tx-hash">{tx.hash}</div>
                <div style={{marginTop:6}}><span className={`badge ${tx.badge}`} style={{fontSize:11}}>{tx.badgeText}</span></div>
              </div>
              <div className="text-right">
                <div className="tx-amount" style={{color:tx.amountColor}}>{tx.amount}</div>
                <div style={{fontSize:11,color:'var(--text3)'}}>{tx.dest}</div>
              </div>
            </div>
          ))}
          <div style={{marginTop:20,padding:16,background:'var(--bg)',borderRadius:10,border:'1px dashed var(--border2)',display:'flex',gap:10,alignItems:'flex-start'}}>
            <span style={{fontSize:20}}>🐘</span>
            <div style={{fontSize:13,color:'var(--text2)',lineHeight:1.6}}><strong style={{color:'var(--navy)'}}>All actions are publicly auditable and permanently recorded on-chain.</strong> Every transaction includes a Stellar blockchain reference that anyone can verify at any time. The record is immutable — it cannot be altered or deleted.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
