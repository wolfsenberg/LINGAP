"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
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
import { campaignsApi } from "@/lib/api";

const categories = ["Medical", "Relief", "Education", "Community"];

export default function StartCampaignPage() {
  const [category, setCategory] = useState("Medical");
  const [saving, setSaving] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null);
      return;
    }

    const preview = URL.createObjectURL(coverFile);
    setCoverPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [coverFile]);

  function handleCoverChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setCoverFile(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a PNG, JPG, or WebP image.");
      event.target.value = "";
      setCoverFile(null);
      return;
    }

    setCoverFile(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    try {
      let imageSrc: string | null = null;
      if (coverFile) {
        const upload = await campaignsApi.uploadCover(coverFile);
        imageSrc = upload.data.data.url;
      }

      await campaignsApi.create({
        title: String(form.get("title") || ""),
        description: String(form.get("description") || ""),
        category,
        institution: String(form.get("institution") || ""),
        location: String(form.get("location") || ""),
        goal_amount: Number(form.get("goal_amount") || 0),
        image_src: imageSrc,
      });
      toast.success("Campaign draft saved for verification.");
      router.push("/donor#organized-drives");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Campaign save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="start-hero" style={{background:'var(--forest)',padding:'48px 40px'}}>
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
        <form onSubmit={handleSubmit} className="grid-2 start-campaign-form" style={{alignItems:'start',gap:24}}>
          <div style={{display:'flex',flexDirection:'column',gap:18}}>
            <section className="card">
              <h2 style={{fontSize:20,fontWeight:800,color:'var(--forest)',marginBottom:18,display:'flex',alignItems:'center',gap:8}}>
                <FileText size={19} color="var(--canopy)"/> Campaign Details
              </h2>
              <div style={{display:'grid',gap:14}}>
                <label style={{display:'grid',gap:6}}>
                  <span className="small semi muted">Campaign title</span>
                  <input required name="title" placeholder="e.g. Maria Santos cancer treatment fund" className="form-input" />
                </label>
                <label style={{display:'grid',gap:6}}>
                  <span className="small semi muted">Short story</span>
                  <textarea required name="description" placeholder="Tell donors who needs help, why it matters, and what proof you can provide." className="form-input" rows={5}/>
                </label>
                <div style={{display:'grid',gap:6}}>
                  <span className="small semi muted">Campaign Photos</span>
                  <div style={{padding:coverPreview ? 0 : 20,border:'1px dashed var(--border)',borderRadius:'var(--r-sm)',background:'rgba(255,255,255,.5)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',position:'relative',transition:'all .2s',minHeight:180,overflow:'hidden'}} className="hover-border-canopy">
                    <input type="file" name="cover" accept="image/png, image/jpeg, image/webp" onChange={handleCoverChange} style={{opacity:0,position:'absolute',top:0,left:0,width:'100%',height:'100%',cursor:'pointer',zIndex:2}} />
                    {coverPreview ? (
                      <>
                        <img src={coverPreview} alt="Campaign cover preview" style={{width:'100%',height:220,objectFit:'cover',display:'block'}} />
                        <div style={{position:'absolute',left:14,bottom:14,zIndex:3,padding:'8px 12px',borderRadius:999,background:'rgba(255,253,248,.92)',fontSize:12,fontWeight:800,color:'var(--forest)',boxShadow:'0 10px 24px rgba(0,0,0,.12)'}}>Cover selected - click to change</div>
                      </>
                    ) : (
                      <>
                        <Upload size={22} color="var(--canopy)" strokeWidth={1.8}/>
                        <div style={{fontSize:13,fontWeight:700,color:'var(--forest)',marginTop:8}}>Add campaign cover photo</div>
                        <div style={{fontSize:12,color:'var(--text3)',marginTop:4}}>Show donors who they are helping (PNG/JPG/WebP)</div>
                      </>
                    )}
                  </div>
                </div>
                <div className="form-two-col" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <label style={{display:'grid',gap:6}}>
                    <span className="small semi muted">Category</span>
                    <select value={category} onChange={(e)=>setCategory(e.target.value)} className="form-input">
                      {categories.map((c)=><option key={c}>{c}</option>)}
                    </select>
                  </label>
                  <label style={{display:'grid',gap:6}}>
                    <span className="small semi muted">Target amount</span>
                    <input required name="goal_amount" type="number" min="1" placeholder="250000" className="form-input" />
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
                  <input required name="beneficiary_name" placeholder="Full name or community name" className="form-input" />
                </label>
                <label style={{display:'grid',gap:6}}>
                  <span className="small semi muted">Verified institution receiving funds</span>
                  <input required name="institution" placeholder="Hospital, school, pharmacy, NGO, or relief partner" className="form-input" />
                </label>
                <label style={{display:'grid',gap:6}}>
                  <span className="small semi muted">Location</span>
                  <div style={{position:'relative'}}>
                    <MapPin size={15} style={{position:'absolute',left:12,top:13,color:'var(--text3)'}}/>
                    <input required name="location" placeholder="City, province" className="form-input" style={{paddingLeft:36}} />
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
                  <div key={m} className="milestone-row" style={{display:'grid',gridTemplateColumns:'1.2fr .8fr',gap:12}}>
                    <input defaultValue={m} className="form-input" aria-label={`Milestone ${i + 1} name`} />
                    <input placeholder="Amount" type="number" min="0" className="form-input" aria-label={`Milestone ${i + 1} amount`} />
                  </div>
                ))}
              </div>
              <button type="button" className="btn btn-outline btn-sm mt-16"><Plus size={14}/> Add Milestone</button>
            </section>
          </div>

          <aside className="start-campaign-side" style={{display:'flex',flexDirection:'column',gap:18,position:'sticky',top:88}}>
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

            <div className="flex" style={{flexDirection:'column',gap:8}}>
              <button type="submit" disabled={saving} className="btn btn-emerald btn-lg" style={{justifyContent:'center', opacity: saving ? .72 : 1}}><Save size={16}/> {saving ? "Saving..." : "Save for Verification"}</button>
              <Link href="/donor#organized-drives" className="btn btn-outline" style={{justifyContent:'center'}}>Cancel</Link>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
