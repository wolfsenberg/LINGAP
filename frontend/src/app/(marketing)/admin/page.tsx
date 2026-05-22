"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  AlertCircle, ArrowLeft, CheckCircle2, AlertTriangle, Eye, EyeOff, Lock, Network, ShieldCheck, Search, Link2, XCircle, History
} from "lucide-react";
import { CAMPAIGNS } from "@/lib/campaigns";
import { authApi, campaignsApi, type CampaignChangeLogApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function AdminPage() {
  const { user, isAuthenticated, setAuth } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [campaignChanges, setCampaignChanges] = useState<CampaignChangeLogApi[]>([]);
  const [deleteRequests, setDeleteRequests] = useState<CampaignChangeLogApi[]>([]);
  const isAdmin = isAuthenticated && user?.role === "admin";

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    Promise.allSettled([campaignsApi.changeLog(8), campaignsApi.deleteRequests(8)]).then(([changes, deletes]) => {
      if (!active) return;
      setCampaignChanges(changes.status === "fulfilled" ? changes.value.data.data : []);
      setDeleteRequests(deletes.status === "fulfilled" ? deletes.value.data.data : []);
    });
    return () => {
      active = false;
    };
  }, [isAdmin]);

  async function handleAdminLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await authApi.adminLogin(email.trim(), password);
      const { token, user: adminUser } = res.data.data;
      setAuth(adminUser, token);
      toast.success("Welcome back, admin.");
    } catch {
      toast.error("Invalid admin credentials.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function reviewDeleteRequest(requestId: string, action: "approve" | "reject") {
    try {
      const res =
        action === "approve"
          ? await campaignsApi.approveDeleteRequest(requestId)
          : await campaignsApi.rejectDeleteRequest(requestId);
      setDeleteRequests((items) => items.map((item) => (item.id === requestId ? res.data.data : item)));
      toast.success(action === "approve" ? "Campaign deletion approved." : "Campaign deletion rejected.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to review delete request.");
    }
  }

  if (!isAdmin) {
    return (
      <main className="admin-auth-page">
        <section className="admin-auth-brand">
          <Link href="/" className="auth-back-link">
            <ArrowLeft size={15} /> Back to home
          </Link>

          <div className="admin-auth-brand-main">
            <div className="auth-logo-row">
              <img src="/images/donate.png" alt="" />
              <span>LIN<span>GAP</span></span>
            </div>
            <h1>Admin control starts with verified access.</h1>
            <p>
              Sign in to monitor campaign health, review fraud alerts, and inspect immutable audit records from one protected workspace.
            </p>
          </div>

          <div className="admin-auth-visual">
            <img src="/images/laptop.png" alt="" />
          </div>
        </section>

        <section className="admin-auth-card-wrap">
          <div className="auth-card admin-auth-card">
            <div className="auth-card-head">
              <div className="auth-card-icon">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h2>Welcome back, admin</h2>
                <p>Use the authorized LINGAP admin email to continue.</p>
              </div>
            </div>

            <form onSubmit={handleAdminLogin} className="auth-form admin-login-form">
              <label>
                <span>Admin email</span>
                <input
                  className="form-input"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="lingap.admin@test.com"
                  autoComplete="email"
                />
              </label>

              <label>
                <span>Password</span>
                <div className="auth-password-field">
                  <input
                    className="form-input"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter admin password"
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <div className="admin-auth-note">
                <Lock size={14} />
                <span>Admin sessions are role-checked by the backend before the dashboard is shown.</span>
              </div>

              <button className="btn btn-emerald btn-lg admin-login-submit" disabled={isSubmitting || !email.trim() || !password}>
                {isSubmitting ? "Checking access..." : "Sign In as Admin"}
              </button>
            </form>

            <div className="admin-auth-footer">
              <Network size={14} />
              Audit access is recorded under the LINGAP admin role.
            </div>
          </div>
        </section>
      </main>
    );
  }

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

        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:24,marginBottom:24}}>
          <div className="flex flex-center flex-between mb-20" style={{gap:16,flexWrap:'wrap'}}>
            <h3 style={{fontSize:18,fontWeight:700,color:'var(--forest)',display:'flex',alignItems:'center',gap:8}}>
              <History size={18} color="var(--canopy)" strokeWidth={1.8}/> Campaign Edit Review
            </h3>
            <span className="badge badge-emerald">{campaignChanges.length} recent changes</span>
          </div>

          {campaignChanges.length > 0 ? (
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                <thead>
                  <tr style={{borderBottom:'2px solid var(--border)'}}>
                    {['TIME','ORGANIZER','CAMPAIGN','FIELDS CHANGED','SUMMARY'].map((h)=>(
                      <th key={h} style={{textAlign:'left',padding:'10px 12px',color:'var(--text3)',fontWeight:600,fontSize:12}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaignChanges.map((change)=>(
                    <tr key={change.id} style={{borderBottom:'1px solid var(--border)'}}>
                      <td style={{padding:'10px 12px',color:'var(--text2)',fontFamily:'Space Mono,monospace',fontSize:12}}>
                        {new Date(change.created_at).toLocaleString('en-PH', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                      </td>
                      <td style={{padding:'10px 12px'}}>
                        <div style={{fontWeight:700,color:'var(--forest)'}}>{change.actor_name}</div>
                        <div style={{fontSize:11,color:'var(--text3)'}}>{change.actor_email}</div>
                      </td>
                      <td style={{padding:'10px 12px',fontWeight:700,color:'var(--forest)'}}>{change.campaign_title}</td>
                      <td style={{padding:'10px 12px'}}>
                        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                          {change.changed_fields.map((field)=>(
                            <span key={field} className="badge badge-navy" style={{fontSize:10}}>{field.replace('_',' ')}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{padding:'10px 12px',color:'var(--text2)'}}>{change.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{padding:18,border:'1px dashed var(--border)',borderRadius:10,color:'var(--text2)',fontSize:13}}>
              No organizer campaign edits have been recorded yet.
            </div>
          )}
        </div>

        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:24,marginBottom:24}}>
          <div className="flex flex-center flex-between mb-20" style={{gap:16,flexWrap:'wrap'}}>
            <h3 style={{fontSize:18,fontWeight:700,color:'var(--forest)',display:'flex',alignItems:'center',gap:8}}>
              <XCircle size={18} color="#DC2626" strokeWidth={1.8}/> Campaign Delete Requests
            </h3>
            <span className="badge badge-gold">{deleteRequests.filter((item)=>item.changes?.delete_request?.status === 'pending').length} pending</span>
          </div>

          {deleteRequests.length > 0 ? (
            <div style={{display:'grid',gap:10}}>
              {deleteRequests.map((request)=>{
                const status = request.changes?.delete_request?.status || "pending";
                const pending = status === "pending";
                return (
                  <div key={request.id} style={{border:'1px solid var(--border)',borderRadius:12,padding:14,display:'grid',gridTemplateColumns:'1fr auto',gap:14,alignItems:'center'}}>
                    <div>
                      <div style={{fontWeight:800,color:'var(--forest)',marginBottom:4}}>{request.campaign_title}</div>
                      <div style={{fontSize:12,color:'var(--text2)'}}>{request.actor_name} requested deletion review · {new Date(request.created_at).toLocaleString('en-PH', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}</div>
                      <div style={{fontSize:12,color:'var(--text3)',marginTop:4}}>{request.actor_email}</div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',justifyContent:'flex-end'}}>
                      <span className={`badge ${pending ? 'badge-gold' : status === 'approved' ? 'badge-emerald' : 'badge-navy'}`}>{status}</span>
                      {pending && (
                        <>
                          <button type="button" className="btn btn-sm btn-emerald" onClick={()=>reviewDeleteRequest(request.id, "approve")}>Approve</button>
                          <button type="button" className="btn btn-sm btn-outline" onClick={()=>reviewDeleteRequest(request.id, "reject")}>Reject</button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{padding:18,border:'1px dashed var(--border)',borderRadius:10,color:'var(--text2)',fontSize:13}}>
              No campaign deletion requests are waiting for admin review.
            </div>
          )}
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
