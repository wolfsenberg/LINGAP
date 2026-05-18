import Link from "next/link";

export default function DiscoverPage() {
  const campaigns = [
    {href:'/detail',bg:'linear-gradient(135deg,#1e3a8a,#2563eb)',icon:'🏥',urgency:{cls:'badge-red',text:'🔴 URGENT'},title:'Maria Santos — Stage 3 Cancer Treatment at PGH',desc:'37-year-old mother of three from Quezon City. Undergoing chemotherapy. Needs funds for continued treatment.',raised:'₱182,400',goal:'₱250,000',donors:342,pct:73,badge:'🏥 PGH Accredited',daysLeft:'12d left',color:'var(--emerald)'},
    {href:'/detail',bg:'linear-gradient(135deg,#065f46,#059669)',icon:'🌊',urgency:{cls:'badge-orange',text:'⚠️ Emergency'},title:'Typhoon Carina — 400 Families in Batangas Need Help',desc:'Immediate food packs, temporary shelter, and medicine for coastal communities devastated by Typhoon Carina.',raised:'₱890,000',goal:'₱1,200,000',donors:1203,pct:74,badge:'🤝 DSWD Partner',daysLeft:'5d left',color:'var(--emerald)'},
    {href:'/detail',bg:'linear-gradient(135deg,#92400e,#d97706)',icon:'📚',urgency:null,title:'Juan dela Cruz — PUP Engineering Scholar from Samar',desc:'Top-performing student from Eastern Samar. Qualified for PUP Manila Engineering. Needs tuition and living allowance.',raised:'₱48,000',goal:'₱65,000',donors:87,pct:74,badge:'🎓 PUP Verified',daysLeft:'18d left',color:'var(--gold-dark)'},
    {href:'/detail',bg:'linear-gradient(135deg,#4a1d96,#7c3aed)',icon:'🏘️',urgency:{cls:'badge-blue',text:'📍 Near You'},title:'Barangay Payatas Community Kitchen Rebuilding',desc:'Help rebuild the community kitchen that serves 200+ meals daily to malnourished children and elderly in Payatas.',raised:'₱34,500',goal:'₱80,000',donors:156,pct:43,badge:'📍 2.3km away',daysLeft:'30d left',color:'var(--navy-light)'},
    {href:'/detail',bg:'linear-gradient(135deg,#7f1d1d,#dc2626)',icon:'❤️',urgency:{cls:'badge-red',text:'🔴 Critical'},title:'Baby Lila — Congenital Heart Defect Surgery Fund',desc:'8-month-old baby in Cebu diagnosed with VSD. Surgery scheduled at Vicente Sotto Memorial Medical Center.',raised:'₱285,000',goal:'₱400,000',donors:891,pct:71,badge:'🏥 VSMMC Verified',daysLeft:'8d left',color:'var(--emerald)'},
    {href:'/detail',bg:'linear-gradient(135deg,#064e3b,#10b981)',icon:'🌱',urgency:null,title:'Mangrove Reforestation — Tacloban Coastal Restoration',desc:'Plant 10,000 mangrove trees to protect Tacloban communities from future storm surge. Partnership with DENR.',raised:'₱120,000',goal:'₱200,000',donors:312,pct:60,badge:'🌿 DENR Accredited',daysLeft:'45d left',color:'var(--emerald)'},
  ];

  return (
    <div>
      <div style={{background:'var(--navy)',padding:'48px 40px',color:'#fff'}}>
        <div className="container">
          <div className="section-label" style={{color:'var(--emerald)'}}>CAMPAIGN DISCOVERY</div>
          <h1 style={{fontSize:40,fontWeight:800,color:'#fff',marginBottom:12}}>Find a cause to believe in</h1>
          <p style={{color:'rgba(255,255,255,.7)',fontSize:17,marginBottom:28}}>Every campaign verified. Every peso tracked. Your trust protected.</p>
          <div className="search-bar" style={{maxWidth:600,background:'rgba(255,255,255,.1)',borderColor:'rgba(255,255,255,.2)'}}>
            <span style={{fontSize:18}}>🔍</span>
            <input placeholder="Search campaigns, locations, or causes..." style={{color:'#fff'}}/>
            <button className="btn btn-emerald btn-sm">Search</button>
          </div>
        </div>
      </div>

      <div className="container" style={{paddingTop:32,paddingBottom:60}}>
        <div className="filter-bar">
          {['All Campaigns','🏥 Medical','🌊 Typhoon Relief','📚 Education','🤝 Community','📍 Near Me','⭐ Trending','🆕 New','✅ Verified Only'].map((f,i)=>(
            <button key={f} className={`filter-chip${i===0?' active':''}`}>{f}</button>
          ))}
        </div>

        <div style={{background:'linear-gradient(135deg,rgba(16,184,145,.08),rgba(37,99,235,.08))',border:'1px solid rgba(16,184,145,.2)',borderRadius:'var(--r)',padding:'20px 24px',marginBottom:28,display:'flex',alignItems:'center',gap:20}}>
          <span style={{fontSize:32}}>📍</span>
          <div>
            <div style={{fontWeight:700,color:'var(--navy)',fontSize:16}}>Campaigns Near You — Quezon City, Metro Manila</div>
            <div style={{fontSize:13,color:'var(--text2)',marginTop:4}}>Showing 12 verified campaigns within 10km of your location</div>
          </div>
          <button className="btn btn-outline btn-sm" style={{marginLeft:'auto',flexShrink:0}}>Change Location</button>
        </div>

        <div className="grid-4 mb-32">
          <div className="stat-card"><div className="stat-value">486</div><div className="stat-label">Active Campaigns</div><div className="stat-change">↑ 24 new this week</div></div>
          <div className="stat-card"><div className="stat-value">₱48.2M</div><div className="stat-label">Total Raised</div><div className="stat-change">↑ ₱2.3M this month</div></div>
          <div className="stat-card"><div className="stat-value">93%</div><div className="stat-label">Verified Campaigns</div><div className="stat-change">↑ Industry leading</div></div>
          <div className="stat-card"><div className="stat-value">0</div><div className="stat-label">Confirmed Frauds</div><div className="stat-change emerald">✓ Zero losses</div></div>
        </div>

        <div className="flex flex-center flex-between mb-24">
          <h3 style={{fontSize:20,fontWeight:700,color:'var(--navy)'}}>🔥 Trending Now</h3>
          <div style={{fontSize:13,color:'var(--text3)'}}>486 campaigns found</div>
        </div>

        <div className="campaign-grid">
          {campaigns.map((c) => (
            <Link key={c.title} href={c.href} className="camp-card" style={{textDecoration:'none'}}>
              <div className="camp-img" style={{background:c.bg}}>
                <div className="camp-img-inner">{c.icon}</div>
                {c.urgency && <div style={{position:'absolute',top:12,left:12}}><span className={`badge ${c.urgency.cls}`}>{c.urgency.text}</span></div>}
                <div style={{position:'absolute',top:12,right:12}}><span className="badge badge-emerald">✅ Verified</span></div>
                <div style={{position:'absolute',bottom:12,left:12,right:12,background:'rgba(13,27,42,.7)',borderRadius:8,padding:'8px 12px'}}>
                  <div style={{fontSize:11,color:'rgba(255,255,255,.7)'}}>Transparency Score</div>
                  <div style={{height:4,background:'rgba(255,255,255,.2)',borderRadius:2,marginTop:4}}><div style={{width:`${c.pct}%`,height:4,background:'var(--emerald)',borderRadius:2}}/></div>
                </div>
              </div>
              <div className="camp-body">
                <h3 className="camp-title">{c.title}</h3>
                <p className="camp-desc">{c.desc}</p>
                <div className="camp-meta">
                  <div><div className="camp-raised">{c.raised}</div><div className="camp-goal">of {c.goal} goal</div></div>
                  <div className="camp-donors">👥 {c.donors.toLocaleString()} donors</div>
                </div>
                <div className="prog-track" style={{height:8}}><div className="prog-fill prog-emerald" style={{width:`${c.pct}%`}}/></div>
                <div className="camp-footer">
                  <span className="badge badge-navy">{c.badge}</span>
                  <span style={{fontSize:12,color:c.color,fontWeight:600}}>{c.pct}% • {c.daysLeft}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
