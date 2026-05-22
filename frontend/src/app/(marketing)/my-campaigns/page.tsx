"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Megaphone, Plus, Users } from "lucide-react";
import { campaignsApi, type CampaignDriveApi } from "@/lib/api";

function formatPeso(value: number) {
  return `₱${Math.round(value).toLocaleString()}`;
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (diffDays <= 0) return "Updated today";
  if (diffDays === 1) return "Updated yesterday";
  return `Updated ${diffDays} days ago`;
}

export default function MyCampaignsPage() {
  const [drives, setDrives] = useState<CampaignDriveApi[]>([]);

  useEffect(() => {
    let active = true;
    campaignsApi
      .mine()
      .then((res) => {
        if (active) setDrives(res.data.data);
      })
      .catch(() => {
        if (active) setDrives([]);
      });
    return () => {
      active = false;
    };
  }, []);

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
          <div style={{fontSize:14,color:'var(--text2)'}}>{drives.length} campaign drives found</div>
          <Link href="/start-campaign" className="btn btn-emerald"><Plus size={15}/> Start Campaign</Link>
        </div>

        {drives.length > 0 ? (
          <div className="campaign-grid">
            {drives.map((drive)=>(
              <div key={drive.id} className="camp-card" style={{cursor:'default'}}>
                <div className={`camp-img ${drive.image_src ? "has-photo" : ""}`}>
                  {drive.image_src ? (
                    <img className="camp-img-photo" src={drive.image_src} alt={drive.title} />
                  ) : (
                    <div className="camp-img-inner"><Megaphone size={44} strokeWidth={1.7} /></div>
                  )}
                  <div style={{position:'absolute',top:12,left:12}}>
                    <span className="badge badge-navy">{drive.category}</span>
                  </div>
                  <div style={{position:'absolute',top:12,right:12}}>
                    <span className={`badge ${drive.status === 'Active' || drive.status === 'Funded' ? 'badge-emerald' : drive.status === 'Draft' ? 'badge-navy' : 'badge-gold'}`}>{drive.status}</span>
                  </div>
                </div>
                <div className="camp-body">
                  <div style={{fontSize:12,color:'var(--text3)',fontFamily:'Space Mono,monospace',marginBottom:8}}>{drive.id.slice(0, 12)}</div>
                  <h3 className="camp-title">{drive.title}</h3>
                  <p className="camp-desc" style={{WebkitLineClamp:1}}>{drive.institution}</p>
                  <div className="camp-meta">
                    <div><div className="camp-raised">{formatPeso(drive.raised_amount)}</div><div className="camp-goal">of {formatPeso(drive.goal_amount)} goal</div></div>
                    <div className="camp-donors"><Users size={12}/> {drive.donors.toLocaleString()} donors</div>
                  </div>
                  <div className="prog-track" style={{height:8}}><div className="prog-fill prog-emerald" style={{width:`${drive.progress}%`}}/></div>
                  <div className="camp-footer">
                    <span style={{fontSize:12,color:'var(--text3)'}}>{formatRelativeDate(drive.updated_at)}</span>
                    <span style={{fontSize:12,color:'var(--canopy)',fontWeight:700}}>{drive.progress}% funded</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-impact-state">
            <Megaphone size={28} color="var(--canopy)" strokeWidth={1.7} />
            <h3>No campaign drives yet</h3>
            <p>Start a verified campaign and it will appear here once saved.</p>
            <Link href="/start-campaign" className="btn btn-emerald">Start Campaign</Link>
          </div>
        )}
      </div>
    </div>
  );
}
