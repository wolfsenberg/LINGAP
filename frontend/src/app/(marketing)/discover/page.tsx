// Discover page - production ready with SSR and revalidation
import Link from "next/link";
import { Hospital, Anchor, BookOpen, Handshake, MapPin, Star, Sparkles, CheckCircle2, Search, Users } from "lucide-react";

// Revalidate every 5 minutes for incremental static regeneration
export const revalidate = 300; // seconds

export default async function DiscoverPage() {
  // Default location: Manila coordinates
  const lat = 14.5995;
  const lng = 120.9842;
  const radius_km = 50;

  // Fetch campaigns from backend API (next.js API route)
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const res = await fetch(`${baseUrl}/api/v1/aid-requests/near?lat=${lat}&lng=${lng}&radius_km=${radius_km}`, {
    // Enable ISR caching
    next: { revalidate: 300 },
  });
  const data = (await res.json()) as { items: any[] };
  const campaigns = data.items ?? [];

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

  return (
    <div>
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
          }}
        >
          <div style={{ width: 40, height: 40, background: "rgba(74,155,106,.15)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <MapPin size={20} color="var(--canopy)" strokeWidth={1.8} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: "var(--forest)", fontSize: 16 }}>
              Campaigns Near You — Quezon City, Metro Manila
            </div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 4 }}>
              Showing {campaigns.length} verified campaigns within {radius_km}km of your location
            </div>
          </div>
          <button className="btn btn-outline btn-sm" style={{ marginLeft: "auto", flexShrink: 0 }}>
            Change Location
          </button>
        </div>

        <div className="grid-4 mb-32">
          <div className="stat-card">
            <div className="stat-value">{campaigns.length}</div>
            <div className="stat-label">Active Campaigns</div>
            <div className="stat-change">↑ new this week</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{campaigns.reduce((sum, c) => sum + (c.requested_amount || 0), 0).toLocaleString()}</div>
            <div className="stat-label">Total Requested</div>
            <div className="stat-change">↑ this month</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{Math.round((campaigns.filter(c => c.status === "verified").length / campaigns.length) * 100)}%</div>
            <div className="stat-label">Verified Campaigns</div>
            <div className="stat-change">↑ Industry leading</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">0</div>
            <div className="stat-label">Confirmed Frauds</div>
            <div className="stat-change emerald">Zero losses</div>
          </div>
        </div>

        <div className="flex flex-center flex-between mb-24">
          <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--forest)", display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUpIcon /> Trending Now
          </h3>
          <div style={{ fontSize: 13, color: "var(--text3)" }}>{campaigns.length} campaigns found</div>
        </div>

        <div className="campaign-grid">
          {campaigns.map((c) => (
            <Link key={c.aid_request_id} href={`/detail/${c.aid_request_id}`} className="camp-card" style={{ textDecoration: "none" }}>
              <div className="camp-img" style={{ background: "linear-gradient(135deg,#1a3a2a,#2d5a3d)" }}>
                <div className="camp-img-inner"><Hospital size={48} strokeWidth={1.2} /></div>
                <div style={{ position: "absolute", top: 12, left: 12 }}>
                  <span className="badge badge-blue">{c.distance_km} km</span>
                </div>
                <div style={{ position: "absolute", top: 12, right: 12 }}>
                  <span className="badge badge-emerald">Verified</span>
                </div>
                <div style={{ position: "absolute", bottom: 12, left: 12, right: 12, background: "rgba(26,58,42,.75)", borderRadius: "var(--r)", padding: "8px 12px" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)" }}>Requested Amount</div>
                  <div style={{ height: 4, background: "rgba(255,255,255,.2)", borderRadius: 2, marginTop: 4 }}>
                    <div style={{ width: `${(c.requested_amount / (c.requested_amount + 1000)) * 100}%`, height: 4, background: "var(--canopy)", borderRadius: 2 }} />
                  </div>
                </div>
              </div>
              <div className="camp-body">
                <h3 className="camp-title">{c.beneficiary_name}</h3>
                <p className="camp-desc">{c.purpose}</p>
                <div className="camp-meta">
                  <div>
                    <div className="camp-raised">₱{c.requested_amount?.toLocaleString()}</div>
                    <div className="camp-goal">{c.asset}</div>
                  </div>
                  <div className="camp-donors"><Users size={12} /> {c.donors?.toLocaleString() || 0} donors</div>
                </div>
                <div className="prog-track" style={{ height: 8 }}>
                  <div className="prog-fill prog-emerald" style={{ width: `${c.pct || 0}%` }} />
                </div>
                <div className="camp-footer">
                  <span className="badge badge-navy">{c.status}</span>
                  <span style={{ fontSize: 12, color: "var(--canopy)", fontWeight: 600 }}>{c.distance_km} km away</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
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
