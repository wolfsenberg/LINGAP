import Link from "next/link";
import {
  ArrowRight,
  Award,
  Calendar,
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
import { organizedDrives } from "@/lib/mockCampaignDrives";
import { CAMPAIGNS } from "@/lib/campaigns";

const donationTimeline = [
  {
    amount: "₱5,000",
    campaign: CAMPAIGNS[0].shortTitle,
    sub: `Nov 28 · Milestone 1 released to ${CAMPAIGNS[0].institution}`,
    badge: "badge-emerald",
    badgeText: "Impact Verified",
    escrow: "Released from escrow",
    stellar: "STLR-9F2A-771C",
    done: true,
  },
  {
    amount: "₱2,500",
    campaign: CAMPAIGNS[1].shortTitle,
    sub: `Nov 14 · Funds released to ${CAMPAIGNS[1].institution}`,
    badge: "badge-emerald",
    badgeText: "Impact Verified",
    escrow: "Institution paid",
    stellar: "STLR-4B88-20AE",
    done: true,
  },
  {
    amount: "₱3,000",
    campaign: CAMPAIGNS[2].shortTitle,
    sub: `Nov 5 · Tuition receipt pending ${CAMPAIGNS[2].institution} verification`,
    badge: "badge-gold",
    badgeText: "Pending Proof",
    escrow: "Locked in escrow",
    stellar: "STLR-83AC-541D",
    done: false,
  },
  {
    amount: "₱14,000",
    campaign: "Multiple Campaigns",
    sub: "Oct 2025 · 5 campaigns completed all milestones",
    badge: "badge-emerald",
    badgeText: "All Verified",
    escrow: "Closed cleanly",
    stellar: "STLR-BATCH-1025",
    done: true,
  },
];

export default function DonorPage() {
  const latestDrives = organizedDrives.slice(0, 3);
  const hasMoreDrives = organizedDrives.length > latestDrives.length;

  return (
    <div>
      <div className="donor-hero">
        <div className="container">
          <div className="grid-2" style={{ alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "var(--canopy)", marginBottom: 12 }}>MY IMPACT DASHBOARD</div>
              <h1 style={{ fontSize: 36, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Magandang araw, <span style={{ color: "var(--amber-pale)" }}>Jose!</span></h1>
              <p style={{ color: "rgba(255,255,255,.65)", fontSize: 16, marginBottom: 24 }}>You&apos;ve changed lives. Here&apos;s your verified impact story.</p>
              <div className="donor-stats-row">
                {[
                  { val: "₱24,500", label: "Total Donated", color: "#fff", Icon: Heart },
                  { val: "8", label: "Campaigns Supported", color: "var(--amber-pale)", Icon: Users },
                  { val: "23", label: "Lives Impacted", color: "var(--canopy-light)", Icon: Star },
                  { val: "7", label: "Month Streak", color: "#F87171", Icon: Flame },
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
            <div className="donor-hero-art">
              <img className="donor-wave-img" src="/images/wave.png" alt="" />
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
                  { Icon: Lock, label: "Escrow Locked", value: "₱3,000", sub: "1 pending milestone" },
                  { Icon: ShieldCheck, label: "Escrow Released", value: "₱21,500", sub: "verified institutions only" },
                  { Icon: Network, label: "Stellar Network", value: "Testnet", sub: "public transaction refs" },
                  { Icon: ReceiptText, label: "Proof Status", value: "7 verified", sub: "receipts and documents" },
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
                        <div><div className="camp-raised">{drive.raised}</div><div className="camp-goal">of {drive.goal} goal</div></div>
                        <div className="camp-donors"><Users size={12} /> {drive.donors.toLocaleString()} donors</div>
                      </div>
                      <div className="prog-track" style={{ height: 8 }}><div className="prog-fill prog-emerald" style={{ width: `${drive.progress}%` }} /></div>
                      <div className="camp-footer">
                        <span style={{ fontSize: 12, color: "var(--text3)" }}>{drive.updated}</span>
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
                  { Icon: Heart, bg: "rgba(74,155,106,.1)", iconColor: "var(--canopy)", title: "Hope Giver", sub: "First donation made", earned: true },
                  { Icon: Handshake, bg: "rgba(61,122,82,.1)", iconColor: "var(--forest-light)", title: "Community Hero", sub: "5+ campaigns supported", earned: true },
                  { Icon: Star, bg: "rgba(220,38,38,.1)", iconColor: "#DC2626", title: "Life Saver", sub: "₱10,000+ donated", earned: true },
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
                <span className="badge badge-gold">Nov 2025</span>
              </div>
              <div>
                {[
                  { rank: "1", rankColor: "var(--amber)", name: "Maria Gonzales", loc: "Pasig City · 8 campaigns", amount: "₱45,000", avatarBg: "rgba(200,134,10,.15)", me: false },
                  { rank: "2", rankColor: "var(--ele-gray)", name: "Roberto Cruz", loc: "Makati City · 12 campaigns", amount: "₱38,500", avatarBg: "rgba(74,155,106,.12)", me: false },
                  { rank: "3", rankColor: "var(--earth-light)", name: "Ana Ramos", loc: "QC · 6 campaigns", amount: "₱27,000", avatarBg: "rgba(61,122,82,.1)", me: false },
                  { rank: "4", rankColor: "var(--forest-mid)", name: "Jose Dela Cruz", loc: "You · 7-mo streak", amount: "₱24,500", avatarBg: "rgba(200,134,10,.15)", me: true },
                  { rank: "5", rankColor: "var(--text3)", name: "Liza Santos", loc: "Manila · 4 campaigns", amount: "₱19,800", avatarBg: "rgba(139,92,246,.1)", me: false },
                ].map((lb) => (
                  <div key={lb.name} className="leaderboard-item" style={lb.me ? { background: "rgba(200,134,10,.06)", borderRadius: 10, padding: "12px 8px", borderBottom: "none", border: "1px solid rgba(200,134,10,.2)", marginBottom: 4 } : {}}>
                    <div className="lb-rank" style={{ color: lb.rankColor, fontSize: 15, fontWeight: 800 }}>#{lb.rank}</div>
                    <div className="lb-avatar" style={{ background: lb.avatarBg }}>
                      <Users size={16} color={lb.me ? "var(--amber)" : "var(--text3)"} strokeWidth={1.8} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="lb-name" style={lb.me ? { color: "var(--forest-light)" } : {}}>{lb.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text3)" }}>{lb.loc}</div>
                    </div>
                    <div className="lb-amount">{lb.amount}</div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
