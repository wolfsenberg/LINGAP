"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Flame,
  Handshake,
  Heart,
  Landmark,
  Lock,
  Megaphone,
  Network,
  Plus,
  ReceiptText,
  ShieldCheck,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import {
  campaignsApi,
  donationsApi,
  donorsApi,
  type CampaignDriveApi,
  type LeaderboardDonorApi,
} from "@/lib/api";
import { CAMPAIGNS } from "@/lib/campaigns";
import { getFirstName } from "@/lib/userName";
import { useAuthStore } from "@/store/authStore";
import type { Donation } from "@/types";

const XLM_TO_PHP = 10;

function formatPeso(value: number) {
  return `₱${Math.round(value).toLocaleString()}`;
}

function formatXlm(value: number) {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 7 })} XLM`;
}

function formatDate(value?: string | null) {
  if (!value) return "No activity yet";
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (diffDays <= 0) return "Updated today";
  if (diffDays === 1) return "Updated yesterday";
  return `Updated ${diffDays} days ago`;
}

function campaignNameFromPurpose(purpose?: string) {
  const slug = purpose?.replace("campaign:", "");
  return CAMPAIGNS.find((campaign) => campaign.slug === slug)?.shortTitle || slug || "LINGAP campaign";
}

export default function DonorPage() {
  const user = useAuthStore((state) => state.user);
  const firstName = getFirstName(user?.name);
  const [drives, setDrives] = useState<CampaignDriveApi[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardDonorApi[]>([]);
  const [impact, setImpact] = useState({
    total_donated: 0,
    campaigns_helped: 0,
    lives_impacted: 0,
  });

  useEffect(() => {
    let active = true;

    async function loadImpactData() {
      try {
        const [campaignRes, donationRes, leaderboardRes, impactRes] = await Promise.all([
          campaignsApi.mine(),
          donationsApi.mine(1, 10),
          donorsApi.leaderboard(10),
          donorsApi.myImpact(),
        ]);
        if (!active) return;
        setDrives(campaignRes.data.data);
        setDonations(donationRes.data.items);
        setLeaderboard(leaderboardRes.data.data);
        setImpact(impactRes.data.data);
      } catch {
        if (!active) return;
        setDrives([]);
        setDonations([]);
        setLeaderboard([]);
      }
    }

    loadImpactData();
    return () => {
      active = false;
    };
  }, []);

  const latestDrives = drives.slice(0, 3);
  const hasMoreDrives = drives.length > latestDrives.length;
  const totalDonatedPhp = impact.total_donated * XLM_TO_PHP;
  const verifiedDonations = donations.filter((donation) => donation.blockchainConfirmed);
  const releasedPhp = verifiedDonations.reduce((sum, donation) => sum + donation.amount * XLM_TO_PHP, 0);
  const lockedPhp = Math.max(totalDonatedPhp - releasedPhp, 0);

  const donationTimeline = useMemo(
    () =>
      donations.map((donation) => ({
        amount: formatXlm(donation.amount),
        campaign: campaignNameFromPurpose(donation.purpose),
        sub: `${formatDate(donation.createdAt)} · ${
          donation.blockchainConfirmed ? "Stellar transaction confirmed" : "Waiting for Stellar verification"
        }`,
        badge: donation.blockchainConfirmed ? "badge-emerald" : "badge-gold",
        badgeText: donation.blockchainConfirmed ? "Verified" : "Pending",
        escrow: donation.disbursed ? "Released from escrow" : "Tracked in donation vault",
        stellar: donation.stellarTxHash
          ? `${donation.stellarTxHash.slice(0, 10)}...${donation.stellarTxHash.slice(-6)}`
          : "No tx hash",
        done: donation.blockchainConfirmed,
      })),
    [donations]
  );

  return (
    <div>
      <div className="donor-hero">
        <div className="container">
          <div className="donor-hero-grid">
            <div className="donor-hero-art">
              <img className="donor-wave-img" src="/images/wave.png" alt="" />
            </div>
            <div className="donor-hero-content">
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "var(--canopy)", marginBottom: 12 }}>MY IMPACT DASHBOARD</div>
              <h1 style={{ fontSize: 36, fontWeight: 800, color: "#fff", marginBottom: 8 }}>
                Magandang araw, <span style={{ color: "var(--amber-pale)" }}>{firstName}!</span>
              </h1>
              <p style={{ color: "rgba(255,255,255,.65)", fontSize: 16, marginBottom: 24 }}>You've changed lives. Here's your verified impact story.</p>
              <div className="donor-stats-row">
                {[
                  { val: formatPeso(totalDonatedPhp), label: "Total Donated", color: "#fff", Icon: Heart },
                  { val: impact.campaigns_helped.toLocaleString(), label: "Campaigns Supported", color: "var(--amber-pale)", Icon: Users },
                  { val: impact.lives_impacted.toLocaleString(), label: "Lives Impacted", color: "var(--canopy-light)", Icon: Star },
                  { val: donations.length > 0 ? "1" : "0", label: "Month Streak", color: "#F87171", Icon: Flame },
                ].map((s) => (
                  <div key={s.label} className="donor-stat-card">
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
                      <s.Icon size={16} color={s.color} strokeWidth={1.8} />
                    </div>
                    <div style={{ fontFamily: "Sora,sans-serif", fontSize: 28, fontWeight: 800, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-inner">
        <div className="impact-dashboard-grid">
          <main className="impact-main-stack">
            <section id="my-donations" className="impact-panel impact-panel-focus">
              <div className="impact-panel-head">
                <div>
                  <div className="section-label">MY DONATIONS</div>
                  <h2 className="impact-panel-title">Donation transparency trail</h2>
                  <p className="impact-panel-copy">A clear view of where your donations sit, which milestones unlocked funds, and the Stellar references donors can verify.</p>
                </div>
                <Link href="/certificate" className="btn btn-outline">
                  View Certificates <ArrowRight size={15} />
                </Link>
              </div>

              <div className="transparency-grid">
                {[
                  { Icon: Lock, label: "Escrow Locked", value: formatPeso(lockedPhp), sub: "pending verification" },
                  { Icon: ShieldCheck, label: "Escrow Released", value: formatPeso(releasedPhp), sub: "verified transactions only" },
                  { Icon: Network, label: "Stellar Network", value: "Testnet", sub: "public transaction refs" },
                  { Icon: ReceiptText, label: "Proof Status", value: `${verifiedDonations.length} verified`, sub: "receipts and documents" },
                ].map((item) => (
                  <div key={item.label} className="transparency-card">
                    <div className="transparency-icon"><item.Icon size={17} strokeWidth={1.8} /></div>
                    <div className="transparency-label">{item.label}</div>
                    <div className="transparency-value">{item.value}</div>
                    <div className="transparency-sub">{item.sub}</div>
                  </div>
                ))}
              </div>

              <div className="donation-timeline">
                {donationTimeline.map((item) => (
                  <div key={item.stellar} className="donation-row">
                    <div className={`donation-dot ${item.done ? "is-done" : "is-pending"}`} />
                    <div className="donation-main">
                      <div className="donation-title">{item.amount} → {item.campaign}</div>
                      <div className="donation-sub">{item.sub}</div>
                      <div className="donation-proof-row">
                        <span><Landmark size={12} /> {item.escrow}</span>
                        <span><Network size={12} /> {item.stellar}</span>
                      </div>
                    </div>
                    <span className={`badge ${item.badge}`}>{item.badgeText}</span>
                  </div>
                ))}
                {donationTimeline.length === 0 && (
                  <div className="empty-impact-state">
                    <Heart size={28} color="var(--canopy)" strokeWidth={1.7} />
                    <h3>No donations yet</h3>
                    <p>Your verified donation timeline will appear here after your first contribution.</p>
                    <Link href="/discover" className="btn btn-emerald">Donate Now</Link>
                  </div>
                )}
              </div>
            </section>

            <section id="organized-drives" className="impact-panel impact-panel-focus">
              <div className="impact-panel-head">
                <div>
                  <div className="section-label">MY CAMPAIGN DRIVES</div>
                  <h2 className="impact-panel-title">Campaigns you organized</h2>
                  <p className="impact-panel-copy">Latest verified drives you created or manage.</p>
                </div>
                <div className="flex gap-8" style={{ flexWrap: "wrap" }}>
                  {hasMoreDrives && (
                    <Link href="/my-campaigns" className="btn btn-outline">
                      View More <ArrowRight size={15} />
                    </Link>
                  )}
                  <Link href="/start-campaign" className="btn btn-emerald">
                    <Plus size={15} /> Start Campaign
                  </Link>
                </div>
              </div>

              <div className="campaign-grid">
                {latestDrives.map((drive) => (
                  <div key={drive.id} className="camp-card" style={{ cursor: "default" }}>
                    <div className="camp-body">
                      <div className="flex flex-center flex-between mb-12">
                        <span className="badge badge-navy">{drive.category}</span>
                        <span className={`badge ${drive.status === "Active" || drive.status === "Funded" ? "badge-emerald" : drive.status === "Draft" ? "badge-navy" : "badge-gold"}`}>{drive.status}</span>
                      </div>
                      <h3 className="camp-title">{drive.title}</h3>
                      <p className="camp-desc" style={{ WebkitLineClamp: 1 }}>{drive.institution}</p>
                      <div className="camp-meta">
                        <div><div className="camp-raised">{formatPeso(drive.raised_amount)}</div><div className="camp-goal">of {formatPeso(drive.goal_amount)} goal</div></div>
                        <div className="camp-donors"><Users size={12} /> {drive.donors.toLocaleString()} donors</div>
                      </div>
                      <div className="prog-track" style={{ height: 8 }}><div className="prog-fill prog-emerald" style={{ width: `${drive.progress}%` }} /></div>
                      <div className="camp-footer">
                        <span style={{ fontSize: 12, color: "var(--text3)" }}>{formatRelativeDate(drive.updated_at)}</span>
                        <span style={{ fontSize: 12, color: "var(--canopy)", fontWeight: 700 }}>{drive.progress}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {latestDrives.length === 0 && (
                <div className="empty-impact-state">
                  <Megaphone size={28} color="var(--canopy)" strokeWidth={1.7} />
                  <h3>No campaign drives yet</h3>
                  <p>Start a verified campaign and it will appear here once saved.</p>
                  <Link href="/start-campaign" className="btn btn-emerald">Start Campaign</Link>
                </div>
              )}
            </section>

            <section id="impact-certificates" className="impact-certificate-callout">
              <div>
                <div className="section-label">IMPACT CERTIFICATES</div>
                <h2 className="impact-panel-title">Your verified giving archive</h2>
                <p className="impact-panel-copy">Browse every certificate you have earned from completed milestones, print a formal copy, download it as PDF, or share the verified Stellar record.</p>
              </div>
              <Link href="/certificate" className="btn btn-emerald">
                View My Certificates <ArrowRight size={15} />
              </Link>
            </section>
          </main>

          <aside className="impact-sidebar">
            <section className="impact-panel">
              <h3 className="sidebar-title">
                <Trophy size={18} color="var(--amber)" strokeWidth={1.8} /> Achievement Badges
              </h3>
              <div className="achievement-grid">
                {[
                  { Icon: Heart, bg: "rgba(74,155,106,.1)", iconColor: "var(--canopy)", title: "Hope Giver", sub: "First donation made", earned: donations.length > 0 },
                  { Icon: Handshake, bg: "rgba(61,122,82,.1)", iconColor: "var(--forest-light)", title: "Community Hero", sub: "5+ campaigns supported", earned: impact.campaigns_helped >= 5 },
                  { Icon: Star, bg: "rgba(220,38,38,.1)", iconColor: "#DC2626", title: "Life Saver", sub: "₱10,000+ donated", earned: totalDonatedPhp >= 10000 },
                  { Icon: Award, bg: "rgba(200,134,10,.1)", iconColor: "var(--amber)", title: "Verified Humanitarian", sub: "12-month streak needed", earned: false },
                ].map((a) => (
                  <div key={a.title} className="achievement-card" style={{ opacity: a.earned ? 1 : 0.5 }}>
                    <div className="ach-icon" style={{ background: a.bg }}><a.Icon size={24} color={a.iconColor} strokeWidth={1.8} /></div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--forest)" }}>{a.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>{a.sub}</div>
                    <span className={`badge ${a.earned ? "badge-emerald" : "badge-navy"}`} style={{ fontSize: 10, marginTop: 8 }}>{a.earned ? "Earned" : "Locked"}</span>
                  </div>
                ))}
              </div>
              <Link href="/certificate" className="btn btn-outline" style={{ width: "100%", justifyContent: "center", marginTop: 16 }}>
                <Award size={15} /> Open Certificate Gallery
              </Link>
            </section>

            <section className="impact-panel">
              <div className="flex flex-center flex-between mb-20">
                <h3 className="sidebar-title" style={{ marginBottom: 0 }}>
                  <Trophy size={18} color="var(--amber)" strokeWidth={1.8} /> Community Leaderboard
                </h3>
                <span className="badge badge-gold">
                  {new Intl.DateTimeFormat("en-PH", { month: "short", year: "numeric" }).format(new Date())}
                </span>
              </div>
              <div>
                {leaderboard.map((lb) => {
                  const isMe = lb.user_id === user?.id;
                  return (
                    <div key={lb.user_id} className="leaderboard-item" style={isMe ? { background: "rgba(200,134,10,.06)", borderRadius: 10, padding: "12px 8px", borderBottom: "none", border: "1px solid rgba(200,134,10,.2)", marginBottom: 4 } : {}}>
                      <div className="lb-rank" style={{ color: lb.rank === 1 ? "var(--amber)" : "var(--text3)", fontSize: 15, fontWeight: 800 }}>#{lb.rank}</div>
                      <div className="lb-avatar" style={{ background: isMe ? "rgba(200,134,10,.15)" : "rgba(74,155,106,.12)" }}>
                        <Users size={16} color={isMe ? "var(--amber)" : "var(--text3)"} strokeWidth={1.8} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="lb-name" style={isMe ? { color: "var(--forest-light)" } : {}}>{lb.name}</div>
                        <div style={{ fontSize: 12, color: "var(--text3)" }}>{isMe ? "You" : `${lb.donation_count} donation${lb.donation_count === 1 ? "" : "s"}`} · {formatDate(lb.last_donation_at)}</div>
                      </div>
                      <div className="lb-amount">{formatXlm(lb.total_donated)}</div>
                    </div>
                  );
                })}
                {leaderboard.length === 0 && (
                  <div className="empty-impact-state">
                    <Trophy size={28} color="var(--amber)" strokeWidth={1.7} />
                    <h3>No leaderboard yet</h3>
                    <p>Verified donors will appear here after the first synced donation.</p>
                  </div>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
