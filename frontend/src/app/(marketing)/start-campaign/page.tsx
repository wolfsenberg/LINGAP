"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  FileText,
  Landmark,
  MapPin,
  Plus,
  Save,
  ShieldCheck,
  Upload,
} from "lucide-react";

const categories = ["Medical", "Relief", "Education", "Community"];

export default function StartCampaignPage() {
  const [category, setCategory] = useState("Medical");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    toast.success("Campaign draft saved for verification.");
  }

  return (
    <div>
      <div style={{background:'var(--forest)',padding:'48px 40px'}}>
        <div className="container">
          <Link href="/donor#organized-drives" className="btn btn-outline btn-sm" style={{color:'#fff',borderColor:'rgba(255,255,255,.28)',background:'rgba(255,255,255,.08)',marginBottom:22}}>
            <ArrowLeft size={14}/> Back to My Impact
          </Link>
          <div className="section-label" style={{color:'var(--canopy-light)'}}>START VERIFIED CAMPAIGN</div>
          <h1 style={{fontSize:36,fontWeight:800,color:'#fff',marginBottom:12}}>Create a campaign drive</h1>
          <p style={{color:'rgba(255,255,255,.68)',fontSize:16,maxWidth:680}}>Campaigns are reviewed before they go live. Funds will be routed through milestone escrow and released only to verified institutions.</p>
        </div>
      </div>

      <div className="page-inner">
        <form onSubmit={handleSubmit} className="grid-2" style={{alignItems:'start',gap:24}}>
          <div style={{display:'flex',flexDirection:'column',gap:18}}>
            <section className="card">
              <h2 style={{fontSize:20,fontWeight:800,color:'var(--forest)',marginBottom:18,display:'flex',alignItems:'center',gap:8}}>
                <FileText size={19} color="var(--canopy)"/> Campaign Details
              </h2>
              <div style={{display:'grid',gap:14}}>
                <label style={{display:'grid',gap:6}}>
                  <span className="small semi muted">Campaign title</span>
                  <input required placeholder="e.g. Maria Santos cancer treatment fund" className="form-input" />
                </label>
                <label style={{display:'grid',gap:6}}>
                  <span className="small semi muted">Short story</span>
                  <textarea required placeholder="Tell donors who needs help, why it matters, and what proof you can provide." className="form-input" rows={5}/>
                </label>
                <div style={{display:'grid',gap:6}}>
                  <span className="small semi muted">Campaign Photos</span>
                  <div style={{padding:20,border:'1px dashed var(--border)',borderRadius:'var(--r-sm)',background:'rgba(255,255,255,.5)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',position:'relative',transition:'all .2s'}} className="hover-border-canopy">
                    <input type="file" multiple accept="image/png, image/jpeg" style={{opacity:0,position:'absolute',top:0,left:0,width:'100%',height:'100%',cursor:'pointer'}} />
                    <Upload size={22} color="var(--canopy)" strokeWidth={1.8}/>
                    <div style={{fontSize:13,fontWeight:700,color:'var(--forest)',marginTop:8}}>Add cover & gallery photos</div>
                    <div style={{fontSize:12,color:'var(--text3)',marginTop:4}}>Show donors who they are helping (PNG/JPG, max 4 photos)</div>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <label style={{display:'grid',gap:6}}>
                    <span className="small semi muted">Category</span>
                    <select value={category} onChange={(e)=>setCategory(e.target.value)} className="form-input">
                      {categories.map((c)=><option key={c}>{c}</option>)}
                    </select>
                  </label>
                  <label style={{display:'grid',gap:6}}>
                    <span className="small semi muted">Target amount</span>
                    <input required type="number" min="1" placeholder="250000" className="form-input" />
                  </label>
                </div>
              </div>
            </section>

            <section className="card">
              <h2 style={{fontSize:20,fontWeight:800,color:'var(--forest)',marginBottom:18,display:'flex',alignItems:'center',gap:8}}>
                <Building2 size={19} color="var(--canopy)"/> Recipient & Institution
              </h2>
              <div style={{display:'grid',gap:14}}>
                <label style={{display:'grid',gap:6}}>
                  <span className="small semi muted">Beneficiary / recipient name</span>
                  <input required placeholder="Full name or community name" className="form-input" />
                </label>
                <label style={{display:'grid',gap:6}}>
                  <span className="small semi muted">Verified institution receiving funds</span>
                  <input required placeholder="Hospital, school, pharmacy, NGO, or relief partner" className="form-input" />
                </label>
                <label style={{display:'grid',gap:6}}>
                  <span className="small semi muted">Location</span>
                  <div style={{position:'relative'}}>
                    <MapPin size={15} style={{position:'absolute',left:12,top:13,color:'var(--text3)'}}/>
                    <input required placeholder="City, province" className="form-input" style={{paddingLeft:36}} />
                  </div>
                </label>
              </div>
            </section>

            <section className="card">
              <h2 style={{fontSize:20,fontWeight:800,color:'var(--forest)',marginBottom:18,display:'flex',alignItems:'center',gap:8}}>
                <Landmark size={19} color="var(--canopy)"/> Milestones
              </h2>
              <div style={{display:'grid',gap:12}}>
                {["Initial verification", "Milestone 1 release", "Final proof and closeout"].map((m,i)=>(
                  <div key={m} style={{display:'grid',gridTemplateColumns:'1.2fr .8fr',gap:12}}>
                    <input defaultValue={m} className="form-input" aria-label={`Milestone ${i + 1} name`} />
                    <input placeholder="Amount" type="number" min="0" className="form-input" aria-label={`Milestone ${i + 1} amount`} />
                  </div>
                ))}
              </div>
              <button type="button" className="btn btn-outline btn-sm mt-16"><Plus size={14}/> Add Milestone</button>
            </section>
          </div>

          <aside style={{display:'flex',flexDirection:'column',gap:18,position:'sticky',top:88}}>
            <section className="card">
              <h2 style={{fontSize:18,fontWeight:800,color:'var(--forest)',marginBottom:14,display:'flex',alignItems:'center',gap:8}}>
                <Upload size={18} color="var(--canopy)"/> Required Proofs
              </h2>
              <div style={{display:'grid',gap:10}}>
                {[
                  "Government ID or organizer verification",
                  "Medical certificate, enrollment form, or relief validation",
                  "Institution billing details or receiving account",
                  "At least one supporting photo or document",
                ].map((item)=>(
                  <div key={item} className="flex gap-8" style={{alignItems:'flex-start'}}>
                    <CheckCircle2 size={15} color="var(--canopy)" style={{marginTop:2,flexShrink:0}}/>
                    <span style={{fontSize:13,color:'var(--text2)',lineHeight:1.5}}>{item}</span>
                  </div>
                ))}
              </div>
              <div style={{marginTop:16,padding:16,border:'1px dashed var(--border2)',borderRadius:'var(--r-sm)',background:'var(--surface2)',textAlign:'center'}}>
                <Upload size={22} color="var(--canopy)"/>
                <div style={{fontSize:13,fontWeight:700,color:'var(--forest)',marginTop:6}}>Upload documents</div>
                <div style={{fontSize:12,color:'var(--text3)',marginTop:3}}>PDF, PNG, JPG up to 10MB</div>
              </div>
            </section>

            <section className="card">
              <h2 style={{fontSize:18,fontWeight:800,color:'var(--forest)',marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
                <ShieldCheck size={18} color="var(--canopy)"/> Review Path
              </h2>
              {[
                "Draft saved by organizer",
                "LINGAP verification review",
                "Institution confirmation",
                "Escrow contract created",
                "Campaign goes live",
              ].map((step,i)=>(
                <div key={step} className="flex gap-10" style={{padding:'8px 0',alignItems:'center'}}>
                  <span style={{width:22,height:22,borderRadius:'50%',background:i===0?'var(--canopy)':'var(--bg2)',color:i===0?'#fff':'var(--text3)',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,flexShrink:0}}>{i+1}</span>
                  <span style={{fontSize:13,color:'var(--text2)'}}>{step}</span>
                </div>
              ))}
            </section>

            <div className="flex gap-10" style={{flexDirection:'column'}}>
              <button type="submit" className="btn btn-emerald btn-lg" style={{justifyContent:'center'}}><Save size={16}/> Save for Verification</button>
              <Link href="/donor#organized-drives" className="btn btn-outline" style={{justifyContent:'center'}}>Cancel</Link>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
