import Link from "next/link";
import { ArrowLeft, Plus, Users } from "lucide-react";
import { organizedDrives } from "@/lib/mockCampaignDrives";

export default function MyCampaignsPage() {
  return (
    <div>
      <div style={{background:'var(--forest)',padding:'48px 40px'}}>
        <div className="container">
          <Link href="/donor#organized-drives" className="btn btn-outline btn-sm" style={{color:'#fff',borderColor:'rgba(255,255,255,.28)',background:'rgba(255,255,255,.08)',marginBottom:22}}>
            <ArrowLeft size={14}/> Back to My Impact
          </Link>
          <div className="section-label" style={{color:'var(--canopy-light)'}}>MY CAMPAIGN DRIVES</div>
          <h1 style={{fontSize:36,fontWeight:800,color:'#fff',marginBottom:12}}>All campaigns you organized</h1>
          <p style={{color:'rgba(255,255,255,.68)',fontSize:16,maxWidth:620}}>Track drafts, campaigns under review, active drives, and completed fundraising milestones.</p>
        </div>
      </div>

      <div className="page-inner">
        <div className="flex flex-center flex-between mb-24" style={{gap:16,flexWrap:'wrap'}}>
          <div style={{fontSize:14,color:'var(--text2)'}}>{organizedDrives.length} campaign drives found</div>
          <Link href="/start-campaign" className="btn btn-emerald"><Plus size={15}/> Start Campaign</Link>
        </div>

        <div className="campaign-grid">
          {organizedDrives.map((drive)=>(
            <div key={drive.id} className="camp-card" style={{cursor:'default'}}>
              <div className="camp-body">
                <div className="flex flex-center flex-between mb-12">
                  <span className="badge badge-navy">{drive.category}</span>
                  <span className={`badge ${drive.status === 'Active' || drive.status === 'Funded' ? 'badge-emerald' : drive.status === 'Draft' ? 'badge-navy' : 'badge-gold'}`}>{drive.status}</span>
                </div>
                <div style={{fontSize:12,color:'var(--text3)',fontFamily:'Space Mono,monospace',marginBottom:8}}>{drive.id}</div>
                <h3 className="camp-title">{drive.title}</h3>
                <p className="camp-desc" style={{WebkitLineClamp:1}}>{drive.institution}</p>
                <div className="camp-meta">
                  <div><div className="camp-raised">{drive.raised}</div><div className="camp-goal">of {drive.goal} goal</div></div>
                  <div className="camp-donors"><Users size={12}/> {drive.donors.toLocaleString()} donors</div>
                </div>
                <div className="prog-track" style={{height:8}}><div className="prog-fill prog-emerald" style={{width:`${drive.progress}%`}}/></div>
                <div className="camp-footer">
                  <span style={{fontSize:12,color:'var(--text3)'}}>{drive.updated}</span>
                  <span style={{fontSize:12,color:'var(--canopy)',fontWeight:700}}>{drive.progress}% funded</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
