import {
  AlertCircle, CheckCircle2, AlertTriangle, ShieldCheck, Search, Link2, XCircle
} from "lucide-react";
import { CAMPAIGNS } from "@/lib/campaigns";

export default function AdminPage() {
  return (
    <div>
      <div style={{background:'var(--forest)',padding:'48px 40px'}}>
        <div className="container">
          <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:16}}>
            <div style={{background:'rgba(220,38,38,.2)',border:'1px solid rgba(220,38,38,.3)',borderRadius:8,padding:'6px 12px',fontSize:12,fontWeight:700,color:'#FCA5A5',fontFamily:'Space Mono,monospace',display:'flex',alignItems:'center',gap:6}}>
              <span style={{width:6,height:6,background:'#DC2626',borderRadius:'50%',display:'inline-block'}}/>
              ADMIN ONLY — READ-ONLY SIMULATION
            </div>
          </div>
          <h1 style={{fontSize:36,fontWeight:800,color:'#fff',marginBottom:8}}>Admin Oversight Dashboard</h1>
          <p style={{color:'rgba(255,255,255,.65)',fontSize:16}}>Platform monitoring, fraud detection, and audit logs. All actions publicly auditable and permanently recorded on-chain.</p>
        </div>
      </div>

      <div className="page-inner">
        <div className="admin-grid mb-28">
          <div className="admin-card" style={{borderLeft:'4px solid var(--canopy)'}}>
            <div style={{fontSize:11,color:'var(--text3)',marginBottom:8}}>TOTAL CAMPAIGNS</div>
            <div style={{fontFamily:'Sora,sans-serif',fontSize:30,fontWeight:800,color:'var(--forest)'}}>486</div>
            <div style={{fontSize:12,color:'var(--text3)'}}>451 verified · 35 pending</div>
          </div>
          <div className="admin-card" style={{borderLeft:'4px solid var(--forest-mid)'}}>
            <div style={{fontSize:11,color:'var(--text3)',marginBottom:8}}>VERIFIED INSTITUTIONS</div>
            <div style={{fontFamily:'Sora,sans-serif',fontSize:30,fontWeight:800,color:'var(--forest)'}}>127</div>
            <div style={{fontSize:12,color:'var(--text3)'}}>Hospitals, pharmacies, schools, NGOs</div>
          </div>
          <div className="admin-card" style={{borderLeft:'4px solid var(--amber)'}}>
            <div style={{fontSize:11,color:'var(--text3)',marginBottom:8}}>FUNDS ESCROWED</div>
            <div style={{fontFamily:'Sora,sans-serif',fontSize:30,fontWeight:800,color:'var(--forest)'}}>₱48.2M</div>
            <div style={{fontSize:12,color:'var(--text3)'}}>Across all active campaigns</div>
          </div>
          <div className="admin-card" style={{borderLeft:'4px solid #DC2626'}}>
            <div style={{fontSize:11,color:'var(--text3)',marginBottom:8}}>FRAUD PREVENTED</div>
            <div style={{fontFamily:'Sora,sans-serif',fontSize:30,fontWeight:800,color:'#DC2626'}}>₱3.1M</div>
            <div style={{fontSize:12,color:'var(--text3)'}}>14 suspicious campaigns blocked</div>
          </div>
        </div>

        <div className="grid-2 mb-24" style={{alignItems:'start'}}>
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:24}}>
            <h3 style={{fontSize:18,fontWeight:700,color:'var(--forest)',marginBottom:20,display:'flex',alignItems:'center',gap:8}}>
              <ShieldCheck size={18} color="var(--canopy)" strokeWidth={1.8}/> Escrow Health Monitor
            </h3>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {[
                {label:'Medical Campaigns',pct:98,health:'98.2% healthy',color:'prog-emerald',textColor:'var(--canopy)'},
                {label:'Disaster Relief',pct:94,health:'94.5% healthy',color:'prog-emerald',textColor:'var(--canopy)'},
                {label:'Education Funds',pct:87,health:'87.1% healthy',color:'prog-gold',textColor:'var(--amber)'},
                {label:'Community Projects',pct:96,health:'96.0% healthy',color:'prog-emerald',textColor:'var(--canopy)'},
              ].map((s)=>(
                <div key={s.label}>
                  <div className="flex flex-center flex-between mb-6">
                    <span style={{fontSize:13,color:'var(--text2)'}}>{s.label}</span>
                    <span style={{fontSize:13,fontWeight:600,color:s.textColor}}>{s.health}</span>
                  </div>
                  <div className="prog-track" style={{height:8}}>
                    <div className={`prog-fill ${s.color}`} style={{width:`${s.pct}%`}}/>
                  </div>
                </div>
              ))}
            </div>
            <div style={{marginTop:20,padding:14,background:'rgba(74,155,106,.06)',border:'1px solid rgba(74,155,106,.2)',borderRadius:10,display:'flex',alignItems:'center',gap:8}}>
              <CheckCircle2 size={14} color="var(--forest-light)" strokeWidth={2}/>
              <div>
                <div style={{fontSize:13,color:'var(--forest-light)',fontWeight:600}}>Platform Overall Health: 94.2%</div>
                <div style={{fontSize:12,color:'var(--text3)',marginTop:2}}>No critical issues detected. 3 campaigns under manual review.</div>
              </div>
            </div>
          </div>

          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:24}}>
            <h3 style={{fontSize:18,fontWeight:700,color:'var(--forest)',marginBottom:20,display:'flex',alignItems:'center',gap:8}}>
              <AlertCircle size={18} color="#DC2626" strokeWidth={1.8}/> AI Alert Feed
            </h3>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{padding:14,background:'rgba(220,38,38,.05)',border:'1px solid rgba(220,38,38,.2)',borderRadius:10}}>
                <div className="flex flex-center flex-between mb-6">
                  <span className="badge badge-red" style={{fontSize:11,display:'inline-flex',alignItems:'center',gap:4}}><XCircle size={10}/> HIGH</span>
                  <span style={{fontSize:11,color:'var(--text3)'}}>10 min ago</span>
                </div>
                <div style={{fontSize:13,fontWeight:600,color:'var(--forest)'}}>Duplicate Campaign Detected</div>
                <div style={{fontSize:12,color:'var(--text2)'}}>94% image match with existing campaign. Account age: 2 days. Auto-paused.</div>
                <div className="flex gap-8 mt-8">
                  <button className="btn btn-sm" style={{background:'#DC2626',color:'#fff',border:'none'}}>Block</button>
                  <button className="btn btn-outline btn-sm">Investigate</button>
                </div>
              </div>
              <div style={{padding:14,background:'rgba(200,134,10,.05)',border:'1px solid rgba(200,134,10,.2)',borderRadius:10}}>
                <div className="flex flex-center flex-between mb-6">
                  <span className="badge badge-gold" style={{fontSize:11,display:'inline-flex',alignItems:'center',gap:4}}><AlertTriangle size={10}/> MEDIUM</span>
                  <span style={{fontSize:11,color:'var(--text3)'}}>1 hr ago</span>
                </div>
                <div style={{fontSize:13,fontWeight:600,color:'var(--forest)'}}>Milestone Delay — 8 Days</div>
                <div style={{fontSize:12,color:'var(--text2)'}}>Reyes Rehab Center campaign. Invoice amount mismatch ₱2,300. Review required.</div>
                <div className="flex gap-8 mt-8">
                  <button className="btn btn-outline btn-sm">Review</button>
                </div>
              </div>
              <div style={{padding:14,background:'rgba(74,155,106,.05)',border:'1px solid rgba(74,155,106,.2)',borderRadius:10}}>
                <div className="flex flex-center flex-between mb-6">
                  <span className="badge badge-emerald" style={{fontSize:11,display:'inline-flex',alignItems:'center',gap:4}}><CheckCircle2 size={10}/> LOW</span>
                  <span style={{fontSize:11,color:'var(--text3)'}}>2 hrs ago</span>
                </div>
                <div style={{fontSize:13,fontWeight:600,color:'var(--forest)'}}>All Clear — {CAMPAIGNS[0].shortTitle}</div>
                <div style={{fontSize:12,color:'var(--text2)'}}>Documents verified. Spending pattern normal. Milestone 2 in progress.</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:28}}>
          <div className="flex flex-center flex-between mb-20">
            <h3 style={{fontSize:18,fontWeight:700,color:'var(--forest)',display:'flex',alignItems:'center',gap:8}}>
              <Search size={18} color="var(--canopy)" strokeWidth={1.8}/> Audit Log — Immutable Records
            </h3>
            <div className="flex gap-8">
              <span className="badge badge-emerald" style={{display:'inline-flex',alignItems:'center',gap:4}}><Link2 size={10}/> On-chain</span>
              <button className="btn btn-outline btn-sm">Export CSV</button>
            </div>
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{borderBottom:'2px solid var(--border)'}}>
                  {['TIMESTAMP','CAMPAIGN ID','EVENT','BLOCKCHAIN REF','STATUS'].map((h)=>(
                    <th key={h} style={{textAlign:'left',padding:'10px 12px',color:'var(--text3)',fontWeight:600,fontSize:12}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  {time:'2025-11-28 14:32',id:'LNGP-0847',event:`Milestone Release — ₱75,000 to ${CAMPAIGNS[0].institution}`,ref:'0x4a8f...3c2b',badge:'badge-emerald',Icon:CheckCircle2,status:'Confirmed'},
                  {time:'2025-11-28 12:01',id:'LNGP-0891',event:'Campaign Paused — Duplicate Detected',ref:'0x7d2e...9a1f',badge:'badge-red',Icon:XCircle,status:'Blocked'},
                  {time:'2025-11-27 18:44',id:'LNGP-0234',event:'Document Verified — Medical Certificate',ref:'0x2f9c...8e4a',badge:'badge-emerald',Icon:CheckCircle2,status:'Confirmed'},
                  {time:'2025-11-26 09:15',id:'LNGP-0612',event:'Milestone Flag — Invoice Mismatch',ref:'0x8c1a...4f9e',badge:'badge-gold',Icon:AlertTriangle,status:'Review'},
                  {time:'2025-11-25 16:33',id:'LNGP-0099',event:'New Institution Verified — Ospital ng Maynila',ref:'0x3b7d...2c6f',badge:'badge-emerald',Icon:CheckCircle2,status:'Confirmed'},
                ].map((row)=>(
                  <tr key={row.ref} style={{borderBottom:'1px solid var(--border)'}}>
                    <td style={{padding:'10px 12px',color:'var(--text2)',fontFamily:'Space Mono,monospace',fontSize:12}}>{row.time}</td>
                    <td style={{padding:'10px 12px',fontFamily:'Space Mono,monospace'}}>{row.id}</td>
                    <td style={{padding:'10px 12px',fontWeight:600,color:'var(--forest)'}}>{row.event}</td>
                    <td style={{padding:'10px 12px',color:'var(--canopy)',fontFamily:'Space Mono,monospace',fontSize:11}}>{row.ref}</td>
                    <td style={{padding:'10px 12px'}}>
                      <span className={`badge ${row.badge}`} style={{fontSize:11,display:'inline-flex',alignItems:'center',gap:4}}>
                        <row.Icon size={10}/>{row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{marginTop:20,padding:16,background:'rgba(220,38,38,.04)',border:'1px solid rgba(220,38,38,.15)',borderRadius:10,display:'flex',gap:10,alignItems:'flex-start'}}>
            <AlertTriangle size={18} color="#DC2626" strokeWidth={1.8} style={{flexShrink:0,marginTop:1}}/>
            <div style={{fontSize:13,color:'#991B1B',lineHeight:1.6}}><strong>All actions are publicly auditable and permanently recorded on-chain.</strong> This dashboard is a read-only simulation. All administrative decisions are executed via Soroban smart contracts and cannot be unilaterally reversed. Community consensus is required for all clawback and fraud resolution events.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
