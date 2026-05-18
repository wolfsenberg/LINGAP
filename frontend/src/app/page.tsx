import TopNav from "@/components/layout/TopNav";
import MobileNav from "@/components/layout/MobileNav";
import Link from "next/link";

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
              <span style={{width:8,height:8,background:'var(--emerald)',borderRadius:'50%',display:'inline-block'}}/>
              <span className="hero-badge-text">🇵🇭 Philippines&apos; First Verified Donation Platform</span>
            </div>
            <h1 className="hero-title">Every Donation<br/><em>Proven.</em><br/>Every Peso<br/><em>Protected.</em></h1>
            <p className="hero-sub">LINGAP ensures your generosity reaches verified institutions — not black holes. Blockchain-secured escrow, milestone-based giving, zero middleman fraud.</p>
            <div className="hero-cta">
              <Link href="/discover" className="btn btn-gold btn-lg">💰 Donate Transparently</Link>
              <button className="btn btn-outline btn-lg" style={{color:'#fff',borderColor:'rgba(255,255,255,.3)'}}>📋 Start Verified Campaign</button>
            </div>
            <div className="hero-stats">
              <div className="hero-stat"><div className="hero-stat-val">₱48.2M</div><div className="hero-stat-label">Donations Tracked</div></div>
              <div className="hero-stat"><div className="hero-stat-val">2,847</div><div className="hero-stat-label">Verified Beneficiaries</div></div>
              <div className="hero-stat"><div className="hero-stat-val">₱3.1M</div><div className="hero-stat-label">Fraud Prevented</div></div>
            </div>
          </div>
          <div className="hero-right">
            <div className="hero-mascot-wrap" style={{position:'relative'}}>
              <svg width="280" height="340" viewBox="0 0 280 340" fill="none" xmlns="http://www.w3.org/2000/svg" style={{filter:'drop-shadow(0 20px 60px rgba(0,0,0,.4))'}}>
                <ellipse cx="140" cy="300" rx="100" ry="30" fill="rgba(16,184,145,0.15)"/>
                <rect x="20" y="80" width="52" height="72" rx="16" fill="#4B5563"/>
                <rect x="28" y="90" width="36" height="54" rx="12" fill="#F4A6B2"/>
                <rect x="208" y="80" width="52" height="72" rx="16" fill="#4B5563"/>
                <rect x="216" y="90" width="36" height="54" rx="12" fill="#F4A6B2"/>
                <rect x="60" y="40" width="160" height="136" rx="40" fill="#9AA3B2"/>
                <rect x="80" y="44" width="120" height="60" rx="30" fill="rgba(255,255,255,0.12)"/>
                <rect x="84" y="92" width="32" height="6" rx="3" fill="#4B5563"/>
                <rect x="164" y="92" width="32" height="6" rx="3" fill="#4B5563"/>
                <rect x="82" y="102" width="36" height="40" rx="18" fill="#1a1a2e"/>
                <rect x="162" y="102" width="36" height="40" rx="18" fill="#1a1a2e"/>
                <rect x="90" y="108" width="10" height="10" rx="5" fill="white"/>
                <rect x="86" y="122" width="5" height="5" rx="2" fill="rgba(255,255,255,0.4)"/>
                <rect x="170" y="108" width="10" height="10" rx="5" fill="white"/>
                <rect x="166" y="122" width="5" height="5" rx="2" fill="rgba(255,255,255,0.4)"/>
                <rect x="68" y="130" width="32" height="18" rx="9" fill="#F4A6B2" fillOpacity="0.5"/>
                <rect x="180" y="130" width="32" height="18" rx="9" fill="#F4A6B2" fillOpacity="0.5"/>
                <rect x="122" y="168" width="36" height="16" rx="8" fill="#8B939F"/>
                <rect x="118" y="180" width="32" height="14" rx="7" fill="#9AA3B2"/>
                <rect x="120" y="190" width="28" height="14" rx="7" fill="#8B939F"/>
                <rect x="124" y="200" width="20" height="12" rx="6" fill="#9AA3B2"/>
                <rect x="56" y="204" width="168" height="96" rx="24" fill="#1E3A8A"/>
                <rect x="70" y="210" width="120" height="40" rx="20" fill="rgba(255,255,255,0.08)"/>
                <rect x="12" y="210" width="50" height="28" rx="14" fill="#9AA3B2" transform="rotate(-20 12 210)"/>
                <rect x="4" y="200" width="28" height="28" rx="14" fill="#9AA3B2"/>
                <rect x="220" y="214" width="50" height="28" rx="14" fill="#9AA3B2"/>
                <rect x="122" y="232" width="36" height="20" rx="5" fill="#FFDD57"/>
                <rect x="120" y="225" width="16" height="16" rx="8" fill="#FFDD57"/>
                <rect x="144" y="225" width="16" height="16" rx="8" fill="#FFDD57"/>
                <rect x="127" y="246" width="26" height="12" rx="6" fill="#FFDD57"/>
                <rect x="131" y="254" width="18" height="10" rx="5" fill="#FFDD57"/>
                <rect x="136" y="260" width="8" height="8" rx="4" fill="#FFDD57"/>
                <rect x="76" y="284" width="48" height="40" rx="16" fill="#9AA3B2"/>
                <rect x="156" y="284" width="48" height="40" rx="16" fill="#9AA3B2"/>
                <rect x="76" y="306" width="48" height="18" rx="10" fill="#8B939F"/>
                <rect x="156" y="306" width="48" height="18" rx="10" fill="#8B939F"/>
              </svg>
              <div className="hero-float-card" style={{top:-10,right:-30}}>
                <div className="hfc-icon">🔒</div>
                <div className="hfc-val">Escrow Protected</div>
                <div className="hfc-label">Smart contract secured</div>
              </div>
              <div className="hero-float-card" style={{bottom:80,left:-40}}>
                <div className="hfc-icon">✅</div>
                <div className="hfc-val">Blockchain Verified</div>
                <div className="hfc-label">Immutable record</div>
              </div>
              <div className="hero-float-card" style={{bottom:0,right:-20}}>
                <div className="hfc-icon">🎯</div>
                <div className="hfc-val">₱5,000 Released</div>
                <div className="hfc-label">Milestone 2 Complete</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <div style={{background:'#fff',borderBottom:'1px solid var(--border)',padding:'20px 40px'}}>
        <div className="container flex flex-center gap-24" style={{flexWrap:'wrap',justifyContent:'center'}}>
          <div className="flex flex-center gap-8"><span style={{fontSize:18}}>🏥</span><span className="small muted">Accredited Hospitals</span></div>
          <div style={{color:'var(--border2)'}}>|</div>
          <div className="flex flex-center gap-8"><span style={{fontSize:18}}>💊</span><span className="small muted">Verified Pharmacies</span></div>
          <div style={{color:'var(--border2)'}}>|</div>
          <div className="flex flex-center gap-8"><span style={{fontSize:18}}>🏫</span><span className="small muted">Registered Schools</span></div>
          <div style={{color:'var(--border2)'}}>|</div>
          <div className="flex flex-center gap-8"><span style={{fontSize:18}}>🤝</span><span className="small muted">Accredited NGOs</span></div>
          <div style={{color:'var(--border2)'}}>|</div>
          <div className="flex flex-center gap-8"><span style={{fontSize:18}}>⛑️</span><span className="small muted">Typhoon Relief Partners</span></div>
          <div style={{color:'var(--border2)'}}>|</div>
          <div className="flex flex-center gap-8"><span style={{fontSize:18}}>🔗</span><span className="small muted">Stellar Blockchain</span></div>
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
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:0,position:'relative'}}>
            <div style={{position:'absolute',top:44,left:'12.5%',right:'12.5%',height:2,background:'linear-gradient(90deg,var(--emerald),var(--navy-light))',zIndex:0}}/>
            {[
              {bg:'var(--navy)',border:'var(--emerald)',icon:'💸',title:'Donor Gives',desc:"Your donation enters a Soroban smart contract escrow — never the organizer's wallet."},
              {bg:'var(--navy-mid)',border:'var(--emerald)',icon:'🔒',title:'Escrow Locks',desc:'Funds are milestone-locked. Zero access until verified progress is confirmed.'},
              {bg:'var(--emerald-dark)',border:'var(--gold)',icon:'✅',title:'Verified Progress',desc:'Receipts, documents, and photos are uploaded and verified by community + AI.'},
              {bg:'var(--gold-darker)',border:'var(--gold)',icon:'🏥',title:'Institution Paid',desc:'Funds release directly to the hospital, pharmacy, or school. Never the organizer.'},
            ].map((s)=>(
              <div key={s.title} style={{textAlign:'center',position:'relative',zIndex:1,padding:'0 16px'}}>
                <div style={{width:88,height:88,borderRadius:'50%',background:s.bg,border:`4px solid ${s.border}`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',fontSize:32}}>{s.icon}</div>
                <h4 style={{fontSize:16,fontWeight:700,color:'var(--navy)',marginBottom:8}}>{s.title}</h4>
                <p style={{fontSize:13,color:'var(--text2)',lineHeight:1.5}}>{s.desc}</p>
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
              {iconCls:'fi-navy',icon:'🔒',title:'Milestone-Based Escrow',desc:'Donations are locked in Soroban smart contracts and only released when verified milestones are achieved. Funds never enter organizer wallets.',badge:'badge-navy',badgeText:'🔗 On-chain Secured'},
              {iconCls:'fi-emerald',icon:'📋',title:'Proof of Reality',desc:'Every peso is backed by real receipts, medical documents, construction photos, and institution confirmations. No proof = no release.',badge:'badge-emerald',badgeText:'✅ Document Verified'},
              {iconCls:'fi-gold',icon:'🛡️',title:'Donor Protection & Clawback',desc:'Donors vote to pause suspicious campaigns and can reclaim unspent funds if fraud is proven. Your money, your control.',badge:'badge-gold',badgeText:'⚡ Community Power'},
              {iconCls:'fi-navy',icon:'🤖',title:'AI Risk Detection',desc:'Machine learning scans campaigns 24/7 for duplicate patterns, suspicious spending, fake accounts, and delayed milestones.',badge:'badge-blue',badgeText:'🧠 AI-Powered'},
              {iconCls:'fi-emerald',icon:'🎖️',title:'Impact Certificates',desc:'Every donor receives a blockchain-verified impact certificate with transaction hash, Stellar reference, and QR-verifiable proof.',badge:'badge-emerald',badgeText:'📸 Share-worthy'},
              {iconCls:'fi-gold',icon:'📍',title:'Near Me Campaigns',desc:'GPS-powered campaign discovery shows verified causes in your area. Help your neighbors, barangay, and community first.',badge:'badge-gold',badgeText:'📍 Location-Aware'},
            ].map((f)=>(
              <div key={f.title} className="feature-card">
                <div className={`feature-icon ${f.iconCls}`}>{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
                <div className="mt-16"><span className={`badge ${f.badge}`}>{f.badgeText}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MASCOT SECTION */}
      <section className="section" style={{background:'var(--navy)',overflow:'hidden',position:'relative'}}>
        <div style={{position:'absolute',right:-60,top:-60,width:400,height:400,background:'radial-gradient(circle,rgba(16,184,145,.15),transparent 70%)',pointerEvents:'none'}}/>
        <div className="container">
          <div className="grid-2" style={{alignItems:'center',gap:80}}>
            <div>
              <div style={{fontSize:12,fontWeight:700,letterSpacing:2,color:'var(--emerald)',marginBottom:16}}>WHY DONORS LOVE LINGAP</div>
              <h2 style={{fontSize:40,fontWeight:800,color:'#fff',lineHeight:1.15,marginBottom:24}}>Gabo the Elephant<br/>guards every peso 🐘</h2>
              <p style={{fontSize:17,color:'rgba(255,255,255,.7)',lineHeight:1.65,marginBottom:32}}>Just like elephants never forget, LINGAP never forgets a single transaction. Every peso donated is permanently recorded on the Stellar blockchain — immutable, publicly verifiable, and forever traceable.</p>
              <div style={{display:'flex',flexDirection:'column',gap:16}}>
                {[
                  {bg:'rgba(16,184,145,.15)',border:'rgba(16,184,145,.3)',icon:'🔗',title:'Never forgets a transaction',sub:'Permanent on-chain donation trail'},
                  {bg:'rgba(255,221,87,.1)',border:'rgba(255,221,87,.25)',icon:'🛡️',title:'Shields your donation',sub:'Smart contract escrow protection'},
                  {bg:'rgba(37,99,235,.15)',border:'rgba(37,99,235,.3)',icon:'🎉',title:'Celebrates every milestone',sub:'Real-time progress you can see'},
                ].map((item)=>(
                  <div key={item.title} className="flex flex-center gap-16">
                    <div style={{width:48,height:48,background:item.bg,border:`1px solid ${item.border}`,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{item.icon}</div>
                    <div>
                      <div style={{fontWeight:600,color:'#fff',fontSize:15}}>{item.title}</div>
                      <div style={{fontSize:13,color:'rgba(255,255,255,.55)',marginTop:3}}>{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-center">
              <svg width="260" height="320" viewBox="0 0 260 320" fill="none" xmlns="http://www.w3.org/2000/svg" style={{filter:'drop-shadow(0 20px 40px rgba(0,0,0,.3))'}}>
                <ellipse cx="130" cy="295" rx="90" ry="20" fill="rgba(16,184,145,0.12)"/>
                <rect x="18" y="70" width="48" height="68" rx="14" fill="#4B5563"/>
                <rect x="26" y="79" width="32" height="50" rx="11" fill="#F4A6B2"/>
                <rect x="194" y="70" width="48" height="68" rx="14" fill="#4B5563"/>
                <rect x="202" y="79" width="32" height="50" rx="11" fill="#F4A6B2"/>
                <rect x="56" y="36" width="148" height="130" rx="38" fill="#9AA3B2"/>
                <rect x="74" y="40" width="108" height="54" rx="27" fill="rgba(255,255,255,0.12)"/>
                <rect x="76" y="96" width="32" height="36" rx="16" fill="#1a1a2e"/>
                <rect x="152" y="110" width="32" height="8" rx="4" fill="#1a1a2e"/>
                <rect x="84" y="103" width="9" height="9" rx="4" fill="white"/>
                <rect x="62" y="122" width="28" height="16" rx="8" fill="#F4A6B2" fillOpacity="0.5"/>
                <rect x="170" y="122" width="28" height="16" rx="8" fill="#F4A6B2" fillOpacity="0.5"/>
                <rect x="116" y="158" width="28" height="13" rx="6" fill="#8B939F"/>
                <rect x="112" y="168" width="24" height="12" rx="6" fill="#9AA3B2"/>
                <rect x="114" y="178" width="20" height="10" rx="5" fill="#8B939F"/>
                <rect x="50" y="192" width="160" height="90" rx="22" fill="#1E3A8A"/>
                <rect x="6" y="200" width="50" height="26" rx="13" fill="#9AA3B2" transform="rotate(-10 6 200)"/>
                <rect x="204" y="200" width="50" height="26" rx="13" fill="#9AA3B2" transform="rotate(10 204 200)"/>
                <rect x="88" y="185" width="84" height="52" rx="12" fill="#EF4444"/>
                <rect x="88" y="173" width="36" height="36" rx="18" fill="#EF4444"/>
                <rect x="136" y="173" width="36" height="36" rx="18" fill="#EF4444"/>
                <rect x="96" y="225" width="68" height="24" rx="12" fill="#EF4444"/>
                <rect x="104" y="244" width="52" height="20" rx="10" fill="#EF4444"/>
                <rect x="114" y="258" width="32" height="16" rx="8" fill="#EF4444"/>
                <rect x="122" y="269" width="16" height="12" rx="6" fill="#EF4444"/>
                <rect x="98" y="183" width="14" height="8" rx="4" fill="rgba(255,255,255,0.35)"/>
                <rect x="68" y="270" width="44" height="36" rx="14" fill="#9AA3B2"/>
                <rect x="148" y="270" width="44" height="36" rx="14" fill="#9AA3B2"/>
              </svg>
              <div style={{fontFamily:'Sora,sans-serif',fontSize:20,fontWeight:700,color:'#fff',marginTop:16}}>Salamat, mahal na donor! 💙</div>
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
          <div className="campaign-grid" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
            <div className="camp-card emerald-glow">
              <div className="camp-img" style={{background:'linear-gradient(135deg,#1e3a8a,#2563eb)'}}>
                <div className="camp-img-inner">🏥</div>
                <div style={{position:'absolute',top:12,left:12}}><span className="badge badge-red">🔴 URGENT</span></div>
                <div style={{position:'absolute',top:12,right:12}}><span className="badge badge-emerald">✅ Verified</span></div>
              </div>
              <div className="camp-body">
                <h3 className="camp-title">Maria Santos — Stage 3 Ovarian Cancer Treatment</h3>
                <p className="camp-desc">37-year-old mother of three from Quezon City. Diagnosed last March, currently undergoing chemo at Philippine General Hospital.</p>
                <div className="camp-meta">
                  <div><div className="camp-raised">₱182,400</div><div className="camp-goal">of ₱250,000 goal</div></div>
                  <div className="camp-donors">👥 342 donors</div>
                </div>
                <div className="prog-track" style={{height:8}}><div className="prog-fill prog-emerald" style={{width:'73%'}}/></div>
                <div className="camp-footer">
                  <span className="badge badge-navy">🏥 PGH Verified</span>
                  <span style={{fontSize:12,color:'var(--emerald)',fontWeight:600}}>73% funded • 12d left</span>
                </div>
              </div>
            </div>
            <div className="camp-card emerald-glow">
              <div className="camp-img" style={{background:'linear-gradient(135deg,#065f46,#059669)'}}>
                <div className="camp-img-inner">🌊</div>
                <div style={{position:'absolute',top:12,left:12}}><span className="badge badge-orange">⚠️ Emergency</span></div>
                <div style={{position:'absolute',top:12,right:12}}><span className="badge badge-emerald">✅ Verified</span></div>
              </div>
              <div className="camp-body">
                <h3 className="camp-title">Typhoon Carina Relief — Batangas Coastal Communities</h3>
                <p className="camp-desc">Over 400 families displaced by Typhoon Carina in Batangas. Immediate food, shelter, and medicine needed for survivors.</p>
                <div className="camp-meta">
                  <div><div className="camp-raised">₱890,000</div><div className="camp-goal">of ₱1,200,000 goal</div></div>
                  <div className="camp-donors">👥 1,203 donors</div>
                </div>
                <div className="prog-track" style={{height:8}}><div className="prog-fill prog-emerald" style={{width:'74%'}}/></div>
                <div className="camp-footer">
                  <span className="badge badge-navy">🤝 DSWD Partner</span>
                  <span style={{fontSize:12,color:'var(--emerald)',fontWeight:600}}>74% funded • 5d left</span>
                </div>
              </div>
            </div>
            <div className="camp-card emerald-glow">
              <div className="camp-img" style={{background:'linear-gradient(135deg,#92400e,#d97706)'}}>
                <div className="camp-img-inner">🎓</div>
                <div style={{position:'absolute',top:12,right:12}}><span className="badge badge-emerald">✅ Verified</span></div>
              </div>
              <div className="camp-body">
                <h3 className="camp-title">Juan dela Cruz — Scholar from Samar: Engineering Dream</h3>
                <p className="camp-desc">19-year-old from Eastern Samar, top 1 in his barangay, qualified for PUP Manila Engineering but can&apos;t afford tuition and board.</p>
                <div className="camp-meta">
                  <div><div className="camp-raised">₱48,000</div><div className="camp-goal">of ₱65,000 goal</div></div>
                  <div className="camp-donors">👥 87 donors</div>
                </div>
                <div className="prog-track" style={{height:8}}><div className="prog-fill prog-gold" style={{width:'74%'}}/></div>
                <div className="camp-footer">
                  <span className="badge badge-navy">🎓 PUP Verified</span>
                  <span style={{fontSize:12,color:'var(--gold-dark)',fontWeight:600}}>74% funded • 18d left</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section style={{background:'linear-gradient(135deg,var(--emerald-dark),var(--emerald))',padding:'80px 40px',textAlign:'center'}}>
        <div className="container">
          <div style={{fontSize:48,marginBottom:16}}>🐘</div>
          <h2 style={{fontSize:40,fontWeight:800,color:'#fff',marginBottom:16,lineHeight:1.2}}>Start giving with confidence</h2>
          <p style={{fontSize:18,color:'rgba(255,255,255,.85)',marginBottom:32,maxWidth:500,marginLeft:'auto',marginRight:'auto'}}>Join 15,000+ Filipinos who trust LINGAP to make every peso count.</p>
          <div className="flex gap-16" style={{justifyContent:'center',flexWrap:'wrap'}}>
            <Link href="/discover" className="btn btn-gold btn-lg">💰 Start Donating</Link>
            <button className="btn btn-lg" style={{background:'rgba(255,255,255,.15)',color:'#fff',border:'1.5px solid rgba(255,255,255,.35)'}}>📋 Create Campaign</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{background:'var(--navy)',padding:'48px 40px 32px',color:'rgba(255,255,255,.6)'}}>
        <div className="container">
          <div className="grid-4 mb-32">
            <div>
              <div style={{fontFamily:'Sora,sans-serif',fontWeight:800,fontSize:22,color:'#fff',letterSpacing:-1,marginBottom:12}}>LIN<span style={{color:'var(--emerald)'}}>GAP</span></div>
              <div style={{fontSize:13,lineHeight:1.7,marginBottom:16}}>Ledger for Integrity, Need-based Giving, Aid Provenance, and Protection.</div>
              <span className="badge badge-emerald">🔗 Powered by Stellar Blockchain</span>
            </div>
            <div>
              <div style={{fontWeight:600,color:'#fff',marginBottom:16,fontSize:14}}>Platform</div>
              <div style={{display:'flex',flexDirection:'column',gap:8,fontSize:13}}>
                <Link href="/discover" style={{color:'rgba(255,255,255,.6)',textDecoration:'none'}}>Discover Campaigns</Link>
                <a href="#" style={{color:'rgba(255,255,255,.6)',textDecoration:'none'}}>Start a Campaign</a>
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
                {['📘','💬','🎵','🐦'].map((icon,i)=>(
                  <div key={i} style={{width:36,height:36,background:'rgba(255,255,255,.1)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:16}}>{icon}</div>
                ))}
              </div>
            </div>
          </div>
          <div style={{borderTop:'1px solid rgba(255,255,255,.1)',paddingTop:24,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8,fontSize:12}}>
            <div>© 2025 LINGAP. All rights reserved. Built with 💙 for the Filipino people.</div>
            <div style={{fontFamily:'Space Mono,monospace',fontSize:10,color:'rgba(255,255,255,.3)'}}>STELLAR:LINGAP-MAINNET-v1.0.0</div>
          </div>
        </div>
      </footer>
    </>
  );
}
