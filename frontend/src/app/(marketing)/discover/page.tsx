"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  Anchor,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Handshake,
  Hospital,
  MapPin,
  PawPrint,
  Search,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { CAMPAIGNS, mergeCampaignSummaries, type Campaign, type PublicCampaignSummary } from "@/lib/campaigns";
import { campaignsApi } from "@/lib/api";
import AuthPromptLink from "@/components/auth/AuthPromptLink";
import SafeImageFrame from "@/components/campaign/SafeImageFrame";

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
  "Paranaque",
  "Las Pinas",
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

const FILTERS = [
  { label: "All Campaigns", Icon: null },
  { label: "Medical", Icon: Hospital },
  { label: "Typhoon Relief", Icon: Anchor },
  { label: "Education", Icon: BookOpen },
  { label: "Community", Icon: Handshake },
  { label: "Near Me", Icon: MapPin },
  { label: "Trending", Icon: Star },
  { label: "New", Icon: Sparkles },
  { label: "Verified Only", Icon: CheckCircle2 },
] as const;

type FilterLabel = (typeof FILTERS)[number]["label"];

type DiscoverCampaign = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  status: string;
  raisedLabel: string;
  goalLabel: string;
  raisedAmount: number;
  goalAmount: number;
  donors: number;
  pct: number;
  institution: string;
  location: string;
  imageSrc?: string | null;
  updatedAt: string;
  source: string;
  urgencyLabel?: string | null;
  urgencyClass?: string | null;
  heroGradient?: string;
  heroIcon?: string;
  daysLeft?: number;
};

function pesoLabel(amount: number) {
  return `PHP ${Math.round(amount).toLocaleString()}`;
}

function normalizeStaticCampaign(campaign: Campaign): DiscoverCampaign {
  return {
    id: String(campaign.id),
    slug: campaign.slug,
    title: campaign.title,
    description: campaign.description,
    category: campaign.category,
    status: "active",
    raisedLabel: campaign.raisedLabel,
    goalLabel: campaign.goalLabel,
    raisedAmount: campaign.raised,
    goalAmount: campaign.goal,
    donors: campaign.donors,
    pct: campaign.pct,
    institution: campaign.institutionDesc,
    location: campaign.location,
    imageSrc: campaign.imageSrc,
    updatedAt: campaign.startDate,
    source: "seeded",
    urgencyLabel: campaign.urgencyLabel,
    urgencyClass: campaign.urgencyClass,
    heroGradient: campaign.heroGradient,
    heroIcon: campaign.heroIcon,
    daysLeft: campaign.daysLeft,
  };
}

function normalizeLiveCampaign(campaign: PublicCampaignSummary, staticMatch?: Campaign): DiscoverCampaign {
  return {
    id: campaign.id,
    slug: campaign.slug,
    title: campaign.title,
    description: campaign.description,
    category: campaign.category,
    status: campaign.status,
    raisedLabel: campaign.raised_label ?? pesoLabel(campaign.raised_amount),
    goalLabel: campaign.goal_label ?? pesoLabel(campaign.goal_amount),
    raisedAmount: campaign.raised_amount,
    goalAmount: campaign.goal_amount,
    donors: campaign.donors,
    pct: campaign.progress,
    institution: campaign.institution,
    location: campaign.location,
    imageSrc: campaign.image_src ?? staticMatch?.imageSrc,
    updatedAt: campaign.updated_at,
    source: campaign.source,
    urgencyLabel: staticMatch?.urgencyLabel ?? statusLabel(campaign.status),
    urgencyClass: staticMatch?.urgencyClass ?? "badge-blue",
    heroGradient: staticMatch?.heroGradient ?? "linear-gradient(135deg,#1a3a2a,#2d5a3d)",
    heroIcon: staticMatch?.heroIcon,
    daysLeft: staticMatch?.daysLeft ?? 30,
  };
}

function statusLabel(status: string) {
  if (!status) return null;
  return status.replace(/_/g, " ");
}

function categoryIcon(campaign: DiscoverCampaign) {
  if (campaign.category.toLowerCase().includes("animal")) return PawPrint;
  if (campaign.category.toLowerCase().includes("education")) return BookOpen;
  if (campaign.category.toLowerCase().includes("disaster")) return Anchor;
  if (campaign.category.toLowerCase().includes("community")) return Handshake;
  return Hospital;
}

