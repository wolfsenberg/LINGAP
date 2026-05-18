import Link from "next/link";

export default function DonorPage() {
  return (
    <div>
      <div className="donor-hero">
        <div className="container">
          <div className="grid-2" style={{alignItems:'center'}}>
            <div>
              <div style={{fontSize:12,fontWeight:700,letterSpacing:2,color:'var(--emerald)',marginBottom:12}}>MY IMPACT DASHBOARD</div>
              <h1 style={{fontSize:36,fontWeight:800,color:'#fff',marginBottom:8}}>Magandang araw, <span style={{color:'var(--gold)'}}>Jose! 🎉</span></h1>
              <p style={{color:'rgba(255,255,255,.65)',fontSize:16,marginBottom:24}}>You&apos;ve changed lives. Here&apos;s your verified impact story.</p>
              <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
                {[
                  {val:'₱24,500',label:'Total Donated',color:'#fff'},
                  {val:'8',label:'Campaigns Supported',color:'var(--gold)'},
                  {val:'23',label:'Lives Impacted',color:'var(--emerald)'},
                  {val:'🔥 7',label:'Month Streak',color:'#F87171'},
                ].map((s)=>(
                  <div key={s.label} style={{textAlign:'center',background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.15)',borderRadius:12,padding:'20px 28px'}}>
                    <div style={{fontFamily:'Sora,sans-serif',fontSize:28,fontWeight:800,color:s.color}}>{s.val}</div>
                    <div style={{fontSize:12,color:'rgba(255,255,255,.6)'}}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-center" style={{display:'flex',justifyContent:'flex-end'}}>
              <svg width="200" height="240" viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{filter:'drop-shadow(0 12px 30px rgba(0,0,0,.3))'}}>
                <ellipse cx="100" cy="224" rx="70" ry="16" fill="rgba(16,184,145,0.12)"/>
                {/* Confetti */}
                <rect x="20" y="10" width="8" height="8" rx="2" fill="#FFDD57" transform="rotate(20 20 10)"/>
                <rect x="160" y="20" width="8" height="8" rx="2" fill="#EF4444" transform="rotate(-15 160 20)"/>
                <rect x="170" y="60" width="6" height="6" rx="1" fill="#10B891" transform="rotate(30 170 60)"/>
                <rect x="15" y="70" width="6" height="6" rx="1" fill="#3B82F6" transform="rotate(-20 15 70)"/>
                <rect x="140" y="5" width="5" height="10" rx="2" fill="#F4A6B2" transform="rotate(10 140 5)"/>
                {/* Raised arms celebrating */}
                <rect x="4" y="148" width="36" height="20" rx="10" fill="#9AA3B2" transform="rotate(-40 4 148)"/>
                <rect x="160" y="148" width="36" height="20" rx="10" fill="#9AA3B2" transform="rotate(40 160 148)"/>
                {/* Ears */}
                <rect x="14" y="52" width="36" height="54" rx="11" fill="#4B5563"/>
                <rect x="20" y="60" width="24" height="40" rx="9" fill="#F4A6B2"/>
                <rect x="150" y="52" width="36" height="54" rx="11" fill="#4B5563"/>
                <rect x="156" y="60" width="24" height="40" rx="9" fill="#F4A6B2"/>
                {/* Head */}
                <rect x="42" y="28" width="116" height="100" rx="30" fill="#9AA3B2"/>
                <rect x="56" y="32" width="88" height="44" rx="22" fill="rgba(255,255,255,0.1)"/>
                {/* Happy big eyes */}
                <rect x="58" y="72" width="28" height="32" rx="14" fill="#1a1a2e"/>
                <rect x="114" y="72" width="28" height="32" rx="14" fill="#1a1a2e"/>
                <rect x="64" y="78" width="8" height="8" rx="4" fill="white"/>
                <rect x="120" y="78" width="8" height="8" rx="4" fill="white"/>
                {/* Big smile */}
                <rect x="62" y="108" width="76" height="10" rx="5" fill="rgba(26,26,46,0.3)"/>
                {/* Blush */}
                <rect x="46" y="98" width="22" height="14" rx="7" fill="#F4A6B2" fillOpacity="0.5"/>
                <rect x="132" y="98" width="22" height="14" rx="7" fill="#F4A6B2" fillOpacity="0.5"/>
                {/* Trunk pointing up */}
                <rect x="90" y="124" width="20" height="10" rx="5" fill="#8B939F"/>
                <rect x="84" y="130" width="16" height="10" rx="5" fill="#9AA3B2"/>
                <rect x="80" y="136" width="12" height="8" rx="4" fill="#8B939F"/>
                {/* Body */}
                <rect x="38" y="154" width="124" height="62" rx="18" fill="#1E3A8A"/>
                {/* Raised arms detail */}
                <rect x="6" y="160" width="34" height="18" rx="9" fill="#9AA3B2" transform="rotate(-35 6 160)"/>
                <rect x="160" y="160" width="34" height="18" rx="9" fill="#9AA3B2" transform="rotate(35 160 160)"/>
                {/* Celebration badge on shirt */}
                <rect x="80" y="172" width="40" height="22" rx="6" fill="#FFDD57"/>
                <rect x="84" y="167" width="10" height="10" rx="5" fill="#FFDD57"/>
                <rect x="106" y="167" width="10" height="10" rx="5" fill="#FFDD57"/>
                {/* Legs */}
                <rect x="54" y="204" width="36" height="26" rx="11" fill="#9AA3B2"/>
                <rect x="110" y="204" width="36" height="26" rx="11" fill="#9AA3B2"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="page-inner">
        <div className="grid-2 mb-28" style={{alignItems:'start',gap:24}}>
          <div style={{background:'#fff',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:24}}>
            <h3 style={{fontSize:18,fontWeight:700,color:'var(--navy)',marginBottom:20}}>🏆 Achievement Badges</h3>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}}>
              {[
                {icon:'💙',bg:'rgba(16,184,145,.1)',title:'Hope Giver',sub:'First donation made',earned:true},
                {icon:'🤝',bg:'rgba(37,99,235,.1)',title:'Community Hero',sub:'5+ campaigns supported',earned:true},
                {icon:'❤️',bg:'rgba(239,68,68,.1)',title:'Life Saver',sub:'₱10,000+ donated',earned:true},
                {icon:'🌟',bg:'rgba(245,158,11,.1)',title:'Verified Humanitarian',sub:'12-month streak needed',earned:false},
              ].map((a)=>(
                <div key={a.title} className="achievement-card" style={{opacity:a.earned?1:0.5}}>
                  <div className="ach-icon" style={{background:a.bg}}>{a.icon}</div>
                  <div style={{fontSize:13,fontWeight:700,color:'var(--navy)'}}>{a.title}</div>
                  <div style={{fontSize:11,color:'var(--text3)'}}>{a.sub}</div>
                  <span className={`badge ${a.earned?'badge-emerald':'badge-navy'}`} style={{fontSize:10,marginTop:8}}>{a.earned?'Earned':'Locked'}</span>
                </div>
              ))}
            </div>
            <Link href="/certificate" className="btn btn-emerald" style={{width:'100%',justifyContent:'center',marginTop:16,display:'flex'}}>🎖️ View My Impact Certificate</Link>
          </div>

          <div style={{background:'#fff',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:24}}>
            <div className="flex flex-center flex-between mb-20">
              <h3 style={{fontSize:18,fontWeight:700,color:'var(--navy)'}}>🏅 Community Leaderboard</h3>
              <span className="badge badge-gold">November 2025</span>
            </div>
            <div>
              {[
                {rank:'🥇',rankColor:'var(--gold-dark)',name:'Maria Gonzales',loc:'Pasig City • 8 campaigns',amount:'₱45,000',avatarBg:'rgba(255,221,87,.2)',icon:'👤',me:false},
                {rank:'🥈',rankColor:'#9AA3B2',name:'Roberto Cruz',loc:'Makati City • 12 campaigns',amount:'₱38,500',avatarBg:'rgba(16,184,145,.15)',icon:'👤',me:false},
                {rank:'🥉',rankColor:'#D97706',name:'Ana Ramos',loc:'QC • 6 campaigns',amount:'₱27,000',avatarBg:'rgba(37,99,235,.12)',icon:'👤',me:false},
                {rank:'#4',rankColor:'var(--navy-mid)',name:'Jose Dela Cruz (You!)',loc:'QC • 8 campaigns • 🔥 7 streak',amount:'₱24,500',avatarBg:'rgba(255,221,87,.2)',icon:'⭐',me:true},
                {rank:'#5',rankColor:'var(--text3)',name:'Liza Santos',loc:'Manila • 4 campaigns',amount:'₱19,800',avatarBg:'rgba(139,92,246,.12)',icon:'👤',me:false},
              ].map((lb)=>(
                <div key={lb.name} className="leaderboard-item" style={lb.me?{background:'rgba(255,221,87,.06)',borderRadius:10,padding:'12px 8px',borderBottom:'none',border:'1px solid rgba(255,221,87,.25)',marginBottom:4}:{}}>
                  <div className="lb-rank" style={{color:lb.rankColor}}>{lb.rank}</div>
                  <div className="lb-avatar" style={{background:lb.avatarBg,fontSize:18}}>{lb.icon}</div>
                  <div>
                    <div className="lb-name" style={lb.me?{color:'var(--emerald-dark)'}:{}}>{lb.name}</div>
                    <div style={{fontSize:12,color:'var(--text3)'}}>{lb.loc}</div>
                  </div>
                  <div className="lb-amount">{lb.amount}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{background:'#fff',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:28}}>
          <h3 style={{fontSize:18,fontWeight:700,color:'var(--navy)',marginBottom:20}}>📅 Donation Timeline</h3>
          <div style={{display:'flex',flexDirection:'column',gap:0}}>
            {[
              {amount:'₱5,000',campaign:'Maria Santos Cancer Fund',sub:'Nov 28 • Milestone 1 Released → PGH Confirmed',badge:'badge-emerald',badgeText:'Impact Verified',done:true},
              {amount:'₱2,500',campaign:'Typhoon Carina Relief',sub:'Nov 14 • Funds released to DSWD Batangas',badge:'badge-emerald',badgeText:'Impact Verified',done:true},
              {amount:'₱3,000',campaign:'Juan dela Cruz Scholarship',sub:'Nov 5 • Tuition receipt pending PUP verification',badge:'badge-gold',badgeText:'Pending',done:false},
              {amount:'₱14,000',campaign:'Multiple Campaigns (Oct 2025)',sub:'Oct 2025 • 5 campaigns → All milestones complete',badge:'badge-emerald',badgeText:'All Verified',done:true},
            ].map((item)=>(
              <div key={item.campaign} style={{display:'flex',gap:20,alignItems:'flex-start',paddingBottom:20,borderLeft:`2px solid ${item.done?'var(--emerald)':'var(--border)'}`,marginLeft:16,paddingLeft:24,position:'relative'}}>
                <div style={{position:'absolute',left:-9,top:0,width:16,height:16,background:item.done?'var(--emerald)':'var(--gold-dark)',borderRadius:'50%',border:'2px solid #fff'}}/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,color:'var(--navy)',fontSize:14}}>{item.amount} → {item.campaign}</div>
                  <div style={{fontSize:12,color:'var(--text3)'}}>{item.sub}</div>
                </div>
                <span className={`badge ${item.badge}`} style={{flexShrink:0}}>{item.badgeText}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
