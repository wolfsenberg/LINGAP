import TopNav from "@/components/layout/TopNav";
import MobileNav from "@/components/layout/MobileNav";
import Link from "next/link";
import {
  Lock, CheckCircle2, Target, Hospital, Pill, School, Handshake, Anchor, Link2,
  ShieldCheck, FileCheck, Shield, Bot, Award, MapPin, Users, TrendingUp,
  Facebook, MessageCircle, Music2, Twitter
} from "lucide-react";

export default function HomePage() {
  return (
    <>
      <TopNav />
      <MobileNav />

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg-orb hero-orb1"/>
        <div className="hero-bg-orb hero-orb2"/>
        <div className="hero-bg-orb hero-orb3"/>
        <div className="hero-inner">
          <div>
            <div className="hero-badge">
              <span className="hero-badge-text">Philippines&apos; First Verified Donation Platform</span>
            </div>
            <h1 className="hero-title">Every Donation<br/><em>Proven.</em><br/>Every Peso<br/><em>Protected.</em></h1>
            <p className="hero-sub">LINGAP ensures your generosity reaches verified institutions — not black holes. Blockchain-secured escrow, milestone-based giving, zero middleman fraud.</p>
            <div className="hero-cta">
              <Link href="/discover" className="btn btn-gold btn-lg">Donate Transparently</Link>
              <Link href="/start-campaign" className="btn btn-outline btn-lg" style={{color:'#fff',borderColor:'rgba(255,255,255,.3)'}}>Start Verified Campaign</Link>
            </div>
            <div className="hero-stats">
              <div className="hero-stat"><div className="hero-stat-val">₱48.2M</div><div className="hero-stat-label">Donations Tracked</div></div>
              <div className="hero-stat"><div className="hero-stat-val">2,847</div><div className="hero-stat-label">Verified Beneficiaries</div></div>
              <div className="hero-stat"><div className="hero-stat-val">₱3.1M</div><div className="hero-stat-label">Fraud Prevented</div></div>
            </div>
            </div>
            <div className="hero-right">
              <div className="hero-mascot-wrap" style={{position:'relative'}}>
              <img className="hero-visual-img" src="/images/laptop.png" alt="" />
              <div className="hero-float-card" style={{top:-10,right:-30}}>
                <div className="hfc-icon"><Lock size={18}/></div>
                <div className="hfc-val">Escrow Protected</div>
                <div className="hfc-label">Smart contract secured</div>
              </div>
              <div className="hero-float-card" style={{bottom:80,left:-40}}>
                <div className="hfc-icon"><CheckCircle2 size={18}/></div>
                <div className="hfc-val">Blockchain Verified</div>
                <div className="hfc-label">Immutable record</div>
              </div>
              <div className="hero-float-card" style={{bottom:0,right:-20}}>
                <div className="hfc-icon"><Target size={18}/></div>
                <div className="hfc-val">₱5,000 Released</div>
                <div className="hfc-label">Milestone 2 Complete</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <div style={{background:'var(--surface2)',borderBottom:'1px solid var(--border)',padding:'20px 40px'}}>
        <div className="container flex flex-center gap-24" style={{flexWrap:'wrap',justifyContent:'center'}}>
          <div className="flex flex-center gap-8"><Hospital size={16} color="var(--canopy)"/><span className="small muted">Accredited Hospitals</span></div>
          <div style={{color:'var(--border2)'}}>|</div>
          <div className="flex flex-center gap-8"><Pill size={16} color="var(--canopy)"/><span className="small muted">Verified Pharmacies</span></div>
          <div style={{color:'var(--border2)'}}>|</div>
          <div className="flex flex-center gap-8"><School size={16} color="var(--canopy)"/><span className="small muted">Registered Schools</span></div>
          <div style={{color:'var(--border2)'}}>|</div>
          <div className="flex flex-center gap-8"><Handshake size={16} color="var(--canopy)"/><span className="small muted">Accredited NGOs</span></div>
          <div style={{color:'var(--border2)'}}>|</div>
          <div className="flex flex-center gap-8"><Anchor size={16} color="var(--canopy)"/><span className="small muted">Typhoon Relief Partners</span></div>
          <div style={{color:'var(--border2)'}}>|</div>
          <div className="flex flex-center gap-8"><Link2 size={16} color="var(--canopy)"/><span className="small muted">Stellar Blockchain</span></div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="section" style={{background:'#fff'}}>
        <div className="container">
          <div className="text-center mb-32">
            <div className="section-label">HOW LINGAP WORKS</div>
            <h2 className="section-title" style={{maxWidth:600,margin:'0 auto 14px'}}>Your money goes directly to<br/>verified institutions</h2>
            <p className="section-sub" style={{margin:'0 auto'}}>No middlemen. No black boxes. Just transparent, milestone-driven giving secured by blockchain.</p>
          </div>
          <div className="process-grid">
            <div className="process-line"/>
            {[
              {bg:'var(--forest)',border:'var(--canopy)',Icon:TrendingUp,title:'Donor Gives',desc:"Your donation enters a Soroban smart contract escrow — never the organizer's wallet."},
              {bg:'var(--forest-mid)',border:'var(--canopy)',Icon:Lock,title:'Escrow Locks',desc:'Funds are milestone-locked. Zero access until verified progress is confirmed.'},
              {bg:'var(--forest-light)',border:'var(--canopy)',Icon:CheckCircle2,title:'Verified Progress',desc:'Receipts, documents, and photos are uploaded and verified by community + AI.'},
              {bg:'var(--forest)',border:'var(--canopy)',Icon:Hospital,title:'Institution Paid',desc:'Funds release directly to the hospital, pharmacy, or school. Never the organizer.'},
            ].map((s)=>(
              <div key={s.title} className="process-step">
                <div className="process-icon" style={{background:s.bg,border:`4px solid ${s.border}`}}>
                  <s.Icon size={32} color="#fff" strokeWidth={1.8}/>
                </div>
                <div>
                  <h4 style={{fontSize:16,fontWeight:700,color:'var(--forest)',marginBottom:8}}>{s.title}</h4>
                  <p style={{fontSize:13,color:'var(--text2)',lineHeight:1.5}}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section">
        <div className="container">
          <div className="text-center mb-32">
            <div className="section-label">CORE FEATURES</div>
            <h2 className="section-title">Built on trust.<br/>Powered by blockchain.</h2>
          </div>
          <div className="features-grid">
            {[
              {iconCls:'fi-navy',Icon:Lock,title:'Milestone-Based Escrow',desc:'Donations are locked in Soroban smart contracts and only released when verified milestones are achieved. Funds never enter organizer wallets.',badge:'badge-navy',badgeText:'On-chain Secured'},
              {iconCls:'fi-emerald',Icon:FileCheck,title:'Proof of Reality',desc:'Every peso is backed by real receipts, medical documents, construction photos, and institution confirmations. No proof = no release.',badge:'badge-emerald',badgeText:'Document Verified'},
              {iconCls:'fi-gold',Icon:Shield,title:'Donor Protection & Clawback',desc:'Donors vote to pause suspicious campaigns and can reclaim unspent funds if fraud is proven. Your money, your control.',badge:'badge-gold',badgeText:'Community Power'},
              {iconCls:'fi-navy',Icon:Bot,title:'AI Risk Detection',desc:'Machine learning scans campaigns 24/7 for duplicate patterns, suspicious spending, fake accounts, and delayed milestones.',badge:'badge-blue',badgeText:'AI-Powered'},
              {iconCls:'fi-emerald',Icon:Award,title:'Impact Certificates',desc:'Every donor receives a blockchain-verified impact certificate with transaction hash, Stellar reference, and QR-verifiable proof.',badge:'badge-emerald',badgeText:'Share-worthy'},
              {iconCls:'fi-gold',Icon:MapPin,title:'Near Me Campaigns',desc:'GPS-powered campaign discovery shows verified causes in your area. Help your neighbors, barangay, and community first.',badge:'badge-gold',badgeText:'Location-Aware'},
            ].map((f)=>(
              <div key={f.title} className="feature-card">
                <div className={`feature-icon ${f.iconCls}`}><f.Icon size={22} strokeWidth={1.8}/></div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
                <div className="mt-16"><span className={`badge ${f.badge}`}>{f.badgeText}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MASCOT SECTION */}
      <section className="section" style={{background:'var(--forest)',overflow:'hidden',position:'relative'}}>
        <div style={{position:'absolute',right:-60,top:-60,width:400,height:400,background:'radial-gradient(circle,rgba(74,155,106,.15),transparent 70%)',pointerEvents:'none'}}/>
        <div className="container">
          <div className="grid-2" style={{alignItems:'center',gap:80}}>
            <div>
              <div style={{fontSize:12,fontWeight:700,letterSpacing:2,color:'var(--canopy)',marginBottom:16}}>WHY DONORS LOVE LINGAP</div>
              <h2 style={{fontSize:40,fontWeight:800,color:'#fff',lineHeight:1.15,marginBottom:24}}>Every peso remembered,<br/>every peso protected.</h2>
              <p style={{fontSize:17,color:'rgba(255,255,255,.7)',lineHeight:1.65,marginBottom:32}}>LINGAP never forgets a single transaction. Every peso donated is permanently recorded on the Stellar blockchain — immutable, publicly verifiable, and forever traceable.</p>
              <div style={{display:'flex',flexDirection:'column',gap:16}}>
                {[
                  {bg:'rgba(74,155,106,.15)',border:'rgba(74,155,106,.3)',Icon:Link2,title:'Never forgets a transaction',sub:'Permanent on-chain donation trail'},
                  {bg:'rgba(200,134,10,.1)',border:'rgba(200,134,10,.25)',Icon:ShieldCheck,title:'Shields your donation',sub:'Smart contract escrow protection'},
                  {bg:'rgba(61,122,82,.15)',border:'rgba(61,122,82,.3)',Icon:Target,title:'Celebrates every milestone',sub:'Real-time progress you can see'},
                ].map((item)=>(
                  <div key={item.title} className="flex flex-center gap-16">
                    <div style={{width:48,height:48,background:item.bg,border:`1px solid ${item.border}`,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <item.Icon size={20} color="var(--canopy-light)" strokeWidth={1.8}/>
                    </div>
                    <div>
                      <div style={{fontWeight:600,color:'#fff',fontSize:15}}>{item.title}</div>
                      <div style={{fontSize:13,color:'rgba(255,255,255,.55)',marginTop:3}}>{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-center">
              <img className="thankyou-img" src="/images/thankyou.png" alt="" />
              <div style={{fontFamily:'Sora,sans-serif',fontSize:20,fontWeight:700,color:'#fff',marginTop:16}}>Salamat, mahal na donor!</div>
              <div style={{fontSize:14,color:'rgba(255,255,255,.55)',marginTop:6}}>Thank you. Your giving changes lives.</div>
            </div>
          </div>
        </div>
      </section>

      {/* TRENDING CAMPAIGNS */}
      <section className="section">
        <div className="container">
          <div className="flex flex-center flex-between mb-32">
            <div>
              <div className="section-label">FEATURED CAMPAIGNS</div>
              <h2 className="section-title" style={{marginBottom:0}}>Help someone today</h2>
            </div>
            <Link href="/discover" className="btn btn-outline">See All Campaigns →</Link>
          </div>
          <div className="campaign-grid">
            <div className="camp-card emerald-glow featured-camp featured-medical">
              <div className="camp-img">
                <div className="camp-img-inner"><Hospital size={48} strokeWidth={1.8}/></div>
                <div style={{position:'absolute',top:12,left:12}}><span className="badge badge-red">URGENT</span></div>
                <div style={{position:'absolute',top:12,right:12}}><span className="badge badge-emerald">Verified</span></div>
              </div>
              <div className="camp-body">
                <h3 className="camp-title">Maria Santos — Stage 3 Ovarian Cancer Treatment</h3>
                <p className="camp-desc">37-year-old mother of three from Quezon City. Diagnosed last March, currently undergoing chemo at Philippine General Hospital.</p>
                <div className="camp-meta">
                  <div><div className="camp-raised">₱182,400</div><div className="camp-goal">of ₱250,000 goal</div></div>
                  <div className="camp-donors"><Users size={12}/> 342 donors</div>
                </div>
                <div className="prog-track" style={{height:8}}><div className="prog-fill prog-emerald" style={{width:'73%'}}/></div>
                <div className="camp-footer">
                  <span className="badge badge-navy">PGH Verified</span>
                  <span style={{fontSize:12,color:'var(--canopy)',fontWeight:600}}>73% funded · 12d left</span>
                </div>
              </div>
            </div>
            <div className="camp-card emerald-glow featured-camp featured-relief">
              <div className="camp-img">
                <div className="camp-img-inner"><Anchor size={48} strokeWidth={1.8}/></div>
                <div style={{position:'absolute',top:12,left:12}}><span className="badge badge-orange">Emergency</span></div>
                <div style={{position:'absolute',top:12,right:12}}><span className="badge badge-emerald">Verified</span></div>
              </div>
              <div className="camp-body">
                <h3 className="camp-title">Typhoon Carina Relief — Batangas Coastal Communities</h3>
                <p className="camp-desc">Over 400 families displaced by Typhoon Carina in Batangas. Immediate food, shelter, and medicine needed for survivors.</p>
                <div className="camp-meta">
                  <div><div className="camp-raised">₱890,000</div><div className="camp-goal">of ₱1,200,000 goal</div></div>
                  <div className="camp-donors"><Users size={12}/> 1,203 donors</div>
                </div>
                <div className="prog-track" style={{height:8}}><div className="prog-fill prog-emerald" style={{width:'74%'}}/></div>
                <div className="camp-footer">
                  <span className="badge badge-navy">DSWD Partner</span>
                  <span style={{fontSize:12,color:'var(--canopy)',fontWeight:600}}>74% funded · 5d left</span>
                </div>
              </div>
            </div>
            <div className="camp-card emerald-glow featured-camp featured-education">
              <div className="camp-img">
                <div className="camp-img-inner"><School size={48} strokeWidth={1.8}/></div>
                <div style={{position:'absolute',top:12,right:12}}><span className="badge badge-emerald">Verified</span></div>
              </div>
              <div className="camp-body">
                <h3 className="camp-title">Juan dela Cruz — Scholar from Samar: Engineering Dream</h3>
                <p className="camp-desc">19-year-old from Eastern Samar, top 1 in his barangay, qualified for PUP Manila Engineering but can&apos;t afford tuition and board.</p>
                <div className="camp-meta">
                  <div><div className="camp-raised">₱48,000</div><div className="camp-goal">of ₱65,000 goal</div></div>
                  <div className="camp-donors"><Users size={12}/> 87 donors</div>
                </div>
                <div className="prog-track" style={{height:8}}><div className="prog-fill prog-gold" style={{width:'74%'}}/></div>
                <div className="camp-footer">
                  <span className="badge badge-navy">PUP Verified</span>
                  <span style={{fontSize:12,color:'var(--amber)',fontWeight:600}}>74% funded · 18d left</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section style={{background:'linear-gradient(135deg,var(--forest-light),var(--canopy))',padding:'80px 40px',textAlign:'center'}}>
        <div className="container">
          <div style={{display:'flex',justifyContent:'center',marginBottom:18}}>
            <img className="cta-icon-img" src="/images/donate.png" alt="" />
          </div>
          <h2 style={{fontSize:40,fontWeight:800,color:'#fff',marginBottom:16,lineHeight:1.2}}>Start giving with confidence</h2>
          <p style={{fontSize:18,color:'rgba(255,255,255,.85)',marginBottom:32,maxWidth:500,marginLeft:'auto',marginRight:'auto'}}>Join 15,000+ Filipinos who trust LINGAP to make every peso count.</p>
          <div className="flex gap-16" style={{justifyContent:'center',flexWrap:'wrap'}}>
            <Link href="/discover" className="btn btn-gold btn-lg">Start Donating</Link>
            <Link href="/start-campaign" className="btn btn-lg" style={{background:'rgba(255,255,255,.15)',color:'#fff',border:'1.5px solid rgba(255,255,255,.35)'}}>Create Campaign</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{background:'var(--forest)',padding:'48px 40px 32px',color:'rgba(255,255,255,.6)'}}>
        <div className="container">
          <div className="grid-4 mb-32">
            <div>
              <div style={{fontFamily:'Sora,sans-serif',fontWeight:800,fontSize:22,color:'#fff',letterSpacing:-1,marginBottom:12}}>LIN<span style={{color:'var(--canopy)'}}>GAP</span></div>
              <div style={{fontSize:13,lineHeight:1.7,marginBottom:16}}>Ledger for Integrity, Need-based Giving, Aid Provenance, and Protection.</div>
              <span className="badge badge-emerald"><Link2 size={11}/> Powered by Stellar Blockchain</span>
            </div>
            <div>
              <div style={{fontWeight:600,color:'#fff',marginBottom:16,fontSize:14}}>Platform</div>
              <div style={{display:'flex',flexDirection:'column',gap:8,fontSize:13}}>
                <Link href="/discover" style={{color:'rgba(255,255,255,.6)',textDecoration:'none'}}>Discover Campaigns</Link>
                <Link href="/start-campaign" style={{color:'rgba(255,255,255,.6)',textDecoration:'none'}}>Start a Campaign</Link>
                <Link href="/donor" style={{color:'rgba(255,255,255,.6)',textDecoration:'none'}}>Donor Dashboard</Link>
                <Link href="/certificate" style={{color:'rgba(255,255,255,.6)',textDecoration:'none'}}>Impact Certificates</Link>
              </div>
            </div>
            <div>
              <div style={{fontWeight:600,color:'#fff',marginBottom:16,fontSize:14}}>Trust & Safety</div>
              <div style={{display:'flex',flexDirection:'column',gap:8,fontSize:13}}>
                <Link href="/escrow" style={{color:'rgba(255,255,255,.6)',textDecoration:'none'}}>How Escrow Works</Link>
                <Link href="/proof" style={{color:'rgba(255,255,255,.6)',textDecoration:'none'}}>AI Verification</Link>
                <a href="#" style={{color:'rgba(255,255,255,.6)',textDecoration:'none'}}>Report Fraud</a>
                <a href="#" style={{color:'rgba(255,255,255,.6)',textDecoration:'none'}}>Transparency Report</a>
              </div>
            </div>
            <div>
              <div style={{fontWeight:600,color:'#fff',marginBottom:16,fontSize:14}}>Connect</div>
              <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                {[Facebook, MessageCircle, Music2, Twitter].map((Icon,i)=>(
                  <div key={i} style={{width:36,height:36,background:'rgba(255,255,255,.1)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                    <Icon size={16} color="rgba(255,255,255,.7)" strokeWidth={1.8}/>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{borderTop:'1px solid rgba(255,255,255,.1)',paddingTop:24,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8,fontSize:12}}>
            <div>© 2025 LINGAP. All rights reserved. Built with care for the Filipino people.</div>
            <div style={{fontFamily:'Space Mono,monospace',fontSize:10,color:'rgba(255,255,255,.3)'}}>STELLAR:LINGAP-MAINNET-v1.0.0</div>
          </div>
        </div>
      </footer>
    </>
  );
}
