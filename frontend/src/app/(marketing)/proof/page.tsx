export default function ProofPage() {
  return (
    <div>
      <div style={{background:'var(--navy)',padding:'48px 40px'}}>
        <div className="container">
          <div className="section-label" style={{color:'var(--emerald)'}}>VERIFICATION CENTER</div>
          <h1 style={{fontSize:36,fontWeight:800,color:'#fff',marginBottom:12}}>Proof of Progress & Reality</h1>
          <p style={{color:'rgba(255,255,255,.65)',fontSize:16}}>Every document verified. Every claim proven. Powered by AI and community validators.</p>
        </div>
      </div>

      <div className="page-inner">
        <div style={{background:'#fff',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:24,marginBottom:28}}>
          <div className="flex flex-center gap-12 mb-20">
            <div style={{width:40,height:40,background:'rgba(16,184,145,.1)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>🤖</div>
            <h3 style={{fontSize:18,fontWeight:700,color:'var(--navy)'}}>AI Risk Assessment Feed</h3>
          </div>
          <div>
            <div className="ai-alert ai-alert-low mb-8">
              <div className="flex flex-center flex-between mb-4"><div className="flex flex-center gap-8"><span className="badge badge-emerald" style={{fontSize:11}}>✅ LOW RISK</span><span style={{fontSize:13,fontWeight:600,color:'var(--navy)'}}>Maria Santos — Cancer Treatment</span></div><span style={{fontSize:12,color:'var(--text3)'}}>2 min ago</span></div>
              <div style={{fontSize:13,color:'var(--text2)'}}>All spending patterns normal. Institution verified. Documents match submitted receipts. Confidence: 97.2%</div>
            </div>
            <div className="ai-alert ai-alert-med mb-8">
              <div className="flex flex-center flex-between mb-4"><div className="flex flex-center gap-8"><span className="badge badge-gold" style={{fontSize:11}}>⚠️ MEDIUM RISK</span><span style={{fontSize:13,fontWeight:600,color:'var(--navy)'}}>Reyes Family — Rehab Center</span></div><span style={{fontSize:12,color:'var(--text3)'}}>15 min ago</span></div>
              <div style={{fontSize:13,color:'var(--text2)'}}>Milestone 2 delayed by 8 days. Institution invoice amount ₱2,300 higher than campaign stated. Flagged for manual review.</div>
            </div>
            <div className="ai-alert ai-alert-high">
              <div className="flex flex-center flex-between mb-4"><div className="flex flex-center gap-8"><span className="badge badge-red" style={{fontSize:11}}>🔴 HIGH RISK</span><span style={{fontSize:13,fontWeight:600,color:'var(--navy)'}}>Unknown — &quot;Flood Relief Tondo&quot;</span></div><span style={{fontSize:12,color:'var(--text3)'}}>1 hr ago</span></div>
              <div style={{fontSize:13,color:'var(--text2)'}}>Duplicate campaign detected. 94% image similarity to existing verified campaign. Account created 2 days ago. CAMPAIGN PAUSED pending investigation.</div>
            </div>
          </div>
        </div>

        <div className="flex flex-center flex-between mb-20">
          <h3 style={{fontSize:20,fontWeight:700,color:'var(--navy)'}}>📋 Verified Proof Documents</h3>
          <div className="flex gap-8">
            {['All','Receipts','Medical','Photos'].map((f,i)=>(
              <button key={f} className={`filter-chip${i===0?' active':''}`}>{f}</button>
            ))}
          </div>
        </div>

        <div className="proof-grid">
          {[
            {icon:'🧾',bg:'linear-gradient(135deg,rgba(16,184,145,.1),rgba(37,99,235,.1))',badge:{cls:'badge-emerald',text:'✅ Verified'},title:'PGH Official Receipt — Chemo Cycle 3',sub:'Nov 25, 2025 • Receipt #PGH-2025-00847',leftBadge:{cls:'badge-navy',text:'₱25,000.00'},rightBadge:{cls:'badge-emerald',text:'AI Verified'}},
            {icon:'💊',bg:'linear-gradient(135deg,rgba(245,158,11,.1),rgba(217,119,6,.1))',badge:{cls:'badge-emerald',text:'✅ Verified'},title:'Pharmacy Invoice — Chemotherapy Drugs',sub:'Nov 26, 2025 • Mercury Drug España Branch',leftBadge:{cls:'badge-navy',text:'₱12,400.00'},rightBadge:{cls:'badge-emerald',text:'AI Verified'}},
            {icon:'📷',bg:'linear-gradient(135deg,rgba(139,92,246,.1),rgba(109,40,217,.1))',badge:{cls:'badge-emerald',text:'✅ Verified'},title:'Progress Photo — Patient Hospital Room',sub:'Nov 27, 2025 • PGH Ward 4, Bed 12',leftBadge:{cls:'badge-blue',text:'Photo'},rightBadge:{cls:'badge-emerald',text:'Community Confirmed'}},
            {icon:'🩺',bg:'linear-gradient(135deg,rgba(16,184,145,.1),rgba(5,150,105,.1))',badge:{cls:'badge-emerald',text:'✅ Verified'},title:'Medical Certificate — Oncologist Dr. Reyes',sub:'Nov 15, 2025 • PGH Oncology Dept.',leftBadge:{cls:'badge-navy',text:'Official Doc'},rightBadge:{cls:'badge-emerald',text:'Immutable'}},
            {icon:'🎫',bg:'linear-gradient(135deg,rgba(37,99,235,.1),rgba(29,78,216,.1))',badge:{cls:'badge-blue',text:'⏳ Under Review'},title:'PUP Enrollment Receipt — Juan dela Cruz',sub:'Nov 28, 2025 • PUP Manila Registrar',leftBadge:{cls:'badge-navy',text:'₱8,500.00'},rightBadge:{cls:'badge-gold',text:'Pending'}},
            {icon:'⚠️',bg:'linear-gradient(135deg,rgba(239,68,68,.08),rgba(185,28,28,.08))',badge:{cls:'badge-red',text:'🔴 Flagged'},title:'Invoice — Amount Discrepancy Detected',sub:'Nov 29, 2025 • Reyes Rehab Center',leftBadge:{cls:'badge-red',text:'High Risk'},rightBadge:{cls:'badge-red',text:'Manual Review'}},
          ].map((p)=>(
            <div key={p.title} className="proof-card">
              <div className="proof-thumb" style={{background:p.bg}}>
                {p.icon}
                <div style={{position:'absolute',top:10,right:10}}><span className={`badge ${p.badge.cls}`} style={{fontSize:11}}>{p.badge.text}</span></div>
              </div>
              <div className="proof-body">
                <div style={{fontWeight:600,fontSize:14,color:'var(--navy)',marginBottom:4}}>{p.title}</div>
                <div style={{fontSize:12,color:'var(--text3)',marginBottom:10}}>{p.sub}</div>
                <div className="flex flex-center flex-between">
                  <span className={`badge ${p.leftBadge.cls}`} style={{fontSize:11}}>{p.leftBadge.text}</span>
                  <span className={`badge ${p.rightBadge.cls}`} style={{fontSize:11}}>{p.rightBadge.text}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{background:'#fff',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:28,marginTop:28}}>
          <h3 style={{fontSize:18,fontWeight:700,color:'var(--navy)',marginBottom:20}}>🏷️ Badge Verification System</h3>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:12}}>
            {[
              {icon:'✅',text:'VERIFIED',bg:'rgba(16,184,145,.06)',border:'rgba(16,184,145,.2)',color:'var(--emerald-dark)'},
              {icon:'⏳',text:'UNDER REVIEW',bg:'rgba(245,158,11,.06)',border:'rgba(245,158,11,.2)',color:'var(--gold-darker)'},
              {icon:'🚩',text:'FLAGGED',bg:'rgba(239,68,68,.06)',border:'rgba(239,68,68,.2)',color:'#B91C1C'},
              {icon:'🟢',text:'LOW RISK',bg:'rgba(16,184,145,.06)',border:'rgba(16,184,145,.2)',color:'var(--emerald-dark)'},
              {icon:'🟡',text:'MEDIUM RISK',bg:'rgba(245,158,11,.06)',border:'rgba(245,158,11,.2)',color:'var(--gold-darker)'},
              {icon:'🔴',text:'HIGH RISK',bg:'rgba(239,68,68,.06)',border:'rgba(239,68,68,.2)',color:'#B91C1C'},
            ].map((b)=>(
              <div key={b.text} style={{textAlign:'center',padding:16,background:b.bg,border:`1px solid ${b.border}`,borderRadius:12}}>
                <div style={{fontSize:28,marginBottom:8}}>{b.icon}</div>
                <div style={{fontSize:12,fontWeight:700,color:b.color}}>{b.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
