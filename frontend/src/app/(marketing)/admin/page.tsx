"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  AlertCircle, ArrowLeft, CheckCircle2, AlertTriangle, Eye, EyeOff, Lock, Network,
  ShieldCheck, Search, Link2, XCircle, History, Banknote, FileCheck, Building2,
  TrendingUp, RefreshCw,
} from "lucide-react";
import { CAMPAIGNS } from "@/lib/campaigns";
import { authApi, campaignsApi, type CampaignChangeLogApi, type AdminStatsApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function AdminPage() {
  const { user, isAuthenticated, setAuth } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [campaignChanges, setCampaignChanges] = useState<CampaignChangeLogApi[]>([]);
  const [deleteRequests, setDeleteRequests] = useState<CampaignChangeLogApi[]>([]);
  const [releaseRequests, setReleaseRequests] = useState<CampaignChangeLogApi[]>([]);
  const [stats, setStats] = useState<AdminStatsApi | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [reviewModal, setReviewModal] = useState<CampaignChangeLogApi | null>(null);
  const isAdmin = isAuthenticated && user?.role === "admin";

  function formatPeso(n: number) {
    if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `₱${(n / 1_000).toFixed(1)}K`;
    return `₱${Math.round(n).toLocaleString()}`;
  }

  async function loadAll() {
    setStatsLoading(true);
    try {
      const [changes, deletes, releases, statsRes] = await Promise.allSettled([
        campaignsApi.changeLog(50),
        campaignsApi.deleteRequests(50),
        campaignsApi.releaseRequests(50),
        campaignsApi.adminStats(),
      ]);
      setCampaignChanges(changes.status === "fulfilled" ? changes.value.data.data : []);
      setDeleteRequests(deletes.status === "fulfilled" ? deletes.value.data.data : []);
      setReleaseRequests(releases.status === "fulfilled" ? releases.value.data.data : []);
      setStats(statsRes.status === "fulfilled" ? statsRes.value.data.data : null);
    } finally {
      setStatsLoading(false);
    }
  }

  useEffect(() => {
    if (!isAdmin) return;
    loadAll();
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

  async function reviewReleaseRequest(requestId: string, action: "approve" | "reject") {
    try {
      const res =
        action === "approve"
          ? await campaignsApi.approveReleaseRequest(requestId)
          : await campaignsApi.rejectReleaseRequest(requestId);
      setReleaseRequests((items) => items.map((item) => (item.id === requestId ? res.data.data : item)));
      toast.success(action === "approve" ? "Fund release approved. Organizer must now upload proof." : "Fund release rejected.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to review release request.");
    }
  }

  async function handleVerifyProof(requestId: string) {
    try {
      const res = await campaignsApi.verifyReleaseProof(requestId);
      setReleaseRequests((items) => items.map((item) => (item.id === requestId ? res.data.data : item)));
      toast.success("Handoff proof verified. Donations marked as disbursed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to verify proof.");
    }
  }

  async function handleImageReview(changeId: string, action: "approve" | "reject") {
    try {
      const res =
        action === "approve"
          ? await campaignsApi.approveImageChange(changeId)
          : await campaignsApi.rejectImageChange(changeId);
      setCampaignChanges((items) => items.map((item) => (item.id === changeId ? res.data.data : item)));
      toast.success(action === "approve" ? "Cover image approved and applied." : "Cover image change rejected.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to review image change.");
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
          <h1 style={{fontSize:36,fontWeight:800,color:'#fff',marginBottom:8}}>Admin Oversight Dashboard</h1>
          <p style={{color:'rgba(255,255,255,.65)',fontSize:16,marginBottom:0}}>Platform monitoring, fraud detection, and audit logs. All actions permanently recorded on-chain.</p>
        </div>
      </div>

      <div className="page-inner">
        {/* ── Dynamic stat cards ── */}
        <div className="admin-grid mb-28">
          <div className="admin-card" style={{borderLeft:'4px solid var(--canopy)'}}>
            <div style={{fontSize:11,color:'var(--text3)',marginBottom:8,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              TOTAL CAMPAIGNS
              <TrendingUp size={14} color="var(--canopy)" strokeWidth={1.8}/>
            </div>
            <div style={{fontFamily:'Sora,sans-serif',fontSize:30,fontWeight:800,color:'var(--forest)'}}>
              {stats ? stats.total_campaigns.toLocaleString() : '—'}
            </div>
            <div style={{fontSize:12,color:'var(--text3)'}}>
              {stats ? `${stats.donor_count} verified donors` : 'Loading...'}
            </div>
          </div>
          <div className="admin-card" style={{borderLeft:'4px solid var(--forest-mid)'}}>
            <div style={{fontSize:11,color:'var(--text3)',marginBottom:8,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              VERIFIED INSTITUTIONS
              <Building2 size={14} color="var(--forest-mid)" strokeWidth={1.8}/>
            </div>
            <div style={{fontFamily:'Sora,sans-serif',fontSize:30,fontWeight:800,color:'var(--forest)'}}>
              {stats ? stats.verified_institutions.toLocaleString() : '—'}
            </div>
            <div style={{fontSize:12,color:'var(--text3)'}}>Hospitals, pharmacies, schools, NGOs</div>
          </div>
          <div className="admin-card" style={{borderLeft:'4px solid var(--amber)'}}>
            <div style={{fontSize:11,color:'var(--text3)',marginBottom:8,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              FUNDS ESCROWED
              <Banknote size={14} color="var(--amber)" strokeWidth={1.8}/>
            </div>
            <div style={{fontFamily:'Sora,sans-serif',fontSize:30,fontWeight:800,color:'var(--forest)'}}>
              {stats ? formatPeso(stats.funds_escrowed_php) : '—'}
            </div>
            <div style={{fontSize:12,color:'var(--text3)'}}>Across all confirmed donations</div>
          </div>
          <div className="admin-card" style={{borderLeft:'4px solid var(--canopy)'}}>
            <div style={{fontSize:11,color:'var(--text3)',marginBottom:8,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              FUNDS RELEASED
              <CheckCircle2 size={14} color="var(--canopy)" strokeWidth={1.8}/>
            </div>
            <div style={{fontFamily:'Sora,sans-serif',fontSize:30,fontWeight:800,color:'var(--forest)'}}>
              {stats ? formatPeso(stats.released_php) : '—'}
            </div>
            <div style={{fontSize:12,color:'var(--text3)'}}>Verified handoff releases</div>
          </div>
        </div>

        {/* ── Pending actions summary ── */}
        {stats && (stats.pending_edits + stats.pending_deletes + stats.pending_releases) > 0 && (
          <div style={{background:'rgba(200,134,10,.07)',border:'1px solid rgba(200,134,10,.22)',borderRadius:'var(--r)',padding:'14px 18px',marginBottom:24,display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
            <AlertTriangle size={16} color="var(--amber)" strokeWidth={1.8}/>
            <span style={{fontSize:13,fontWeight:700,color:'var(--forest)'}}>Pending reviews:</span>
            {stats.pending_edits > 0 && <span className="badge badge-gold">{stats.pending_edits} image {stats.pending_edits === 1 ? 'change' : 'changes'}</span>}
            {stats.pending_deletes > 0 && <span className="badge badge-red">{stats.pending_deletes} deletion {stats.pending_deletes === 1 ? 'request' : 'requests'}</span>}
            {stats.pending_releases > 0 && <span className="badge badge-gold">{stats.pending_releases} fund release {stats.pending_releases === 1 ? 'request' : 'requests'}</span>}
            <button type="button" className="btn btn-sm btn-outline" style={{marginLeft:'auto'}} onClick={loadAll} disabled={statsLoading}>
              <RefreshCw size={12}/> {statsLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        )}

        {/* ── Campaign Edit Review ── */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:24,marginBottom:24}}>
          <div className="flex flex-center flex-between mb-20" style={{gap:16,flexWrap:'wrap'}}>
            <h3 style={{fontSize:18,fontWeight:700,color:'var(--forest)',display:'flex',alignItems:'center',gap:8}}>
              <History size={18} color="var(--canopy)" strokeWidth={1.8}/> Campaign Edit Review
            </h3>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              {stats && stats.pending_edits > 0 && (
                <span className="badge badge-gold">{stats.pending_edits} pending image {stats.pending_edits === 1 ? 'review' : 'reviews'}</span>
              )}
              <span className="badge badge-navy">{campaignChanges.length} total</span>
            </div>
          </div>

          {campaignChanges.length > 0 ? (
            <div style={{display:'grid',gap:8}}>
              {campaignChanges.map((change) => {
                const imgChange = change.changes?.image_src;
                const hasPendingImage = imgChange?.pending === true;
                const imgApproved = imgChange?.approved === true;
                const imgRejected = imgChange?.approved === false && imgChange?.rejected_at;
                const nonImageFields = change.changed_fields.filter(f => f !== 'image_src' && f !== 'delete_request' && f !== 'release_request');

                return (
                  <div
                    key={change.id}
                    onClick={() => setReviewModal(change)}
                    style={{
                      display:'grid',
                      gridTemplateColumns:'1fr auto',
                      gap:12,
                      alignItems:'center',
                      padding:'12px 16px',
                      border:`1px solid ${hasPendingImage ? 'rgba(200,134,10,.35)' : 'var(--border)'}`,
                      borderRadius:10,
                      background: hasPendingImage ? 'rgba(200,134,10,.04)' : 'var(--surface)',
                      cursor:'pointer',
                      transition:'border-color .15s,background .15s',
                    }}
                    onMouseEnter={e=>(e.currentTarget.style.borderColor = hasPendingImage ? 'rgba(200,134,10,.6)' : 'rgba(74,155,106,.4)')}
                    onMouseLeave={e=>(e.currentTarget.style.borderColor = hasPendingImage ? 'rgba(200,134,10,.35)' : 'var(--border)')}
                  >
                    <div style={{minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3,flexWrap:'wrap'}}>
                        <span style={{fontWeight:800,color:'var(--forest)',fontSize:14}}>{change.campaign_title}</span>
                        {hasPendingImage && <span className="badge badge-gold" style={{fontSize:10}}>⏳ Image needs review</span>}
                        {imgApproved && <span className="badge badge-emerald" style={{fontSize:10}}>✓ Image approved</span>}
                        {imgRejected && <span className="badge badge-navy" style={{fontSize:10}}>✗ Image rejected</span>}
                      </div>
                      <div style={{fontSize:12,color:'var(--text2)'}}>
                        {change.actor_name} · {change.actor_email}
                        <span style={{color:'var(--text3)',marginLeft:8,fontFamily:'Space Mono,monospace',fontSize:11}}>
                          {new Date(change.created_at).toLocaleString('en-PH',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
                        </span>
                      </div>
                      {nonImageFields.length > 0 && (
                        <div style={{display:'flex',gap:5,flexWrap:'wrap',marginTop:6}}>
                          {nonImageFields.map(f => (
                            <span key={f} className="badge badge-navy" style={{fontSize:10}}>{f.replace(/_/g,' ')}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
                      <span style={{fontSize:12,color:'var(--canopy)',fontWeight:700}}>Review →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{padding:32,textAlign:'center',border:'1px dashed var(--border)',borderRadius:10,color:'var(--text3)',fontSize:13}}>
              No organizer campaign edits recorded yet.
            </div>
          )}
        </div>

        {/* ── Review Modal ── */}
        {reviewModal && (() => {
          const imgChange = reviewModal.changes?.image_src;
          const hasPendingImage = imgChange?.pending === true;
          const imgApproved = imgChange?.approved === true;
          const imgRejected = imgChange?.approved === false && imgChange?.rejected_at;
          const pendingDataUrl: string | undefined = imgChange?.pending_image_src;
          const fieldChanges = Object.entries(reviewModal.changes || {}).filter(
            ([k]) => k !== 'image_src' && k !== 'delete_request' && k !== 'release_request'
          );

          return (
            <div
              style={{position:'fixed',inset:0,zIndex:300,background:'rgba(10,18,14,.55)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',padding:24}}
              onClick={() => setReviewModal(null)}
            >
              <div
                style={{width:'min(100%,620px)',maxHeight:'90vh',overflowY:'auto',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,boxShadow:'0 32px 80px rgba(10,18,14,.28)',display:'grid',gap:0}}
                onClick={e => e.stopPropagation()}
              >
                {/* Modal header */}
                <div style={{padding:'20px 24px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12}}>
                  <div>
                    <div style={{fontSize:11,fontWeight:800,color:'var(--canopy)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:4}}>Campaign Edit Review</div>
                    <div style={{fontSize:18,fontWeight:800,color:'var(--forest)',lineHeight:1.2}}>{reviewModal.campaign_title}</div>
                    <div style={{fontSize:12,color:'var(--text2)',marginTop:4}}>
                      {reviewModal.actor_name} · {reviewModal.actor_email} ·{' '}
                      <span style={{fontFamily:'Space Mono,monospace',fontSize:11}}>
                        {new Date(reviewModal.created_at).toLocaleString('en-PH',{month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReviewModal(null)}
                    style={{width:32,height:32,borderRadius:999,border:'1px solid var(--border)',background:'transparent',color:'var(--text3)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}
                  >
                    <XCircle size={16}/>
                  </button>
                </div>

                <div style={{padding:'20px 24px',display:'grid',gap:16}}>
                  {/* Summary */}
                  <div style={{fontSize:13,color:'var(--text2)',background:'rgba(26,58,42,.04)',border:'1px solid rgba(26,58,42,.08)',borderRadius:8,padding:'10px 14px'}}>
                    {reviewModal.summary}
                  </div>

                  {/* Field-by-field diff */}
                  {fieldChanges.length > 0 && (
                    <div>
                      <div style={{fontSize:11,fontWeight:800,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10}}>Changes</div>
                      <div style={{display:'grid',gap:8}}>
                        {fieldChanges.map(([field, diff]: [string, any]) => (
                          <div key={field} style={{borderRadius:10,border:'1px solid var(--border)',overflow:'hidden'}}>
                            <div style={{padding:'6px 12px',background:'rgba(26,58,42,.04)',fontSize:11,fontWeight:800,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.08em'}}>
                              {field.replace(/_/g,' ')}
                            </div>
                            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr'}}>
                              <div style={{padding:'10px 12px',borderRight:'1px solid var(--border)',background:'rgba(185,28,28,.03)'}}>
                                <div style={{fontSize:10,fontWeight:800,color:'#991B1B',marginBottom:4}}>BEFORE</div>
                                <div style={{fontSize:13,color:'#991B1B',wordBreak:'break-word',lineHeight:1.5}}>{String(diff?.before ?? '—')}</div>
                              </div>
                              <div style={{padding:'10px 12px',background:'rgba(74,155,106,.03)'}}>
                                <div style={{fontSize:10,fontWeight:800,color:'var(--canopy)',marginBottom:4}}>AFTER</div>
                                <div style={{fontSize:13,color:'var(--forest)',fontWeight:600,wordBreak:'break-word',lineHeight:1.5}}>{String(diff?.after ?? '—')}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Image review */}
                  {(hasPendingImage || imgApproved || imgRejected) && (
                    <div>
                      <div style={{fontSize:11,fontWeight:800,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10}}>Cover Image</div>
                      {hasPendingImage && pendingDataUrl ? (
                        <div style={{border:'1px solid rgba(200,134,10,.3)',borderRadius:12,overflow:'hidden',background:'rgba(200,134,10,.03)'}}>
                          <img
                            src={pendingDataUrl}
                            alt="Proposed cover"
                            style={{width:'100%',maxHeight:260,objectFit:'cover',display:'block'}}
                          />
                          <div style={{padding:'14px 16px'}}>
                            <div style={{fontSize:13,color:'var(--text2)',marginBottom:12}}>
                              The organizer uploaded a new cover photo. Approve to make it live on the campaign card, or reject to keep the current image.
                            </div>
                            <div style={{display:'flex',gap:10}}>
                              <button
                                type="button"
                                className="btn btn-emerald"
                                style={{flex:1,justifyContent:'center'}}
                                onClick={async () => {
                                  await handleImageReview(reviewModal.id, 'approve');
                                  setReviewModal(null);
                                  loadAll();
                                }}
                              >
                                <CheckCircle2 size={15}/> Approve Image
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline"
                                style={{flex:1,justifyContent:'center',color:'#991B1B',borderColor:'rgba(220,38,38,.3)'}}
                                onClick={async () => {
                                  await handleImageReview(reviewModal.id, 'reject');
                                  setReviewModal(null);
                                  loadAll();
                                }}
                              >
                                <XCircle size={15}/> Reject Image
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : imgApproved ? (
                        <div style={{display:'flex',alignItems:'center',gap:8,padding:'12px 14px',background:'rgba(74,155,106,.07)',border:'1px solid rgba(74,155,106,.2)',borderRadius:10,fontSize:13,color:'var(--canopy)',fontWeight:700}}>
                          <CheckCircle2 size={15}/> Cover image was approved and is now live.
                        </div>
                      ) : (
                        <div style={{display:'flex',alignItems:'center',gap:8,padding:'12px 14px',background:'rgba(185,28,28,.05)',border:'1px solid rgba(185,28,28,.15)',borderRadius:10,fontSize:13,color:'#991B1B',fontWeight:700}}>
                          <XCircle size={15}/> Cover image change was rejected — original kept.
                        </div>
                      )}
                    </div>
                  )}

                  {/* No actions needed */}
                  {!hasPendingImage && fieldChanges.length === 0 && !imgApproved && !imgRejected && (
                    <div style={{fontSize:13,color:'var(--text3)',textAlign:'center',padding:'8px 0'}}>
                      This change has no pending actions.
                    </div>
                  )}
                </div>

                {/* Modal footer */}
                <div style={{padding:'14px 24px',borderTop:'1px solid var(--border)',display:'flex',justifyContent:'flex-end'}}>
                  <button type="button" className="btn btn-outline" onClick={() => setReviewModal(null)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

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

        {/* ── Fund Release Requests ── */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:24,marginBottom:24}}>
          <div className="flex flex-center flex-between mb-20" style={{gap:16,flexWrap:'wrap'}}>
            <h3 style={{fontSize:18,fontWeight:700,color:'var(--forest)',display:'flex',alignItems:'center',gap:8}}>
              <Banknote size={18} color="var(--canopy)" strokeWidth={1.8}/> Fund Release Requests
            </h3>
            <span className="badge badge-gold">
              {releaseRequests.filter((r)=>r.changes?.release_request?.status==='pending').length} pending
            </span>
          </div>

          {releaseRequests.length > 0 ? (
            <div style={{display:'grid',gap:10}}>
              {releaseRequests.map((req)=>{
                const rr = req.changes?.release_request ?? {};
                const rrStatus: string = rr.status ?? 'pending';
                const isPending = rrStatus === 'pending';
                const isApproved = rrStatus === 'approved' || rrStatus === 'proof_uploaded';
                const isClosed = rrStatus === 'closed';
                const badgeClass = isPending ? 'badge-gold' : isApproved ? 'badge-emerald' : isClosed ? 'badge-navy' : 'badge-red';

                return (
                  <div key={req.id} style={{border:'1px solid var(--border)',borderRadius:12,padding:16,display:'grid',gap:12}}>
                    {/* Header row */}
                    <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:12,alignItems:'start'}}>
                      <div>
                        <div style={{fontWeight:800,color:'var(--forest)',marginBottom:4,fontSize:15}}>{req.campaign_title}</div>
                        <div style={{fontSize:12,color:'var(--text2)'}}>
                          Requested by <strong>{req.actor_name}</strong> · {new Date(req.created_at).toLocaleString('en-PH',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
                        </div>
                      </div>
                      <span className={`badge ${badgeClass}`} style={{whiteSpace:'nowrap'}}>
                        {rrStatus.replace('_',' ')}
                      </span>
                    </div>

                    {/* Release details */}
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:8}}>
                      {rr.recipient_name && (
                        <div style={{background:'rgba(74,155,106,.06)',border:'1px solid rgba(74,155,106,.15)',borderRadius:8,padding:'8px 10px'}}>
                          <div style={{fontSize:10,fontWeight:800,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:3}}>Recipient</div>
                          <div style={{fontSize:13,fontWeight:700,color:'var(--forest)'}}>{rr.recipient_name}</div>
                          {rr.recipient_type && <div style={{fontSize:11,color:'var(--text3)'}}>{rr.recipient_type}</div>}
                        </div>
                      )}
                      {rr.amount_xlm && (
                        <div style={{background:'rgba(200,134,10,.06)',border:'1px solid rgba(200,134,10,.15)',borderRadius:8,padding:'8px 10px'}}>
                          <div style={{fontSize:10,fontWeight:800,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:3}}>Amount</div>
                          <div style={{fontSize:13,fontWeight:700,color:'var(--forest)'}}>{rr.amount_xlm} XLM</div>
                        </div>
                      )}
                      {rr.note && (
                        <div style={{background:'rgba(26,58,42,.04)',border:'1px solid rgba(26,58,42,.08)',borderRadius:8,padding:'8px 10px',gridColumn:'1 / -1'}}>
                          <div style={{fontSize:10,fontWeight:800,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:3}}>Note</div>
                          <div style={{fontSize:12,color:'var(--text2)'}}>{rr.note}</div>
                        </div>
                      )}
                    </div>

                    {/* Flow steps */}
                    <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',fontSize:11,fontWeight:700}}>
                      {[
                        {label:'1. Request sent',done:true},
                        {label:'2. Admin approves',done:isApproved||isClosed},
                        {label:'3. Organizer uploads proof',done:rrStatus==='proof_uploaded'||isClosed},
                        {label:'4. Admin verifies & closes',done:isClosed},
                      ].map((step,i)=>(
                        <span key={i} style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 8px',borderRadius:999,
                          background: step.done ? 'rgba(74,155,106,.1)' : 'rgba(26,58,42,.04)',
                          border: `1px solid ${step.done ? 'rgba(74,155,106,.25)' : 'rgba(26,58,42,.08)'}`,
                          color: step.done ? 'var(--forest-light)' : 'var(--text3)'}}>
                          {step.done ? <CheckCircle2 size={10}/> : <span style={{width:10,height:10,borderRadius:'50%',border:'1.5px solid currentColor',display:'inline-block'}}/>}
                          {step.label}
                        </span>
                      ))}
                    </div>

                    {/* Action buttons */}
                    {(isPending || isApproved) && (
                      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                        {isPending && (
                          <>
                            <button type="button" className="btn btn-sm btn-emerald" onClick={()=>reviewReleaseRequest(req.id,'approve')}>
                              <CheckCircle2 size={13}/> Approve Release
                            </button>
                            <button type="button" className="btn btn-sm btn-outline" onClick={()=>reviewReleaseRequest(req.id,'reject')}>
                              <XCircle size={13}/> Reject
                            </button>
                          </>
                        )}
                        {isApproved && (
                          <button type="button" className="btn btn-sm btn-emerald" onClick={()=>handleVerifyProof(req.id)}>
                            <FileCheck size={13}/> Verify Handoff Proof &amp; Close
                          </button>
                        )}
                      </div>
                    )}
                    {isClosed && (
                      <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'var(--canopy)',fontWeight:700}}>
                        <CheckCircle2 size={13}/> Release closed — donations marked as disbursed.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{padding:18,border:'1px dashed var(--border)',borderRadius:10,color:'var(--text2)',fontSize:13}}>
              No fund release requests yet. Organizers can request a release from their campaign edit page.
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
          <div style={{marginTop:20,padding:16,background:'rgba(74,155,106,.04)',border:'1px solid rgba(74,155,106,.15)',borderRadius:10,display:'flex',gap:10,alignItems:'flex-start'}}>
            <ShieldCheck size={18} color="var(--canopy)" strokeWidth={1.8} style={{flexShrink:0,marginTop:1}}/>
            <div style={{fontSize:13,color:'var(--forest)',lineHeight:1.6}}><strong>All admin actions are permanently recorded on-chain.</strong> Administrative decisions are executed via Soroban smart contracts and cannot be unilaterally reversed. Community consensus is required for all clawback and fraud resolution events.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
