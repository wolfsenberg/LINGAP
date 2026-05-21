"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  Compass,
  Download,
  ExternalLink,
  Facebook,
  Instagram,
  Leaf,
  Link2,
  Printer,
  Search,
  Twitter,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

type Certificate = {
  id: string;
  donor: string;
  amount: string;
  campaign: string;
  institution: string;
  milestone: string;
  date: string;
  timestamp: string;
  txHash: string;
  stellarUrl: string;
  theme: "medical" | "relief" | "education" | "community";
};

const certificates: Certificate[] = [
  {
    id: "LNGP-CERT-0847",
    donor: "Jose Dela Cruz",
    amount: "₱5,000.00",
    campaign: "Maria Santos — Stage 3 Cancer Treatment",
    institution: "Philippine General Hospital",
    milestone: "Chemotherapy Cycle 3 — Completed",
    date: "November 28, 2025",
    timestamp: "Nov 28, 2025 14:32 PHT",
    txHash: "STELLAR:0x4a8f3c2b9e1d7f2a",
    stellarUrl: "https://stellar.expert/explorer/testnet/tx/4a8f3c2b9e1d7f2a",
    theme: "medical",
  },
  {
    id: "LNGP-CERT-0712",
    donor: "Jose Dela Cruz",
    amount: "₱2,500.00",
    campaign: "Typhoon Carina Relief — Batangas Coastal Communities",
    institution: "DSWD Batangas Relief Partner",
    milestone: "Emergency food packs released",
    date: "November 14, 2025",
    timestamp: "Nov 14, 2025 10:08 PHT",
    txHash: "STELLAR:0x8d2a11f06cb934aa",
    stellarUrl: "https://stellar.expert/explorer/testnet/tx/8d2a11f06cb934aa",
    theme: "relief",
  },
  {
    id: "LNGP-CERT-0635",
    donor: "Jose Dela Cruz",
    amount: "₱3,000.00",
    campaign: "Juan dela Cruz — PUP Engineering Scholar from Samar",
    institution: "Polytechnic University of the Philippines",
    milestone: "Tuition escrow funded",
    date: "November 5, 2025",
    timestamp: "Nov 5, 2025 16:41 PHT",
    txHash: "STELLAR:0x2f9c74ad92be1180",
    stellarUrl: "https://stellar.expert/explorer/testnet/tx/2f9c74ad92be1180",
    theme: "education",
  },
  {
    id: "LNGP-CERT-0518",
    donor: "Jose Dela Cruz",
    amount: "₱14,000.00",
    campaign: "Multiple Campaigns — October Giving Record",
    institution: "LINGAP Verified Institution Network",
    milestone: "5 campaign milestones completed",
    date: "October 31, 2025",
    timestamp: "Oct 31, 2025 19:12 PHT",
    txHash: "STELLAR:0xf31a44c8de209b77",
    stellarUrl: "https://stellar.expert/explorer/testnet/tx/f31a44c8de209b77",
    theme: "community",
  },
];

const themeAccent = {
  medical: "var(--canopy)",
  relief: "var(--amber)",
  education: "var(--forest-light)",
  community: "var(--earth-light)",
};

