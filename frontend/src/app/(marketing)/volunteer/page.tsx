"use client";

import { useState, useEffect } from "react";
import { volunteerApi, type VolunteerOpportunity } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { CAMPAIGNS } from "@/lib/campaigns";
import toast from "react-hot-toast";

const CATEGORIES = [
  { value: "", label: "All", icon: "🌟" },
  { value: "medical", label: "Medical", icon: "🏥" },
  { value: "legal", label: "Legal", icon: "⚖️" },
  { value: "tech", label: "Tech", icon: "💻" },
  { value: "logistics", label: "Logistics", icon: "🚚" },
  { value: "teaching", label: "Teaching", icon: "📚" },
  { value: "counseling", label: "Counseling", icon: "🧠" },
  { value: "construction", label: "Construction", icon: "🔨" },
  { value: "other", label: "Other", icon: "🤝" },
];

const CATEGORY_COLORS: Record<string, string> = {
  medical: "rgba(239,68,68,.1)",
  legal: "rgba(37,99,235,.1)",
  tech: "rgba(139,92,246,.1)",
  logistics: "rgba(245,158,11,.1)",
  teaching: "rgba(16,184,145,.1)",
  counseling: "rgba(236,72,153,.1)",
  construction: "rgba(234,88,12,.1)",
  other: "rgba(13,27,42,.06)",
};

const SAMPLE_OPPORTUNITIES: VolunteerOpportunity[] = [
  {
    id: "sample-1",
    organizer_name: "LINGAP Team",
    campaign_name: CAMPAIGNS[0].shortTitle,
    title: "Medical Volunteer — Chemo Companion",
    description: `Accompany cancer patients to their chemotherapy sessions at ${CAMPAIGNS[0].institution}. Provide emotional support and help coordinate logistics. No medical license required — just a kind heart.`,
    category: "medical",
    skills_needed: ["Empathy", "Patient Care", "Communication"],
    location: `${CAMPAIGNS[0].institution}, ${CAMPAIGNS[0].location}`,
    schedule: "Weekdays · 8AM–2PM · Flexible",
    slots: 10,
    slots_filled: 4,
    slots_remaining: 6,
    status: "open",
    urgent: true,
    my_signup_status: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "sample-2",
    organizer_name: "LINGAP Team",
    campaign_name: CAMPAIGNS[1].shortTitle,
    title: "Disaster Relief Logistics Coordinator",
    description: `Help organize and distribute relief goods to affected families in ${CAMPAIGNS[1].location}. Coordinate with LGUs and volunteer groups.`,
    category: "logistics",
    skills_needed: ["Project Management", "Driving", "Communication"],
    location: CAMPAIGNS[1].location,
    schedule: "Dec 7–10, 2025 · Full Day",
    slots: 15,
    slots_filled: 9,
    slots_remaining: 6,
    status: "open",
    urgent: true,
    my_signup_status: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "sample-3",
    organizer_name: "LINGAP Team",
    campaign_name: CAMPAIGNS[2].shortTitle,
    title: "Tutoring Volunteer — Math & Science",
    description: "Provide weekly tutoring sessions for scholar students preparing for entrance exams. Online or in-person in QC.",
    category: "teaching",
    skills_needed: ["Mathematics", "Science", "Teaching"],
    location: `${CAMPAIGNS[2].institution} area (Remote OK)`,
    schedule: "Saturdays · 9AM–12PM",
    slots: 5,
    slots_filled: 2,
    slots_remaining: 3,
    status: "open",
    urgent: false,
    my_signup_status: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "sample-4",
    organizer_name: "LINGAP Team",
    campaign_name: "LINGAP Platform",
    title: "Tech Volunteer — Web Developer",
    description: "Help build and improve LINGAP's platform features. React/Next.js or Python/FastAPI experience preferred.",
    category: "tech",
    skills_needed: ["React", "Python", "UI/UX"],
    location: "Remote",
    schedule: "Flexible · Part-time",
    slots: 3,
    slots_filled: 1,
    slots_remaining: 2,
    status: "open",
    urgent: false,
    my_signup_status: null,
    created_at: new Date().toISOString(),
  },
];

