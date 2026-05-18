export default function CertificatePage() {
  return (
    <div>
      <div style={{background:'var(--navy)',padding:'48px 40px',textAlign:'center'}}>
        <div className="container">
          <div className="section-label" style={{color:'var(--emerald)'}}>IMPACT CERTIFICATE</div>
          <h1 style={{fontSize:36,fontWeight:800,color:'#fff'}}>Your Verified Giving Record</h1>
          <p style={{color:'rgba(255,255,255,.65)',marginTop:10}}>Blockchain-verified proof that your donation created real impact.</p>
        </div>
      </div>

      <div className="cert-wrap">
        <div className="cert-inner">
          <div className="cert-corner cc-tl"/><div className="cert-corner cc-tr"/>
          <div className="cert-corner cc-bl"/><div className="cert-corner cc-br"/>

          <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:12,marginBottom:24}}>
            <div style={{flex:1,height:1,background:'linear-gradient(90deg,transparent,var(--gold))'}}/>
            <span style={{fontSize:28}}>🐘</span>
            <div style={{flex:1,height:1,background:'linear-gradient(90deg,var(--gold),transparent)'}}/>
          </div>

          <div className="cert-title">CERTIFICATE OF HUMANITARIAN IMPACT</div>
          <div style={{fontFamily:'Sora,sans-serif',fontSize:48,fontWeight:800,color:'var(--navy)',margin:'8px 0'}}>LINGAP</div>
          <div style={{fontSize:14,color:'var(--text3)',marginBottom:28,letterSpacing:1}}>LEDGER FOR INTEGRITY, NEED-BASED GIVING, AID PROVENANCE & PROTECTION</div>

          <div style={{fontSize:15,color:'var(--text2)',marginBottom:8}}>This certifies that</div>
          <div className="cert-name">Jose Dela Cruz</div>
          <div style={{fontSize:15,color:'var(--text2)',margin:'16px 0 8px'}}>has made a verified, blockchain-recorded donation of</div>
          <div style={{fontFamily:'Sora,sans-serif',fontSize:40,fontWeight:800,color:'var(--emerald)',marginBottom:16}}>₱5,000.00</div>
          <div style={{fontSize:15,color:'var(--text2)',marginBottom:8}}>in support of the verified campaign</div>
          <div style={{fontSize:20,fontWeight:700,color:'var(--navy)',marginBottom:8}}>&quot;Maria Santos — Stage 3 Cancer Treatment&quot;</div>
          <div style={{fontSize:14,color:'var(--text3)',marginBottom:32}}>Philippine General Hospital • November 28, 2025</div>

          <div style={{background:'rgba(16,184,145,.06)',border:'1px solid rgba(16,184,145,.2)',borderRadius:12,padding:'18px 24px',marginBottom:32,display:'inline-block'}}>
            <div style={{fontSize:12,color:'var(--text3)',marginBottom:8}}>MILESTONE FUNDED</div>
            <div style={{fontWeight:700,color:'var(--navy)'}}>Chemotherapy Cycle 3 — Completed ✅</div>
            <div style={{fontSize:13,color:'var(--text2)',marginTop:4}}>Funds released directly to PGH Billing Department</div>
          </div>

          <div style={{background:'var(--navy)',borderRadius:12,padding:'20px 28px',marginBottom:32,textAlign:'left'}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div className="cert-qr"><div style={{fontSize:24}}>🔍</div></div>
              <div>
                <div style={{fontSize:12,color:'rgba(255,255,255,.5)',marginBottom:6}}>STELLAR BLOCKCHAIN TRANSACTION REFERENCE</div>
                <div style={{fontFamily:'Space Mono,monospace',fontSize:13,color:'var(--emerald)',letterSpacing:1}}>STELLAR:0x4a8f3c2b9e1d...7f2a</div>
                <div style={{fontSize:12,color:'rgba(255,255,255,.5)',marginTop:6}}>Immutable Record • Publicly Verifiable • Nov 28, 2025 14:32 PHT</div>
              </div>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24,marginBottom:24}}>
            {[
              {name:'LINGAP Platform',sub:'Verified by Blockchain',border:'var(--navy)'},
              {name:'Philippine General Hospital',sub:'Institution Recipient',border:'var(--gold-dark)'},
              {name:'Soroban Smart Contract',sub:'Escrow Authority',border:'var(--emerald)'},
            ].map((s)=>(
              <div key={s.name} style={{borderTop:`2px solid ${s.border}`,paddingTop:12}}>
                <div style={{fontWeight:700,fontSize:14,color:'var(--navy)'}}>{s.name}</div>
                <div style={{fontSize:12,color:'var(--text3)'}}>{s.sub}</div>
              </div>
            ))}
          </div>

          <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:12}}>
            <div style={{flex:1,height:1,background:'linear-gradient(90deg,transparent,var(--border))'}}/>
            <span style={{fontSize:13,color:'var(--text3)'}}>Every Donation Proven. Every Peso Protected.</span>
            <div style={{flex:1,height:1,background:'linear-gradient(90deg,var(--border),transparent)'}}/>
          </div>
        </div>

        <div className="flex gap-12 mt-24" style={{justifyContent:'center',flexWrap:'wrap'}}>
          <button className="btn btn-primary btn-lg">🖨️ Print Certificate</button>
          <button className="btn btn-emerald btn-lg">📥 Download PDF</button>
          <button className="btn btn-lg" style={{background:'#1877F2',color:'#fff',border:'none'}}>📘 Share to Facebook</button>
          <button className="btn btn-outline btn-lg">🔗 Copy Stellar Link</button>
        </div>
      </div>
    </div>
  );
}