export default function CertificatePage() {
  const [selected, setSelected] = useState<Certificate | null>(null);
  const userCertificates = certificates;
  const hasCertificates = userCertificates.length > 0;
  const selectedShareUrl = useMemo(() => selected?.stellarUrl ?? "", [selected]);

  function certificateMarkup(cert: Certificate) {
    return `
      <section style="font-family: Georgia, serif; color: #17231D; width: 900px; margin: 0 auto; padding: 64px; border: 8px solid #1A3A2A;">
        <div style="text-align:center; letter-spacing:4px; font-size:13px; color:#7A857E;">CERTIFICATE OF HUMANITARIAN IMPACT</div>
        <h1 style="text-align:center; font-size:52px; margin:18px 0 8px; color:#1A3A2A;">LINGAP</h1>
        <p style="text-align:center; color:#516158; margin-bottom:36px;">Ledger for Integrity, Need-based Giving, Aid Provenance and Protection</p>
        <p style="text-align:center; color:#516158;">This certifies that</p>
        <h2 style="text-align:center; font-size:36px; color:#4A9B6A; border-bottom:3px solid #F5C842; display:block; padding-bottom:10px;">${cert.donor}</h2>
        <p style="text-align:center; color:#516158;">has made a verified, blockchain-recorded donation of</p>
        <h3 style="text-align:center; font-size:42px; color:#4A9B6A; margin:12px 0;">${cert.amount}</h3>
        <p style="text-align:center; color:#516158;">in support of</p>
        <h4 style="text-align:center; font-size:24px; color:#1A3A2A;">${cert.campaign}</h4>
        <p style="text-align:center; color:#7A857E;">${cert.institution} · ${cert.date}</p>
        <div style="margin:36px auto; padding:20px; border:1px solid #D8CEBC; background:#F8F2E6; width:70%; text-align:center;">
          <strong>${cert.milestone}</strong>
          <p style="margin:8px 0 0; color:#516158;">Funds released through LINGAP escrow verification.</p>
        </div>
        <div style="background:#1A3A2A; color:white; padding:20px 24px; border-radius:10px;">
          <div style="font-size:12px; color:#A8D5B5;">STELLAR BLOCKCHAIN REFERENCE</div>
          <div style="font-family: monospace; color:#6BBF87; margin-top:8px;">${cert.txHash}</div>
          <div style="font-size:12px; color:rgba(255,255,255,.65); margin-top:6px;">${cert.timestamp}</div>
        </div>
      </section>
    `;
  }

  function printCertificate(cert: Certificate) {
    const printWindow = window.open("", "_blank", "width=1100,height=800");
    if (!printWindow) {
      toast.error("Allow pop-ups to print this certificate.");
      return;
    }
    printWindow.document.write(`
      <html>
        <head><title>${cert.id}</title></head>
        <body style="margin:0; padding:32px; background:white;">
          ${certificateMarkup(cert)}
          <script>window.onload = () => { window.print(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  async function shareNative(cert: Certificate) {
    const shareData = {
      title: `${cert.id} — LINGAP Impact Certificate`,
      text: `Verified LINGAP impact certificate for ${cert.campaign}`,
      url: cert.stellarUrl,
    };
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }
    await copyStellarLink(cert);
    toast.success("Share link copied. Paste it into Instagram or any app.");
  }

  async function copyStellarLink(cert: Certificate) {
    await navigator.clipboard.writeText(cert.stellarUrl);
    toast.success("Stellar link copied.");
  }

  function openShare(url: string) {
    window.open(url, "_blank", "noopener,noreferrer,width=720,height=680");
  }

  return (
    <div>
      <div style={{background:'var(--forest)',padding:'48px 40px'}}>
        <div className="container">
          <Link href="/donor#impact-certificates" className="btn btn-outline btn-sm" style={{color:'#fff',borderColor:'rgba(255,255,255,.28)',background:'rgba(255,255,255,.08)',marginBottom:22}}>
            <ArrowLeft size={14}/> Back to My Impact
          </Link>
          <div className="section-label" style={{color:'var(--canopy-light)'}}>MY IMPACT CERTIFICATES</div>
          <h1 style={{fontSize:36,fontWeight:800,color:'#fff',marginBottom:12}}>Your verified giving gallery</h1>
          <p style={{color:'rgba(255,255,255,.68)',fontSize:16,maxWidth:620}}>Every completed milestone creates a blockchain-verifiable certificate you can print, save, or share.</p>
        </div>
      </div>

      <div className="page-inner">
        {hasCertificates ? (
          <div className="campaign-grid">
            {userCertificates.map((cert) => (
              <button
                key={cert.id}
                onClick={() => setSelected(cert)}
                className="proof-card"
                style={{textAlign:'left',cursor:'pointer',border:'1px solid rgba(222,216,202,.9)',padding:0}}
              >
                <div style={{height:130,background:`linear-gradient(135deg,color-mix(in srgb, ${themeAccent[cert.theme]} 18%, white),#fffdf8)`,display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
                  <Award size={42} color={themeAccent[cert.theme]} strokeWidth={1.5}/>
                  <span className="badge badge-emerald" style={{position:'absolute',top:12,right:12,fontSize:11}}>
                    <CheckCircle2 size={10}/> Verified
                  </span>
                </div>
                <div style={{padding:18}}>
                  <div style={{fontSize:12,color:'var(--text3)',fontFamily:'Space Mono,monospace',marginBottom:8}}>{cert.id}</div>
                  <h3 style={{fontSize:16,fontWeight:800,color:'var(--forest)',marginBottom:8,lineHeight:1.3}}>{cert.campaign}</h3>
                  <div style={{display:'flex',alignItems:'center',gap:6,fontSize:13,color:'var(--text2)',marginBottom:6}}>
                    <Building2 size={13}/>{cert.institution}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:6,fontSize:13,color:'var(--text3)'}}>
                    <Calendar size={13}/>{cert.date}
                  </div>
                  <div className="flex flex-center flex-between" style={{marginTop:16}}>
                    <span style={{fontFamily:'Sora,sans-serif',fontSize:20,fontWeight:800,color:'var(--forest)'}}>{cert.amount}</span>
                    <span className="badge badge-navy">Open</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div style={{maxWidth:720,margin:'24px auto',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'48px 32px',textAlign:'center',boxShadow:'var(--shadow)'}}>
            <div style={{width:72,height:72,borderRadius:18,background:'rgba(74,155,106,.1)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px'}}>
              <Award size={34} color="var(--canopy)" strokeWidth={1.7}/>
            </div>
            <h2 style={{fontSize:24,fontWeight:800,color:'var(--forest)',marginBottom:10}}>Wala ka pang impact certificates</h2>
            <p style={{fontSize:15,color:'var(--text2)',lineHeight:1.7,maxWidth:480,margin:'0 auto 24px'}}>Certificates appear here once your supported campaign reaches a verified milestone. Try donating to a campaign to start building your verified impact record.</p>
            <div className="flex gap-12" style={{justifyContent:'center',flexWrap:'wrap'}}>
              <Link href="/discover" className="btn btn-emerald">
                <Compass size={15}/> Discover Campaigns
              </Link>
              <Link href="/donor#impact-certificates" className="btn btn-outline">
                Back to My Impact
              </Link>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <div style={{position:'fixed',inset:0,zIndex:300,background:'rgba(23,35,29,.58)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div style={{width:'min(1040px,100%)',maxHeight:'92vh',overflow:'auto',background:'var(--surface)',border:'1px solid rgba(255,255,255,.45)',borderRadius:14,boxShadow:'0 32px 80px rgba(0,0,0,.28)'}}>
            <div className="flex flex-center flex-between" style={{padding:'16px 18px',borderBottom:'1px solid var(--border)'}}>
              <div>
                <div style={{fontSize:12,color:'var(--text3)',fontFamily:'Space Mono,monospace'}}>{selected.id}</div>
                <div style={{fontWeight:800,color:'var(--forest)'}}>Impact Certificate Preview</div>
              </div>
              <button onClick={() => setSelected(null)} className="btn btn-outline btn-sm" aria-label="Close certificate preview">
                <X size={15}/>
              </button>
            </div>

            <div className="cert-wrap" style={{margin:'24px auto',padding:'0 24px'}}>
              <div className="cert-inner">
                <div className="cert-corner cc-tl"/><div className="cert-corner cc-tr"/>
                <div className="cert-corner cc-bl"/><div className="cert-corner cc-br"/>

                <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:12,marginBottom:24}}>
                  <div style={{flex:1,height:1,background:'linear-gradient(90deg,transparent,var(--amber))'}}/>
                  <div style={{width:48,height:48,background:'var(--forest)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <Leaf size={24} color="var(--canopy-light)" strokeWidth={2}/>
                  </div>
                  <div style={{flex:1,height:1,background:'linear-gradient(90deg,var(--amber),transparent)'}}/>
                </div>

                <div className="cert-title">CERTIFICATE OF HUMANITARIAN IMPACT</div>
                <div style={{fontFamily:'Sora,sans-serif',fontSize:48,fontWeight:800,color:'var(--forest)',margin:'8px 0'}}>LINGAP</div>
                <div style={{fontSize:14,color:'var(--text3)',marginBottom:28,letterSpacing:1}}>LEDGER FOR INTEGRITY, NEED-BASED GIVING, AID PROVENANCE &amp; PROTECTION</div>

                <div style={{fontSize:15,color:'var(--text2)',marginBottom:8}}>This certifies that</div>
                <div className="cert-name">{selected.donor}</div>
                <div style={{fontSize:15,color:'var(--text2)',margin:'16px 0 8px'}}>has made a verified, blockchain-recorded donation of</div>
                <div style={{fontFamily:'Sora,sans-serif',fontSize:40,fontWeight:800,color:'var(--canopy)',marginBottom:16}}>{selected.amount}</div>
                <div style={{fontSize:15,color:'var(--text2)',marginBottom:8}}>in support of the verified campaign</div>
                <div style={{fontSize:20,fontWeight:700,color:'var(--forest)',marginBottom:8}}>&quot;{selected.campaign}&quot;</div>
                <div style={{fontSize:14,color:'var(--text3)',marginBottom:32}}>{selected.institution} · {selected.date}</div>

                <div style={{background:'rgba(74,155,106,.06)',border:'1px solid rgba(74,155,106,.2)',borderRadius:12,padding:'18px 24px',marginBottom:32,display:'inline-block'}}>
                  <div style={{fontSize:12,color:'var(--text3)',marginBottom:8}}>MILESTONE FUNDED</div>
                  <div style={{fontWeight:700,color:'var(--forest)',display:'flex',alignItems:'center',gap:6}}>
                    <CheckCircle2 size={14} color="var(--canopy)" strokeWidth={2}/> {selected.milestone}
                  </div>
                  <div style={{fontSize:13,color:'var(--text2)',marginTop:4}}>Funds released through LINGAP escrow verification</div>
                </div>

                <div style={{background:'var(--forest)',borderRadius:12,padding:'20px 28px',marginBottom:32,textAlign:'left'}}>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div className="cert-qr"><Search size={24}/></div>
                    <div>
                      <div style={{fontSize:12,color:'rgba(255,255,255,.5)',marginBottom:6}}>STELLAR BLOCKCHAIN TRANSACTION REFERENCE</div>
                      <div style={{fontFamily:'Space Mono,monospace',fontSize:13,color:'var(--canopy-light)',letterSpacing:1}}>{selected.txHash}</div>
                      <div style={{fontSize:12,color:'rgba(255,255,255,.5)',marginTop:6}}>Immutable Record · Publicly Verifiable · {selected.timestamp}</div>
                    </div>
                  </div>
                </div>

                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24,marginBottom:24}}>
                  {[
                    {name:'LINGAP Platform',sub:'Verified by Blockchain',border:'var(--forest)'},
                    {name:selected.institution,sub:'Institution Recipient',border:'var(--amber)'},
                    {name:'Soroban Smart Contract',sub:'Escrow Authority',border:'var(--canopy)'},
                  ].map((s)=>(
                    <div key={s.name} style={{borderTop:`2px solid ${s.border}`,paddingTop:12}}>
                      <div style={{fontWeight:700,fontSize:14,color:'var(--forest)'}}>{s.name}</div>
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
            </div>

            <div style={{display:'flex',gap:10,flexWrap:'wrap',justifyContent:'center',padding:'0 24px 24px'}}>
              <button onClick={() => printCertificate(selected)} className="btn btn-primary"><Printer size={16}/> Print Certificate</button>
              <button onClick={() => printCertificate(selected)} className="btn btn-emerald"><Download size={16}/> Download PDF</button>
              <button onClick={() => openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(selectedShareUrl)}`)} className="btn" style={{background:'#1877F2',color:'#fff'}}><Facebook size={16}/> Facebook</button>
              <button onClick={() => openShare(`https://twitter.com/intent/tweet?url=${encodeURIComponent(selectedShareUrl)}&text=${encodeURIComponent(`My verified LINGAP impact certificate: ${selected.campaign}`)}`)} className="btn" style={{background:'#111',color:'#fff'}}><Twitter size={16}/> X</button>
              <button onClick={() => shareNative(selected)} className="btn btn-outline"><Instagram size={16}/> Share</button>
              <button onClick={() => copyStellarLink(selected)} className="btn btn-outline"><Link2 size={16}/> Copy Stellar Link</button>
              <a href={selected.stellarUrl} target="_blank" rel="noreferrer" className="btn btn-outline"><ExternalLink size={16}/> Stellar Explorer</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