export default function VolunteerPage() {
  const { isAuthenticated } = useAuthStore();
  const [opportunities, setOpportunities] = useState<VolunteerOpportunity[]>([]);
  const [stats, setStats] = useState({ open_opportunities: 0, total_volunteers: 0, slots_needed: 0 });
  const [activeCategory, setActiveCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [applyModal, setApplyModal] = useState<VolunteerOpportunity | null>(null);
  const [applyMessage, setApplyMessage] = useState("");
  const [applySkills, setApplySkills] = useState("");

  useEffect(() => {
    fetchData();
  }, [activeCategory]);

  async function fetchData() {
    setLoading(true);
    try {
      const [oppRes, statsRes] = await Promise.allSettled([
        volunteerApi.listOpportunities(activeCategory || undefined),
        volunteerApi.getStats(),
      ]);
      const opps = oppRes.status === "fulfilled" ? oppRes.value.data.data : [];
      setOpportunities(opps.length > 0 ? opps : SAMPLE_OPPORTUNITIES.filter(o => !activeCategory || o.category === activeCategory));
      if (statsRes.status === "fulfilled") {
        setStats(statsRes.value.data.data);
      } else {
        setStats({ open_opportunities: SAMPLE_OPPORTUNITIES.length, total_volunteers: 16, slots_needed: 17 });
      }
    } catch {
      setOpportunities(SAMPLE_OPPORTUNITIES.filter(o => !activeCategory || o.category === activeCategory));
      setStats({ open_opportunities: SAMPLE_OPPORTUNITIES.length, total_volunteers: 16, slots_needed: 17 });
    } finally {
      setLoading(false);
    }
  }

  async function handleApply(opp: VolunteerOpportunity) {
    if (!isAuthenticated) { toast.error("Please log in to apply."); return; }
    if (opp.id.startsWith("sample-")) { toast("This is a sample — sign in and check back soon for real opportunities!"); return; }
    setApplyModal(opp);
  }

  async function submitApply() {
    if (!applyModal) return;
    setApplying(applyModal.id);
    try {
      await volunteerApi.apply(applyModal.id, applyMessage, applySkills.split(",").map(s => s.trim()).filter(Boolean));
      toast.success("Application submitted! The organizer will contact you soon.");
      setApplyModal(null);
      setApplyMessage("");
      setApplySkills("");
      fetchData();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to apply");
    } finally {
      setApplying(null);
    }
  }

  const filteredOpps = activeCategory
    ? opportunities.filter(o => o.category === activeCategory)
    : opportunities;

  return (
    <div>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 100%)", padding: "56px 40px", color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 50%, rgba(16,184,145,.15), transparent 60%)", pointerEvents: "none" }} />
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(16,184,145,.15)", border: "1px solid rgba(16,184,145,.3)", borderRadius: 20, padding: "6px 16px", marginBottom: 20 }}>
            <span style={{ fontSize: 14 }}>🤝</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--emerald)" }}>Call for Action</span>
          </div>
          <h1 style={{ fontSize: "clamp(32px,5vw,52px)", fontWeight: 800, color: "#fff", marginBottom: 12, lineHeight: 1.1 }}>
            Give Your Time,<br />
            <span style={{ color: "var(--gold)" }}>Change Lives</span>
          </h1>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,.7)", maxWidth: 520, marginBottom: 36, lineHeight: 1.65 }}>
            Can&apos;t donate money? Donate your skills and time. LINGAP connects you to campaigns that need hands-on help right now.
          </p>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {[
              { val: stats.open_opportunities, label: "Open Opportunities", icon: "📋" },
              { val: stats.total_volunteers, label: "Volunteers Joined", icon: "🙋" },
              { val: stats.slots_needed, label: "Slots Still Needed", icon: "🎯" },
            ].map(s => (
              <div key={s.label} style={{ background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 12, padding: "18px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontFamily: "Sora,sans-serif", fontSize: 26, fontWeight: 800, color: "#fff" }}>{s.val}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="page-inner">
        {/* Category filters */}
        <div className="filter-bar" style={{ marginBottom: 28 }}>
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setActiveCategory(c.value)}
              className={`filter-chip${activeCategory === c.value ? " active" : ""}`}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        {/* Opportunity cards */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "64px 0", color: "var(--text3)", fontSize: 15 }}>Loading opportunities…</div>
        ) : filteredOpps.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 24px", background: "#fff", borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🌟</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--navy)", marginBottom: 8 }}>No opportunities yet in this category</div>
            <p style={{ color: "var(--text2)", fontSize: 14 }}>Be the first to post a volunteer opportunity for your campaign.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: 20 }}>
            {filteredOpps.map(opp => {
              const catIcon = CATEGORIES.find(c => c.value === opp.category)?.icon ?? "🤝";
              const catColor = CATEGORY_COLORS[opp.category] ?? "rgba(13,27,42,.06)";
              const pct = opp.slots > 0 ? Math.round((opp.slots_filled / opp.slots) * 100) : 0;
              return (
                <div key={opp.id} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden", transition: "all .2s", display: "flex", flexDirection: "column" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-lg)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = ""; }}
                >
                  {/* Card header */}
                  <div style={{ padding: "20px 20px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: catColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                        {catIcon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 1 }}>{opp.campaign_name}</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--navy)", lineHeight: 1.3, marginTop: 2 }}>{opp.title}</div>
                      </div>
                      {opp.urgent && (
                        <span className="badge badge-red" style={{ fontSize: 10, flexShrink: 0 }}>🔴 URGENT</span>
                      )}
                    </div>

                    <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.65, marginBottom: 14, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {opp.description}
                    </p>

                    {/* Skills */}
                    {opp.skills_needed.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                        {opp.skills_needed.map(skill => (
                          <span key={skill} style={{ background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600, color: "var(--navy)" }}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Meta */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text2)" }}>
                        <span>📍</span><span>{opp.location}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text2)" }}>
                        <span>📅</span><span>{opp.schedule}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text2)" }}>
                        <span>🙋</span>
                        <span>{opp.slots_filled} / {opp.slots} volunteers</span>
                        <span style={{ color: opp.slots_remaining > 0 ? "var(--emerald)" : "#EF4444", fontWeight: 600 }}>
                          ({opp.slots_remaining} slot{opp.slots_remaining !== 1 ? "s" : ""} left)
                        </span>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="prog-track" style={{ height: 6, marginBottom: 16 }}>
                      <div className="prog-fill prog-emerald" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  {/* Card footer */}
                  <div style={{ padding: "0 20px 20px", marginTop: "auto" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "var(--text3)", flex: 1 }}>
                        By {opp.organizer_name}
                      </span>
                      {opp.my_signup_status ? (
                        <span className={`badge ${opp.my_signup_status === "accepted" ? "badge-emerald" : opp.my_signup_status === "rejected" ? "badge-red" : "badge-gold"}`}>
                          {opp.my_signup_status === "pending" ? "⏳ Applied" : opp.my_signup_status === "accepted" ? "✅ Accepted" : "❌ Rejected"}
                        </span>
                      ) : opp.slots_remaining > 0 ? (
                        <button
                          onClick={() => handleApply(opp)}
                          className="btn btn-emerald btn-sm"
                        >
                          ✋ Volunteer Now
                        </button>
                      ) : (
                        <span className="badge badge-navy">Filled</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* My signups section */}
        {isAuthenticated && (
          <div style={{ marginTop: 48, background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 28 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--navy)", marginBottom: 6 }}>📋 My Volunteer Applications</h3>
            <p style={{ fontSize: 13, color: "var(--text3)", marginBottom: 20 }}>Track the status of your volunteer applications here.</p>
            <MySignups />
          </div>
        )}
      </div>

      {/* Apply modal */}
      {applyModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(13,27,42,.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setApplyModal(null); }}>
          <div style={{ background: "#fff", borderRadius: "var(--r)", padding: 32, width: "100%", maxWidth: 480 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--navy)", marginBottom: 4 }}>Apply to Volunteer</h3>
            <p style={{ fontSize: 13, color: "var(--text3)", marginBottom: 20 }}>{applyModal.title}</p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 6 }}>Why do you want to help? *</label>
              <textarea
                value={applyMessage}
                onChange={e => setApplyMessage(e.target.value)}
                placeholder="Tell the organizer about yourself and why you want to volunteer…"
                rows={4}
                style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", fontSize: 14, fontFamily: "DM Sans,sans-serif", outline: "none", resize: "vertical", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 6 }}>Your relevant skills (comma-separated)</label>
              <input
                value={applySkills}
                onChange={e => setApplySkills(e.target.value)}
                placeholder="e.g. First Aid, Driving, Tagalog"
                style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setApplyModal(null)} className="btn btn-outline" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
              <button
                onClick={submitApply}
                disabled={applying === applyModal.id || !applyMessage.trim()}
                className="btn btn-emerald"
                style={{ flex: 2, justifyContent: "center", opacity: !applyMessage.trim() ? 0.6 : 1 }}
              >
                {applying === applyModal.id ? "Submitting…" : "Submit Application"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MySignups() {
  const [signups, setSignups] = useState<VolunteerOpportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    volunteerApi.mySignups()
      .then(r => setSignups(r.data.data))
      .catch(() => setSignups([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: "var(--text3)", fontSize: 14 }}>Loading…</div>;
  if (signups.length === 0) return (
    <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text3)", fontSize: 14 }}>
      You haven&apos;t applied to any opportunities yet.
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {signups.map(s => (
        <div key={s.signup_id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "var(--bg)", borderRadius: "var(--r-sm)", border: "1px solid var(--border)" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>{s.title}</div>
            <div style={{ fontSize: 12, color: "var(--text3)" }}>{s.campaign_name} · {s.location}</div>
          </div>
          <span className={`badge ${s.my_signup_status === "accepted" ? "badge-emerald" : s.my_signup_status === "rejected" ? "badge-red" : "badge-gold"}`}>
            {s.my_signup_status === "pending" ? "⏳ Pending" : s.my_signup_status === "accepted" ? "✅ Accepted" : "❌ Rejected"}
          </span>
        </div>
      ))}
    </div>
  );
}
