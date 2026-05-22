"use client";
import { useState, useEffect, useMemo } from "react";
import { Hospital, Anchor, BookOpen, Handshake, MapPin, Star, Sparkles, CheckCircle2, Search, Users, Home, Cat, PawPrint, ChevronDown, ShieldAlert, AlertTriangle } from "lucide-react";
import { CAMPAIGNS } from "@/lib/campaigns";
import AuthPromptLink from "@/components/auth/AuthPromptLink";

// Major Philippine cities for the dropdown
const PH_CITIES = [
  "All Cities",
  "Manila",
  "Quezon City",
  "Cebu City",
  "Davao City",
  "Makati",
  "Taguig",
  "Pasig",
  "Caloocan",
  "Zamboanga City",
  "Antipolo",
  "Pasay",
  "Parañaque",
  "Las Piñas",
  "Marikina",
  "Muntinlupa",
  "Valenzuela",
  "Bacoor",
  "General Santos",
  "Iloilo City",
  "Bacolod",
  "Cagayan de Oro",
  "Baguio",
  "Pulilan",
  "Bulacan",
] as const;

export default function DiscoverPage() {
  const [selectedCity, setSelectedCity] = useState<string>("All Cities");
  const [liveCampaigns, setLiveCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch campaigns from backend API
  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    setLoading(true);
    fetch(`${baseUrl}/api/v1/aid-requests?page=1&size=200`)
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => {
        setLiveCampaigns(data.items ?? []);
      })
      .catch(() => setLiveCampaigns([]))
      .finally(() => setLoading(false));
  }, []);

  // Filter campaigns by selected city
  const filteredCampaigns = useMemo(() => {
    if (selectedCity === "All Cities") return liveCampaigns;
    return liveCampaigns.filter((c) => {
      const loc = (c.location || c.beneficiary_location || "").toLowerCase();
      return loc.includes(selectedCity.toLowerCase());
    });
  }, [liveCampaigns, selectedCity]);

  // --- Dynamic stats computed from fetched campaigns ---
  const activeCampaigns = liveCampaigns.filter(
    (c) => c.status === "active" || c.status === "approved" || c.status === "pending"
  ).length + CAMPAIGNS.length;

  const verifiedCampaigns = liveCampaigns.filter(
    (c) => c.is_verified === true
  ).length + CAMPAIGNS.length;

  const totalRequested = liveCampaigns.reduce(
    (sum: number, c: any) => sum + (c.requested_amount || 0),
    0
  ) + CAMPAIGNS.reduce((sum, c) => sum + c.goal, 0);

  const confirmedFraud = liveCampaigns.filter(
    (c) => c.status === "fraud" || c.classification === "fraud"
  ).length;

  const filters = [
    { label: "All Campaigns", Icon: null },
    { label: "Medical", Icon: Hospital },
    { label: "Typhoon Relief", Icon: Anchor },
    { label: "Education", Icon: BookOpen },
    { label: "Community", Icon: Handshake },
    { label: "Near Me", Icon: MapPin },
    { label: "Trending", Icon: Star },
    { label: "New", Icon: Sparkles },
    { label: "Verified Only", Icon: CheckCircle2 },
  ];

  const displayCount = selectedCity === "All Cities" ? filteredCampaigns.length + CAMPAIGNS.length : filteredCampaigns.length;

  return (
    <div>
      {/* ── HERO HEADER ── */}
      <div style={{ background: "var(--forest)", padding: "48px 40px", color: "#fff" }}>
        <div className="container">
          <div className="section-label" style={{ color: "var(--canopy-light)" }}>
            CAMPAIGN DISCOVERY
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 800, color: "#fff", marginBottom: 12 }}>
            Find a cause to believe in
          </h1>
          <p style={{ color: "rgba(255,255,255,.7)", fontSize: 17, marginBottom: 28 }}>
            Every campaign verified. Every peso tracked. Your trust protected.
          </p>
          <div className="search-bar" style={{ maxWidth: 600, background: "rgba(255,255,255,.1)", borderColor: "rgba(255,255,255,.2)" }}>
            <Search size={18} color="rgba(255,255,255,.6)" />
            <input placeholder="Search campaigns, locations, or causes..." style={{ color: "#fff" }} />
            <button className="btn btn-emerald btn-sm">Search</button>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        {/* ── FILTER BAR ── */}
        <div className="filter-bar">
          {filters.map(({ label, Icon }, i) => (
            <button
              key={label}
              className={`filter-chip${i === 0 ? " active" : ""}`}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              {Icon && <Icon size={13} strokeWidth={2} />}
              {label}
            </button>
          ))}
        </div>

        {/* ── FEATURED CAMPAIGNS ── */}
        <div style={{ marginBottom: 48 }}>
          <div className="flex flex-center flex-between mb-24">
            <div>
              <div className="section-label" style={{ color: "var(--canopy)" }}>FEATURED CAMPAIGNS</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--forest)", marginBottom: 0 }}>
                Real causes, real people
              </h2>
            </div>
            <span className="badge badge-emerald" style={{ fontSize: 12 }}>
              ✓ All Verified
            </span>
          </div>

          <div className="campaign-grid">
            {CAMPAIGNS.map((c) => {
              const Icon = c.heroIcon === "🏠" ? Home : c.heroIcon === "🐱" ? Cat : PawPrint;
              const progressColor = c.category === "Animal Rescue" ? "prog-gold" : "prog-emerald";
              const accentHex = c.category === "Animal Rescue" ? "var(--amber)" : "var(--canopy)";
              return (
                <AuthPromptLink
                  key={c.id}
                  href={`/detail/${c.slug}`}
                  className="camp-card emerald-glow featured-camp"
                  style={{ textDecoration: "none" }}
                >
                  <div className="camp-img" style={{ background: c.heroGradient }}>
                    <div className="camp-img-inner"><Icon size={48} strokeWidth={1.8} /></div>
                    {c.urgencyLabel && (
                      <div style={{ position: "absolute", top: 12, left: 12 }}>
                        <span className={`badge ${c.urgencyClass}`}>{c.urgencyLabel}</span>
                      </div>
                    )}
                    <div style={{ position: "absolute", top: 12, right: 12 }}>
                      <span className="badge badge-emerald">Verified</span>
                    </div>
                    <div style={{ position: "absolute", bottom: 12, left: 12 }}>
                      <span className="badge badge-navy" style={{ fontSize: 10 }}>{c.category}</span>
                    </div>
                  </div>
                  <div className="camp-body">
                    <h3 className="camp-title">{c.title}</h3>
                    <p className="camp-desc">{c.description}</p>
                    <div className="camp-meta">
                      <div>
                        <div className="camp-raised">{c.raisedLabel}</div>
                        <div className="camp-goal">of {c.goalLabel} goal</div>
                      </div>
                      <div className="camp-donors"><Users size={12} /> {c.donors.toLocaleString()} donors</div>
                    </div>
                    <div className="prog-track" style={{ height: 8 }}>
                      <div className={`prog-fill ${progressColor}`} style={{ width: `${c.pct}%` }} />
                    </div>
                    <div className="camp-footer">
                      <span className="badge badge-navy">{c.institutionDesc}</span>
                      <span style={{ fontSize: 12, color: accentHex, fontWeight: 600 }}>
                        {c.pct}% funded · {c.daysLeft}d left
                      </span>
                    </div>
                  </div>
                </AuthPromptLink>
              );
            })}
          </div>
        </div>

        {/* ── CITY FILTER BANNER (Campaigns Near You) ── */}
        <div
          style={{
            background: "linear-gradient(135deg,rgba(74,155,106,.08),rgba(61,122,82,.08))",
            border: "1px solid rgba(74,155,106,.2)",
            borderRadius: "var(--r)",
            padding: "20px 24px",
            marginBottom: 28,
            display: "flex",
            alignItems: "center",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div style={{ width: 40, height: 40, background: "rgba(74,155,106,.15)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <MapPin size={20} color="var(--canopy)" strokeWidth={1.8} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontWeight: 700, color: "var(--forest)", fontSize: 16 }}>
              Campaigns Near You
            </div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 4 }}>
              Showing {displayCount} campaign{displayCount !== 1 ? "s" : ""} in{" "}
              <strong>{selectedCity}</strong>
            </div>
          </div>
          {/* City Dropdown */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <select
              id="city-filter-select"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              style={{
                appearance: "none",
                WebkitAppearance: "none",
                background: "#fff",
                border: "1.5px solid rgba(74,155,106,.35)",
                borderRadius: 10,
                padding: "10px 40px 10px 16px",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--forest)",
                cursor: "pointer",
                minWidth: 200,
                outline: "none",
                transition: "border-color .2s, box-shadow .2s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--canopy)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(74,155,106,.15)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(74,155,106,.35)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {PH_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              color="var(--canopy)"
              style={{
                position: "absolute",
                right: 14,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>

        {/* ── DYNAMIC STATS ROW ── */}
        <div className="grid-4 mb-32">
          <div className="stat-card">
            <div className="stat-value">{activeCampaigns}</div>
            <div className="stat-label">Active Campaigns</div>
            <div className="stat-change">↑ active</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{verifiedCampaigns}</div>
            <div className="stat-label">Verified Campaigns</div>
            <div className="stat-change">↑ verified</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">&#8369;{totalRequested.toLocaleString()}</div>
            <div className="stat-label">Total Requested</div>
            <div className="stat-change">↑ requested amount</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{confirmedFraud}</div>
            <div className="stat-label">Confirmed Fraud</div>
            <div className="stat-change emerald">{confirmedFraud === 0 ? "Zero losses" : `${confirmedFraud} flagged`}</div>
          </div>
        </div>

        {/* ── FILTERED CAMPAIGN LIST (by city) ── */}
        <div className="flex flex-center flex-between mb-24">
          <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--forest)", display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUpIcon /> {selectedCity === "All Cities" ? "All Campaigns" : `Campaigns in ${selectedCity}`}
          </h3>
          <div style={{ fontSize: 13, color: "var(--text3)" }}>{displayCount} campaign{displayCount !== 1 ? "s" : ""} found</div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text3)" }}>
            <div style={{ width: 32, height: 32, border: "3px solid var(--canopy-light)", borderTopColor: "var(--canopy)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            Loading campaigns...
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text3)" }}>
            <MapPin size={32} color="var(--canopy)" style={{ margin: "0 auto 12px", display: "block", opacity: 0.5 }} />
            <div style={{ fontWeight: 600, color: "var(--forest)", marginBottom: 6 }}>No campaigns found</div>
            <div style={{ fontSize: 14 }}>No campaigns match &ldquo;{selectedCity}&rdquo;. Try selecting a different city.</div>
          </div>
        ) : (
          <div className="campaign-grid">
            {filteredCampaigns.map((c) => (
              <AuthPromptLink key={c.id || c.aid_request_id} href={`/detail/${c.id || c.aid_request_id}`} className="camp-card" style={{ textDecoration: "none" }}>
                <div className="camp-img" style={{ background: "linear-gradient(135deg,#1a3a2a,#2d5a3d)" }}>
                  <div className="camp-img-inner"><Hospital size={48} strokeWidth={1.2} /></div>
                  {c.location && (
                    <div style={{ position: "absolute", top: 12, left: 12 }}>
                      <span className="badge badge-blue" style={{ fontSize: 10 }}>{c.location}</span>
                    </div>
                  )}
                  <div style={{ position: "absolute", top: 12, right: 12 }}>
                    <span className={`badge ${c.is_verified ? "badge-emerald" : "badge-navy"}`}>
                      {c.is_verified ? "Verified" : c.status}
                    </span>
                  </div>
                  <div style={{ position: "absolute", bottom: 12, left: 12, right: 12, background: "rgba(26,58,42,.75)", borderRadius: "var(--r)", padding: "8px 12px" }}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)" }}>Requested Amount</div>
                    <div style={{ height: 4, background: "rgba(255,255,255,.2)", borderRadius: 2, marginTop: 4 }}>
                      <div style={{ width: `${Math.min((c.requested_amount / (c.requested_amount + 1000)) * 100, 100)}%`, height: 4, background: "var(--canopy)", borderRadius: 2 }} />
                    </div>
                  </div>
                </div>
                <div className="camp-body">
                  <h3 className="camp-title">{c.beneficiary_name}</h3>
                  <p className="camp-desc">{c.purpose}</p>
                  <div className="camp-meta">
                    <div>
                      <div className="camp-raised">&#8369;{c.requested_amount?.toLocaleString()}</div>
                      <div className="camp-goal">{c.asset}</div>
                    </div>
                    <div className="camp-donors"><Users size={12} /> {c.donors?.toLocaleString() || 0} donors</div>
                  </div>
                  <div className="prog-track" style={{ height: 8 }}>
                    <div className="prog-fill prog-emerald" style={{ width: `${c.pct || 0}%` }} />
                  </div>
                  <div className="camp-footer">
                    <span className="badge badge-navy">{c.status}</span>
                    {c.location && (
                      <span style={{ fontSize: 12, color: "var(--canopy)", fontWeight: 600 }}>
                        <MapPin size={11} style={{ display: "inline", verticalAlign: "-1px" }} /> {c.location}
                      </span>
                    )}
                  </div>
                </div>
              </AuthPromptLink>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TrendingUpIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--canopy)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}
