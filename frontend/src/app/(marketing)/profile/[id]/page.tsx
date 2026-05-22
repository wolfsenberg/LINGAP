"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Heart,
  Megaphone,
  Network,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import { profilesApi, type PublicProfileApi } from "@/lib/api";
import { formatLedgerReference, getStellarExpertContractUrl, getStellarExpertTxUrl, isStellarTxHash } from "@/lib/stellar";
import SafeImageFrame from "@/components/campaign/SafeImageFrame";

function formatPeso(value: number) {
  return `₱${Math.round(value).toLocaleString()}`;
}

function formatXlm(value: number) {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} XLM`;
}

function formatDate(value?: string | null) {
  if (!value) return "No public activity yet";
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function shortHash(hash: string) {
  const value = formatLedgerReference(hash);
  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params?.id as string;
  const [profile, setProfile] = useState<PublicProfileApi | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      setLoading(true);
      try {
        const res = await profilesApi.get(userId);
        if (active) setProfile(res.data.data);
      } catch {
        if (active) setProfile(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    if (userId) loadProfile();
    return () => {
      active = false;
    };
  }, [userId]);

  const earnedBadges = useMemo(
    () => profile?.badges.filter((badge) => badge.earned) ?? [],
    [profile]
  );

  if (loading) {
    return (
      <div className="page-inner">
        <div className="empty-impact-state">Loading public profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page-inner">
        <div className="empty-impact-state">
          <Users size={30} color="var(--canopy)" />
          <h3>Profile not found</h3>
          <p>This public profile does not exist or is not available.</p>
          <Link href="/community" className="btn btn-emerald">Back to Community</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="profile-hero">
        <div className="container profile-hero-grid">
          <div>
            <Link href="/community" className="btn btn-outline btn-sm profile-back">
              Back to Community
            </Link>
            <div className="profile-identity">
              <div className="profile-avatar profile-avatar-lg">
                {profile.user.display_name.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div className="section-label" style={{ color: "var(--canopy-light)" }}>
                  PUBLIC IMPACT PROFILE
                </div>
                <h1>{profile.user.display_name}</h1>
                <div className="profile-hero-meta">
                  <span><BadgeCheck size={14} /> {profile.user.role.replace("_", " ")}</span>
                  <span><Calendar size={14} /> Joined {formatDate(profile.user.joined_at)}</span>
                  <span><Trophy size={14} /> {profile.impact.community_rank ? `Rank #${profile.impact.community_rank}` : "Unranked"}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="profile-hero-card">
            <ShieldCheck size={20} color="var(--canopy)" />
            <strong>Public-safe profile</strong>
            <span>No private dashboard controls, emails, or hidden certificates are shown.</span>
          </div>
        </div>
      </div>

      <div className="page-inner">
        <div className="profile-impact-grid">
          {[
            { Icon: Heart, label: "Public Donations", value: formatPeso(profile.impact.total_donated_php), sub: formatXlm(profile.impact.total_donated_xlm) },
            { Icon: Megaphone, label: "Campaigns Organized", value: profile.impact.campaigns_organized.toString(), sub: `${profile.impact.active_campaigns} active · ${profile.impact.completed_campaigns} completed` },
            { Icon: Award, label: "Public Certificates", value: profile.impact.public_certificates.toString(), sub: `${earnedBadges.length} earned badges` },
            { Icon: Network, label: "Stellar Activity", value: profile.impact.donation_count.toString(), sub: formatDate(profile.impact.last_activity_at) },
          ].map((item) => (
            <div key={item.label} className="stat-card">
              <div className="flex flex-center flex-between mb-8">
                <div className="stat-label">{item.label}</div>
                <item.Icon size={16} color="var(--canopy)" strokeWidth={1.8} />
              </div>
              <div className="stat-value">{item.value}</div>
              <div className="stat-change">{item.sub}</div>
            </div>
          ))}
        </div>

        <div className="profile-layout">
          <main className="impact-main-stack">
            <section className="impact-panel">
              <div className="impact-panel-head">
                <div>
                  <div className="section-label">CAMPAIGNS ORGANIZED</div>
                  <h2 className="impact-panel-title">Public campaign drives</h2>
                  <p className="impact-panel-copy">
                    Campaigns this user publicly organizes or manages on LINGAP.
                  </p>
                </div>
              </div>

              {profile.campaigns.length === 0 ? (
                <div className="empty-impact-state">
                  <Megaphone size={28} color="var(--canopy)" />
                  <h3>No public campaigns yet</h3>
                  <p>Campaigns created by this user will appear here once public.</p>
                </div>
              ) : (
                <div className="campaign-grid">
                  {profile.campaigns.map((campaign) => (
                    <Link key={campaign.id} href={`/detail/${campaign.slug}`} className="camp-card profile-campaign-card">
                      <SafeImageFrame
                        src={campaign.image_src}
                        alt={campaign.title}
                        className="camp-img"
                        photoClassName="camp-img-photo"
                        fallback={<div className="camp-img-inner"><Megaphone size={44} strokeWidth={1.7} /></div>}
                      >
                        <div style={{ position: "absolute", top: 12, right: 12 }}>
                          <span className="badge badge-emerald">{campaign.status}</span>
                        </div>
                      </SafeImageFrame>
                      <div className="camp-body">
                        <h3 className="camp-title">{campaign.title}</h3>
                        <p className="camp-desc">{campaign.description}</p>
                        <div className="camp-meta">
                          <div>
                            <div className="camp-raised">{campaign.raised_label}</div>
                            <div className="camp-goal">of {campaign.goal_label} goal</div>
                          </div>
                          <div className="camp-donors"><Users size={12} /> {campaign.donors} donors</div>
                        </div>
                        <div className="prog-track" style={{ height: 8 }}>
                          <div className="prog-fill prog-emerald" style={{ width: `${campaign.progress}%` }} />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="impact-panel">
              <div className="section-label">PUBLIC STELLAR ACTIVITY</div>
              <h2 className="impact-panel-title">Verified activity trail</h2>
              <div className="donation-timeline mt-16">
                {profile.activity.length === 0 ? (
                  <div className="empty-impact-state">
                    <Network size={28} color="var(--canopy)" />
                    <h3>No public Stellar activity yet</h3>
                    <p>Confirmed public donations will appear here.</p>
                  </div>
                ) : (
                  profile.activity.map((item) => (
                    <a
                      key={item.id}
                      href={isStellarTxHash(item.stellar_tx_hash) ? getStellarExpertTxUrl(item.stellar_tx_hash) : getStellarExpertContractUrl() || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="donation-row profile-activity-row"
                    >
                      <div className="donation-dot is-done" />
                      <div className="donation-main">
                        <div className="donation-title">{formatXlm(item.amount)} → {item.campaign_id}</div>
                        <div className="donation-sub">{formatDate(item.created_at)}</div>
                        <div className="donation-proof-row">
                          <span><Network size={12} /> {shortHash(item.stellar_tx_hash)}</span>
                        </div>
                      </div>
                      <span className="badge badge-emerald">
                        {isStellarTxHash(item.stellar_tx_hash) ? "Stellar" : "Ledger"} <ExternalLink size={10} />
                      </span>
                    </a>
                  ))
                )}
              </div>
            </section>
          </main>

          <aside className="impact-sidebar">
            <section className="impact-panel achievement-panel">
              <h3 className="sidebar-title">
                <Trophy size={18} color="var(--amber)" /> Community Badges
              </h3>
              <div className="achievement-grid">
                {profile.badges.map((badge) => (
                  <div key={badge.title} className="achievement-card" style={{ opacity: badge.earned ? 1 : 0.5 }}>
                    <div className="ach-icon" style={{ background: badge.earned ? "rgba(74,155,106,.1)" : "rgba(89,102,94,.08)" }}>
                      <CheckCircle2 size={22} color={badge.earned ? "var(--canopy)" : "var(--text3)"} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--forest)" }}>{badge.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>{badge.description}</div>
                    <span className={`badge ${badge.earned ? "badge-emerald" : "badge-gray"}`}>
                      {badge.earned ? "Earned" : "Locked"}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="impact-panel">
              <h3 className="sidebar-title">
                <Award size={18} color="var(--amber)" /> Public Certificates
              </h3>
              {profile.certificates.length === 0 ? (
                <div className="empty-impact-state">
                  <Award size={26} color="var(--amber)" />
                  <h3>No public certificates</h3>
                  <p>This user has not shared certificates publicly yet.</p>
                </div>
              ) : (
                <div className="profile-cert-list">
                  {profile.certificates.map((cert) => (
                    <div key={cert.id} className="profile-cert-item">
                      <strong>{cert.beneficiary_name}</strong>
                      <span>{formatXlm(cert.amount)} · {cert.lives_touched} lives touched</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
