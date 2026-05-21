import {
  Bot, CheckCircle2, AlertTriangle, XCircle, Receipt, Pill, Camera,
  Stethoscope, Ticket, FileWarning, Clock, ShieldCheck
} from "lucide-react";

export default function ProofPage() {
  return (
    <div>
      <div style={{background:'var(--forest)',padding:'48px 40px'}}>
        <div className="container">
          <div className="section-label" style={{color:'var(--canopy-light)'}}>VERIFICATION CENTER</div>
          <h1 style={{fontSize:36,fontWeight:800,color:'#fff',marginBottom:12}}>Proof of Progress & Reality</h1>
          <p style={{color:'rgba(255,255,255,.65)',fontSize:16}}>Every document verified. Every claim proven. Powered by AI and community validators.</p>
        </div>
      </div>

      <div className="page-inner">
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:24,marginBottom:28}}>
          <div className="flex flex-center gap-12 mb-20">
            <div style={{width:40,height:40,background:'rgba(74,155,106,.1)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Bot size={20} color="var(--canopy)" strokeWidth={1.8}/>
            </div>
            <h3 style={{fontSize:18,fontWeight:700,color:'var(--forest)'}}>AI Risk Assessment Feed</h3>
          </div>
          <div>
            <div className="ai-alert ai-alert-low mb-8">
              <div className="flex flex-center flex-between mb-4">
                <div className="flex flex-center gap-8">
                  <span className="badge badge-emerald" style={{fontSize:11,display:'inline-flex',alignItems:'center',gap:4}}><CheckCircle2 size={10}/> LOW RISK</span>
                  <span style={{fontSize:13,fontWeight:600,color:'var(--forest)'}}>Maria Santos — Cancer Treatment</span>
                </div>
                <span style={{fontSize:12,color:'var(--text3)'}}>2 min ago</span>
              </div>
              <div style={{fontSize:13,color:'var(--text2)'}}>All spending patterns normal. Institution verified. Documents match submitted receipts. Confidence: 97.2%</div>
            </div>
            <div className="ai-alert ai-alert-med mb-8">
              <div className="flex flex-center flex-between mb-4">
                <div className="flex flex-center gap-8">
                  <span className="badge badge-gold" style={{fontSize:11,display:'inline-flex',alignItems:'center',gap:4}}><AlertTriangle size={10}/> MEDIUM RISK</span>
                  <span style={{fontSize:13,fontWeight:600,color:'var(--forest)'}}>Reyes Family — Rehab Center</span>
                </div>
                <span style={{fontSize:12,color:'var(--text3)'}}>15 min ago</span>
              </div>
              <div style={{fontSize:13,color:'var(--text2)'}}>Milestone 2 delayed by 8 days. Institution invoice amount ₱2,300 higher than campaign stated. Flagged for manual review.</div>
            </div>
            <div className="ai-alert ai-alert-high">
              <div className="flex flex-center flex-between mb-4">
                <div className="flex flex-center gap-8">
                  <span className="badge badge-red" style={{fontSize:11,display:'inline-flex',alignItems:'center',gap:4}}><XCircle size={10}/> HIGH RISK</span>
                  <span style={{fontSize:13,fontWeight:600,color:'var(--forest)'}}>Unknown — &quot;Flood Relief Tondo&quot;</span>
                </div>
                <span style={{fontSize:12,color:'var(--text3)'}}>1 hr ago</span>
              </div>
              <div style={{fontSize:13,color:'var(--text2)'}}>Duplicate campaign detected. 94% image similarity to existing verified campaign. Account created 2 days ago. CAMPAIGN PAUSED pending investigation.</div>
            </div>
          </div>
        </div>

        <div className="flex flex-center flex-between mb-20">
          <h3 style={{fontSize:20,fontWeight:700,color:'var(--forest)',display:'flex',alignItems:'center',gap:8}}>
            <ShieldCheck size={20} color="var(--canopy)" strokeWidth={1.8}/> Verified Proof Documents
          </h3>
          <div className="flex gap-8">
            {['All','Receipts','Medical','Photos'].map((f,i)=>(
              <button key={f} className={`filter-chip${i===0?' active':''}`}>{f}</button>
            ))}
          </div>
        </div>

        <div className="proof-grid">
          {[
            {Icon:Receipt,bg:'linear-gradient(135deg,rgba(74,155,106,.1),rgba(61,122,82,.1))',badge:{cls:'badge-emerald',text:'Verified'},title:'PGH Official Receipt — Chemo Cycle 3',sub:'Nov 25, 2025 • Receipt #PGH-2025-00847',leftBadge:{cls:'badge-navy',text:'₱25,000.00'},rightBadge:{cls:'badge-emerald',text:'AI Verified'}},
            {Icon:Pill,bg:'linear-gradient(135deg,rgba(200,134,10,.1),rgba(160,113,74,.1))',badge:{cls:'badge-emerald',text:'Verified'},title:'Pharmacy Invoice — Chemotherapy Drugs',sub:'Nov 26, 2025 • Mercury Drug España Branch',leftBadge:{cls:'badge-navy',text:'₱12,400.00'},rightBadge:{cls:'badge-emerald',text:'AI Verified'}},
            {Icon:Camera,bg:'linear-gradient(135deg,rgba(139,92,246,.1),rgba(109,40,217,.1))',badge:{cls:'badge-emerald',text:'Verified'},title:'Progress Photo — Patient Hospital Room',sub:'Nov 27, 2025 • PGH Ward 4, Bed 12',leftBadge:{cls:'badge-blue',text:'Photo'},rightBadge:{cls:'badge-emerald',text:'Community Confirmed'}},
            {Icon:Stethoscope,bg:'linear-gradient(135deg,rgba(74,155,106,.1),rgba(61,122,82,.1))',badge:{cls:'badge-emerald',text:'Verified'},title:'Medical Certificate — Oncologist Dr. Reyes',sub:'Nov 15, 2025 • PGH Oncology Dept.',leftBadge:{cls:'badge-navy',text:'Official Doc'},rightBadge:{cls:'badge-emerald',text:'Immutable'}},
            {Icon:Ticket,bg:'linear-gradient(135deg,rgba(61,122,82,.1),rgba(45,90,61,.1))',badge:{cls:'badge-blue',text:'Under Review'},title:'PUP Enrollment Receipt — Juan dela Cruz',sub:'Nov 28, 2025 • PUP Manila Registrar',leftBadge:{cls:'badge-navy',text:'₱8,500.00'},rightBadge:{cls:'badge-gold',text:'Pending'}},
            {Icon:FileWarning,bg:'linear-gradient(135deg,rgba(220,38,38,.08),rgba(185,28,28,.08))',badge:{cls:'badge-red',text:'Flagged'},title:'Invoice — Amount Discrepancy Detected',sub:'Nov 29, 2025 • Reyes Rehab Center',leftBadge:{cls:'badge-red',text:'High Risk'},rightBadge:{cls:'badge-red',text:'Manual Review'}},
          ].map((p)=>(
            <div key={p.title} className="proof-card">
              <div className="proof-thumb" style={{background:p.bg}}>
                <p.Icon size={48} strokeWidth={1.2}/>
                <div style={{position:'absolute',top:10,right:10}}><span className={`badge ${p.badge.cls}`} style={{fontSize:11}}>{p.badge.text}</span></div>
              </div>
              <div className="proof-body">
                <div style={{fontWeight:600,fontSize:14,color:'var(--forest)',marginBottom:4}}>{p.title}</div>
                <div style={{fontSize:12,color:'var(--text3)',marginBottom:10}}>{p.sub}</div>
                <div className="flex flex-center flex-between">
                  <span className={`badge ${p.leftBadge.cls}`} style={{fontSize:11}}>{p.leftBadge.text}</span>
                  <span className={`badge ${p.rightBadge.cls}`} style={{fontSize:11}}>{p.rightBadge.text}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:28,marginTop:28}}>
          <h3 style={{fontSize:18,fontWeight:700,color:'var(--forest)',marginBottom:20}}>Badge Verification System</h3>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:12}}>
            {[
              {Icon:CheckCircle2,text:'VERIFIED',bg:'rgba(74,155,106,.06)',border:'rgba(74,155,106,.2)',color:'var(--forest-light)'},
              {Icon:Clock,text:'UNDER REVIEW',bg:'rgba(200,134,10,.06)',border:'rgba(200,134,10,.2)',color:'var(--amber)'},
              {Icon:AlertTriangle,text:'FLAGGED',bg:'rgba(220,38,38,.06)',border:'rgba(220,38,38,.2)',color:'#991B1B'},
              {Icon:CheckCircle2,text:'LOW RISK',bg:'rgba(74,155,106,.06)',border:'rgba(74,155,106,.2)',color:'var(--forest-light)'},
              {Icon:AlertTriangle,text:'MEDIUM RISK',bg:'rgba(200,134,10,.06)',border:'rgba(200,134,10,.2)',color:'var(--amber)'},
              {Icon:XCircle,text:'HIGH RISK',bg:'rgba(220,38,38,.06)',border:'rgba(220,38,38,.2)',color:'#991B1B'},
            ].map((b)=>(
              <div key={b.text} style={{textAlign:'center',padding:16,background:b.bg,border:`1px solid ${b.border}`,borderRadius:12}}>
                <div style={{display:'flex',justifyContent:'center',marginBottom:8}}><b.Icon size={28} color={b.color} strokeWidth={1.5}/></div>
                <div style={{fontSize:12,fontWeight:700,color:b.color}}>{b.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
