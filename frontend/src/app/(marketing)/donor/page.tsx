"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { donorsApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface LeaderboardEntry {
  rank: number;
  name: string;
  total_donated: number;
  donation_count: number;
}

interface ImpactData {
  name: string;
  total_donated: number;
  campaigns_helped: number;
  lives_impacted: number;
}

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

export default function DonorPage() {
  const { isAuthenticated, user } = useAuthStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [impact, setImpact] = useState<ImpactData | null>(null);
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [loadingImpact, setLoadingImpact] = useState(true);

  useEffect(() => {
    donorsApi.leaderboard(10)
      .then((r) => setLeaderboard(r.data.data))
      .catch(() => setLeaderboard([]))
      .finally(() => setLoadingBoard(false));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) { setLoadingImpact(false); return; }
    donorsApi.myImpact()
      .then((r) => setImpact(r.data.data))
      .catch(() => setImpact(null))
      .finally(() => setLoadingImpact(false));
  }, [isAuthenticated]);

  const displayName = impact?.name ?? user?.name ?? "Donor";
  const totalDonated = impact?.total_donated ?? 0;
  const campaignsHelped = impact?.campaigns_helped ?? 0;
  const livesImpacted = impact?.lives_impacted ?? 0;

  const myRank = leaderboard.findIndex(
    (e) => e.name === displayName
  ) + 1;

  return (
    <div>
      <div className="donor-hero">
        <div className="container">
          <div className="grid-2" style={{ alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "var(--emerald)", marginBottom: 12 }}>
                MY IMPACT DASHBOARD
              </div>
              <h1 style={{ fontSize: 36, fontWeight: 800, color: "#fff", marginBottom: 8 }}>
                Magandang araw,{" "}
                <span style={{ color: "var(--gold)" }}>
                  {loadingImpact ? "…" : `${displayName.split(" ")[0]}! 🎉`}
                </span>
              </h1>
              <p style={{ color: "rgba(255,255,255,.65)", fontSize: 16, marginBottom: 24 }}>
                {isAuthenticated
                  ? "You've changed lives. Here's your verified impact story."
                  : "Log in to see your personal impact story."}
              </p>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {[
                  { val: loadingImpact ? "…" : `₱${totalDonated.toLocaleString()}`, label: "Total Donated", color: "#fff" },
                  { val: loadingImpact ? "…" : String(campaignsHelped), label: "Campaigns Supported", color: "var(--gold)" },
                  { val: loadingImpact ? "…" : String(livesImpacted), label: "Lives Impacted", color: "var(--emerald)" },
                  { val: myRank > 0 ? `#${myRank}` : "—", label: "Leaderboard Rank", color: "#F87171" },
                ].map((s) => (
                  <div key={s.label} style={{ textAlign: "center", background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 12, padding: "20px 28px" }}>
                    <div style={{ fontFamily: "Sora,sans-serif", fontSize: 28, fontWeight: 800, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-center" style={{ display: "flex", justifyContent: "flex-end" }}>
              <svg width="200" height="240" viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: "drop-shadow(0 12px 30px rgba(0,0,0,.3))" }}>
                <ellipse cx="100" cy="224" rx="70" ry="16" fill="rgba(16,184,145,0.12)" />
                <rect x="20" y="10" width="8" height="8" rx="2" fill="#FFDD57" transform="rotate(20 20 10)" />
                <rect x="160" y="20" width="8" height="8" rx="2" fill="#EF4444" transform="rotate(-15 160 20)" />
                <rect x="170" y="60" width="6" height="6" rx="1" fill="#10B891" transform="rotate(30 170 60)" />
                <rect x="15" y="70" width="6" height="6" rx="1" fill="#3B82F6" transform="rotate(-20 15 70)" />
                <rect x="140" y="5" width="5" height="10" rx="2" fill="#F4A6B2" transform="rotate(10 140 5)" />
                <rect x="4" y="148" width="36" height="20" rx="10" fill="#9AA3B2" transform="rotate(-40 4 148)" />
                <rect x="160" y="148" width="36" height="20" rx="10" fill="#9AA3B2" transform="rotate(40 160 148)" />
                <rect x="14" y="52" width="36" height="54" rx="11" fill="#4B5563" />
                <rect x="20" y="60" width="24" height="40" rx="9" fill="#F4A6B2" />
                <rect x="150" y="52" width="36" height="54" rx="11" fill="#4B5563" />
                <rect x="156" y="60" width="24" height="40" rx="9" fill="#F4A6B2" />
                <rect x="42" y="28" width="116" height="100" rx="30" fill="#9AA3B2" />
                <rect x="56" y="32" width="88" height="44" rx="22" fill="rgba(255,255,255,0.1)" />
                <rect x="58" y="72" width="28" height="32" rx="14" fill="#1a1a2e" />
                <rect x="114" y="72" width="28" height="32" rx="14" fill="#1a1a2e" />
                <rect x="64" y="78" width="8" height="8" rx="4" fill="white" />
                <rect x="120" y="78" width="8" height="8" rx="4" fill="white" />
                <rect x="62" y="108" width="76" height="10" rx="5" fill="rgba(26,26,46,0.3)" />
                <rect x="46" y="98" width="22" height="14" rx="7" fill="#F4A6B2" fillOpacity="0.5" />
                <rect x="132" y="98" width="22" height="14" rx="7" fill="#F4A6B2" fillOpacity="0.5" />
                <rect x="90" y="124" width="20" height="10" rx="5" fill="#8B939F" />
                <rect x="84" y="130" width="16" height="10" rx="5" fill="#9AA3B2" />
                <rect x="80" y="136" width="12" height="8" rx="4" fill="#8B939F" />
                <rect x="38" y="154" width="124" height="62" rx="18" fill="#1E3A8A" />
                <rect x="6" y="160" width="34" height="18" rx="9" fill="#9AA3B2" transform="rotate(-35 6 160)" />
                <rect x="160" y="160" width="34" height="18" rx="9" fill="#9AA3B2" transform="rotate(35 160 160)" />
                <rect x="80" y="172" width="40" height="22" rx="6" fill="#FFDD57" />
                <rect x="84" y="167" width="10" height="10" rx="5" fill="#FFDD57" />
                <rect x="106" y="167" width="10" height="10" rx="5" fill="#FFDD57" />
                <rect x="54" y="204" width="36" height="26" rx="11" fill="#9AA3B2" />
                <rect x="110" y="204" width="36" height="26" rx="11" fill="#9AA3B2" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="page-inner">
        <div className="grid-2 mb-28" style={{ alignItems: "start", gap: 24 }}>

          {/* Achievements */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--navy)", marginBottom: 20 }}>🏆 Achievement Badges</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
              {[
                { icon: "💙", bg: "rgba(16,184,145,.1)", title: "Hope Giver", sub: "First donation made", earned: campaignsHelped >= 1 },
                { icon: "🤝", bg: "rgba(37,99,235,.1)", title: "Community Hero", sub: "5+ campaigns supported", earned: campaignsHelped >= 5 },
                { icon: "❤️", bg: "rgba(239,68,68,.1)", title: "Life Saver", sub: "₱10,000+ donated", earned: totalDonated >= 10000 },
                { icon: "🌟", bg: "rgba(245,158,11,.1)", title: "Verified Humanitarian", sub: "₱50,000+ donated", earned: totalDonated >= 50000 },
              ].map((a) => (
                <div key={a.title} className="achievement-card" style={{ opacity: a.earned ? 1 : 0.5 }}>
                  <div className="ach-icon" style={{ background: a.bg }}>{a.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)" }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)" }}>{a.sub}</div>
                  <span className={`badge ${a.earned ? "badge-emerald" : "badge-navy"}`} style={{ fontSize: 10, marginTop: 8 }}>
                    {a.earned ? "Earned" : "Locked"}
                  </span>
                </div>
              ))}
            </div>
            <Link href="/certificate" className="btn btn-emerald" style={{ width: "100%", justifyContent: "center", marginTop: 16, display: "flex" }}>
              🎖️ View My Impact Certificate
            </Link>
          </div>

          {/* Leaderboard */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 24 }}>
            <div className="flex flex-center flex-between mb-20">
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--navy)" }}>🏅 Donor Recognition Wall</h3>
              <span className="badge badge-gold">Top Contributors</span>
            </div>

            {loadingBoard ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text3)", fontSize: 14 }}>Loading…</div>
            ) : leaderboard.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text3)", fontSize: 14 }}>
                No donations yet. Be the first! 🎉
              </div>
            ) : (
              <div>
                {leaderboard.map((entry) => {
                  const isMe = isAuthenticated && entry.name === displayName;
                  const medal = entry.rank <= 3 ? RANK_MEDALS[entry.rank - 1] : `#${entry.rank}`;
                  const rankColor = entry.rank === 1 ? "var(--gold-dark)" : entry.rank === 2 ? "#9AA3B2" : entry.rank === 3 ? "#D97706" : "var(--navy-mid)";
                  return (
                    <div
                      key={entry.rank}
                      className="leaderboard-item"
                      style={isMe ? { background: "rgba(255,221,87,.06)", borderRadius: 10, padding: "12px 8px", borderBottom: "none", border: "1px solid rgba(255,221,87,.25)", marginBottom: 4 } : {}}
                    >
                      <div className="lb-rank" style={{ color: rankColor }}>{medal}</div>
                      <div className="lb-avatar" style={{ background: "rgba(16,184,145,.12)", fontSize: 18 }}>
                        {isMe ? "⭐" : "👤"}
                      </div>
                      <div>
                        <div className="lb-name" style={isMe ? { color: "var(--emerald-dark)" } : {}}>
                          {entry.name}{isMe ? " (You!)" : ""}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text3)" }}>
                          {entry.donation_count} donation{entry.donation_count !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <div className="lb-amount">₱{entry.total_donated.toLocaleString()}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Impact summary */}
        {isAuthenticated && (
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 28 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--navy)", marginBottom: 20 }}>📊 Your Impact Summary</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
              {[
                { icon: "💰", label: "Total Donated", val: loadingImpact ? "…" : `₱${totalDonated.toLocaleString()}`, color: "var(--navy)" },
                { icon: "📋", label: "Campaigns Helped", val: loadingImpact ? "…" : String(campaignsHelped), color: "var(--emerald)" },
                { icon: "❤️", label: "Lives Impacted (est.)", val: loadingImpact ? "…" : String(livesImpacted), color: "#EF4444" },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: "center", background: "var(--bg)", borderRadius: "var(--r-sm)", padding: "24px 16px", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontFamily: "Sora,sans-serif", fontSize: 28, fontWeight: 800, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 13, color: "var(--text3)", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, padding: "14px 18px", background: "rgba(16,184,145,.06)", border: "1px solid rgba(16,184,145,.2)", borderRadius: "var(--r-sm)", fontSize: 13, color: "var(--emerald-dark)" }}>
              💡 Lives impacted is estimated at 1 per ₱2,000 donated. Every peso you give goes directly to verified beneficiaries through LINGAP&apos;s escrow system.
            </div>
          </div>
        )}

        {!isAuthenticated && (
          <div style={{ textAlign: "center", padding: "40px 24px", background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--r)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--navy)", marginBottom: 8 }}>See Your Personal Impact</div>
            <p style={{ fontSize: 14, color: "var(--text2)", marginBottom: 20 }}>Log in to track your total donations, campaigns helped, and lives impacted.</p>
            <Link href="/login" className="btn btn-emerald">Login to View Impact</Link>
          </div>
        )}
      </div>
    </div>
  );
}