function filterCampaigns(
  campaigns: DiscoverCampaign[],
  activeFilter: FilterLabel,
  selectedCity: string,
  searchQuery: string
) {
  const query = searchQuery.trim().toLowerCase();
  let result = [...campaigns];

  if (selectedCity !== "All Cities") {
    result = result.filter((campaign) => campaign.location.toLowerCase().includes(selectedCity.toLowerCase()));
  }

  if (query) {
    result = result.filter((campaign) => {
      const haystack = [
        campaign.title,
        campaign.description,
        campaign.category,
        campaign.institution,
        campaign.location,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }

  if (activeFilter === "Medical") {
    result = result.filter((campaign) => campaign.category.toLowerCase().includes("medical"));
  }

  if (activeFilter === "Typhoon Relief") {
    result = result.filter((campaign) => {
      const text = `${campaign.category} ${campaign.title} ${campaign.description}`.toLowerCase();
      return text.includes("typhoon") || text.includes("relief") || text.includes("disaster");
    });
  }

  if (activeFilter === "Education") {
    result = result.filter((campaign) => campaign.category.toLowerCase().includes("education"));
  }

  if (activeFilter === "Community") {
    result = result.filter((campaign) => campaign.category.toLowerCase().includes("community"));
  }

  if (activeFilter === "Near Me" && selectedCity === "All Cities") {
    result = result.filter((campaign) => {
      const location = campaign.location.toLowerCase();
      return location.includes("manila") || location.includes("bulacan") || location.includes("philippines");
    });
  }

  if (activeFilter === "Verified Only") {
    result = result.filter((campaign) => {
      const status = campaign.status.toLowerCase();
      return campaign.source === "seeded" || campaign.source === "database" || ["active", "funded"].includes(status);
    });
  }

  if (activeFilter === "Trending") {
    result.sort((a, b) => b.donors - a.donors || b.pct - a.pct);
  }

  if (activeFilter === "New") {
    result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  return result;
}

export default function DiscoverPage() {
  const [selectedCity, setSelectedCity] = useState<string>("All Cities");
  const [activeFilter, setActiveFilter] = useState<FilterLabel>("All Campaigns");
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredCampaigns, setFeaturedCampaigns] = useState(CAMPAIGNS);
  const [liveCampaigns, setLiveCampaigns] = useState<PublicCampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadCampaigns() {
      try {
        const res = await campaignsApi.publicList();
        if (!mounted) return;
        setLiveCampaigns(res.data.data);
        setFeaturedCampaigns(mergeCampaignSummaries(res.data.data));
      } catch {
        if (!mounted) return;
        setLiveCampaigns([]);
        setFeaturedCampaigns(CAMPAIGNS);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    setLoading(true);
    loadCampaigns();
    const timer = window.setInterval(loadCampaigns, 10000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const staticBySlug = useMemo(() => new Map(CAMPAIGNS.map((campaign) => [campaign.slug, campaign])), []);

  const allCampaigns = useMemo(() => {
    if (!liveCampaigns.length) return featuredCampaigns.map(normalizeStaticCampaign);
    return liveCampaigns.map((campaign) => normalizeLiveCampaign(campaign, staticBySlug.get(campaign.slug)));
  }, [featuredCampaigns, liveCampaigns, staticBySlug]);

  const filteredCampaigns = useMemo(
    () => filterCampaigns(allCampaigns, activeFilter, selectedCity, searchQuery),
    [activeFilter, allCampaigns, searchQuery, selectedCity]
  );

  const carouselBase = useMemo(() => {
    const sorted = [...allCampaigns].sort((a, b) => b.donors - a.donors || b.pct - a.pct);
    return sorted.slice(0, 10);
  }, [allCampaigns]);

  const carouselItems = useMemo(() => [...carouselBase, ...carouselBase], [carouselBase]);

  const activeCampaigns = allCampaigns.filter((campaign) =>
    ["active", "funded"].includes(campaign.status.toLowerCase())
  ).length;
  const verifiedCampaigns = allCampaigns.filter((campaign) =>
    campaign.source === "seeded" || campaign.source === "database"
  ).length;
  const totalRequested = allCampaigns.reduce((sum, campaign) => sum + campaign.goalAmount, 0);
  const confirmedFraud = 0;
  const displayCount = filteredCampaigns.length;

  return (
    <div>
      <style jsx>{`
        .discover-carousel-shell {
          margin-inline: -16px;
          overflow: hidden;
          padding: 8px 28px 28px;
          position: relative;
          -webkit-mask-image: linear-gradient(
            to right,
            transparent 0,
            rgba(0, 0, 0, 0.15) 3%,
            #000 12%,
            #000 88%,
            rgba(0, 0, 0, 0.15) 97%,
            transparent 100%
          );
          mask-image: linear-gradient(
            to right,
            transparent 0,
            rgba(0, 0, 0, 0.15) 3%,
            #000 12%,
            #000 88%,
            rgba(0, 0, 0, 0.15) 97%,
            transparent 100%
          );
        }

        .discover-carousel-track {
          display: flex;
          gap: 22px;
          width: max-content;
          animation: discover-carousel 52s linear infinite;
          will-change: transform;
        }

        .discover-carousel-shell:hover .discover-carousel-track,
        .discover-carousel-track:focus-within {
          animation-play-state: paused;
        }

        .discover-carousel-card {
          flex: 0 0 clamp(292px, calc((100vw - 148px) / 3), 378px);
          filter: grayscale(1);
          opacity: 0.92;
          overflow: hidden;
          transition: filter 0.7s ease, opacity 0.7s ease, transform 0.7s ease;
        }

        .discover-carousel-card :global(.camp-card) {
          display: block;
          overflow: hidden;
          contain: paint;
        }

        .discover-carousel-card:hover,
        .discover-carousel-card:focus-within {
          filter: grayscale(0);
          opacity: 1;
        }

        .fixed-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 22px;
          align-items: stretch;
        }

        @keyframes discover-carousel {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(-50%, 0, 0);
          }
        }

        @media (max-width: 900px) {
          .discover-carousel-card {
            flex-basis: clamp(280px, 62vw, 340px);
          }

          .fixed-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .discover-carousel-shell {
            margin-inline: -12px;
            padding-inline: 20px;
            -webkit-mask-image: linear-gradient(to right, transparent 0, rgba(0, 0, 0, 0.2) 4%, #000 10%, #000 90%, rgba(0, 0, 0, 0.2) 96%, transparent 100%);
            mask-image: linear-gradient(to right, transparent 0, rgba(0, 0, 0, 0.2) 4%, #000 10%, #000 90%, rgba(0, 0, 0, 0.2) 96%, transparent 100%);
          }

          .discover-carousel-card {
            flex-basis: min(82vw, 330px);
          }

          .fixed-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="discover-hero" style={{ background: "var(--forest)", padding: "48px 40px", color: "#fff" }}>
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
          <div
            className="search-bar"
            style={{ maxWidth: 600, background: "rgba(255,255,255,.1)", borderColor: "rgba(255,255,255,.2)" }}
          >
            <Search size={18} color="rgba(255,255,255,.6)" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search campaigns, locations, or causes..."
              style={{ color: "#fff" }}
            />
            <button className="btn btn-emerald btn-sm" type="button">
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <section style={{ marginBottom: 48 }}>
          <div className="flex flex-center flex-between" style={{ marginBottom: 8 }}>
            <div>
              <div className="section-label" style={{ color: "var(--canopy)" }}>
                FEATURED CAMPAIGNS
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--forest)", marginBottom: 0 }}>
                Real causes, real people
              </h2>
            </div>
            <span className="badge badge-emerald" style={{ fontSize: 12 }}>
              All Verified
            </span>
          </div>

          <div className="discover-carousel-shell" aria-label="Featured campaign carousel">
            <div className="discover-carousel-track">
              {carouselItems.map((campaign, index) => (
                <div key={`${campaign.slug}-${index}`} className="discover-carousel-card">
                  <CampaignCard campaign={campaign} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <div
          className="city-filter-card"
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
          <div
            style={{
              width: 40,
              height: 40,
              background: "rgba(74,155,106,.15)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <MapPin size={20} color="var(--canopy)" strokeWidth={1.8} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontWeight: 700, color: "var(--forest)", fontSize: 16 }}>
              Campaigns Near You
            </div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 4 }}>
              Showing {displayCount} campaign{displayCount !== 1 ? "s" : ""} in <strong>{selectedCity}</strong>
            </div>
          </div>

          <div className="city-select-wrap" style={{ position: "relative", flexShrink: 0 }}>
            <select
              id="city-filter-select"
              value={selectedCity}
              onChange={(event) => setSelectedCity(event.target.value)}
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
              style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
            />
          </div>
        </div>

        <div className="grid-4 mb-32">
          <div className="stat-card">
            <div className="stat-value">{activeCampaigns}</div>
            <div className="stat-label">Active Campaigns</div>
            <div className="stat-change">Active now</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{verifiedCampaigns}</div>
            <div className="stat-label">Verified Campaigns</div>
            <div className="stat-change">Identity checked</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">PHP {totalRequested.toLocaleString()}</div>
            <div className="stat-label">Total Requested</div>
            <div className="stat-change">Across listed drives</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{confirmedFraud}</div>
            <div className="stat-label">Confirmed Fraud</div>
            <div className="stat-change emerald">{confirmedFraud === 0 ? "Zero losses" : `${confirmedFraud} flagged`}</div>
          </div>
        </div>

        <div className="flex flex-center flex-between mb-24">
          <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--forest)", display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUpIcon /> {activeFilter === "All Campaigns" ? "All Campaigns" : activeFilter}
          </h3>
          <div style={{ fontSize: 13, color: "var(--text3)" }}>
            {displayCount} campaign{displayCount !== 1 ? "s" : ""} found
          </div>
        </div>

        <div className="filter-bar" role="list" aria-label="Campaign filters">
          {FILTERS.map(({ label, Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => setActiveFilter(label)}
              className={`filter-chip${activeFilter === label ? " active" : ""}`}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
              aria-pressed={activeFilter === label}
            >
              {Icon && <Icon size={13} strokeWidth={2} />}
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text3)" }}>
            <div
              style={{
                width: 32,
                height: 32,
                border: "3px solid var(--canopy-light)",
                borderTopColor: "var(--canopy)",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 12px",
              }}
            />
            Loading campaigns...
          </div>
        ) : displayCount === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text3)" }}>
            <MapPin size={32} color="var(--canopy)" style={{ margin: "0 auto 12px", display: "block", opacity: 0.5 }} />
            <div style={{ fontWeight: 600, color: "var(--forest)", marginBottom: 6 }}>No campaigns found</div>
            <div style={{ fontSize: 14 }}>Try a different filter, city, or search term.</div>
          </div>
        ) : (
          <div className="fixed-grid">
            {filteredCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CampaignCard({ campaign }: { campaign: DiscoverCampaign }) {
  const Icon = categoryIcon(campaign);
  const progressColor = campaign.category.toLowerCase().includes("animal") ? "prog-gold" : "prog-emerald";

  return (
    <AuthPromptLink
      href={`/detail/${campaign.slug}`}
      className="camp-card emerald-glow featured-camp"
      style={
        {
          "--camp-accent": campaign.category.toLowerCase().includes("animal") ? "var(--amber)" : "var(--canopy)",
          "--camp-accent-2": "var(--forest-mid)",
          textDecoration: "none",
          width: "100%",
          height: "100%",
        } as CSSProperties
      }
    >
      <SafeImageFrame
        src={campaign.imageSrc}
        alt={campaign.title}
        className="camp-img"
        photoClassName="camp-img-photo"
        style={{ background: campaign.heroGradient }}
        fallback={
          <div className="camp-img-inner">
            <Icon size={48} strokeWidth={1.8} />
          </div>
        }
      >
        {campaign.urgencyLabel && (
          <div style={{ position: "absolute", top: 12, left: 12 }}>
            <span className={`badge ${campaign.urgencyClass ?? "badge-blue"}`}>{campaign.urgencyLabel}</span>
          </div>
        )}
        <div style={{ position: "absolute", top: 12, right: 12 }}>
          <span className="badge badge-emerald">Verified</span>
        </div>
        <div style={{ position: "absolute", bottom: 12, left: 12 }}>
          <span className="badge badge-navy" style={{ fontSize: 10 }}>
            {campaign.category}
          </span>
        </div>
      </SafeImageFrame>

      <div className="camp-body">
        <h3 className="camp-title">{campaign.title}</h3>
        <p className="camp-desc">{campaign.description}</p>
        <div className="camp-meta">
          <div>
            <div className="camp-raised">{campaign.raisedLabel}</div>
            <div className="camp-goal">of {campaign.goalLabel} goal</div>
          </div>
          <div className="camp-donors">
            <Users size={12} /> {campaign.donors.toLocaleString()} donors
          </div>
        </div>
        <div className="prog-track" style={{ height: 8 }}>
          <div className={`prog-fill ${progressColor}`} style={{ width: `${campaign.pct}%` }} />
        </div>
        <div className="camp-footer">
          <span className="badge badge-navy">{campaign.institution}</span>
          <span style={{ fontSize: 12, color: "var(--canopy)", fontWeight: 600 }}>
            {campaign.pct}% funded - {campaign.daysLeft ?? 30}d left
          </span>
        </div>
      </div>
    </AuthPromptLink>
  );
}

function TrendingUpIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--canopy)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}
