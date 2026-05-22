"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Heart,
  Megaphone,
  Search,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import { profilesApi, type PublicProfileSearchResultApi } from "@/lib/api";

function formatPeso(value: number) {
  return `₱${Math.round(value).toLocaleString()}`;
}

function formatRole(value: string) {
  return value.replace("_", " ");
}

export default function CommunityPage() {
  const [query, setQuery] = useState("");
  const [profiles, setProfiles] = useState<PublicProfileSearchResultApi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await profilesApi.search(query, 12);
        if (active) setProfiles(res.data.data);
      } catch {
        if (active) setProfiles([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  const totals = useMemo(
    () => ({
      members: profiles.length,
      campaigns: profiles.reduce((sum, item) => sum + item.impact.campaigns_organized, 0),
      donated: profiles.reduce((sum, item) => sum + item.impact.total_donated_php, 0),
    }),
    [profiles]
  );

  return (
    <div>
      <div className="community-hero">
        <div className="container">
          <div className="section-label" style={{ color: "var(--canopy-light)" }}>COMMUNITY IMPACT</div>
          <h1>Find donors and campaign organizers</h1>
          <p>
            Search public LINGAP profiles to see organized campaigns, public certificates,
            Stellar-linked activity, and community badges.
          </p>
          <div className="community-search">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by display name or organizer email..."
            />
          </div>
        </div>
      </div>

      <div className="page-inner">
        <div className="community-stats">
          {[
            { Icon: Users, label: "Public Profiles", value: totals.members.toLocaleString() },
            { Icon: Megaphone, label: "Campaigns Organized", value: totals.campaigns.toLocaleString() },
            { Icon: Heart, label: "Public Impact", value: formatPeso(totals.donated) },
          ].map((item) => (
            <div key={item.label} className="stat-card">
              <div className="flex flex-center flex-between mb-8">
                <div className="stat-label">{item.label}</div>
                <item.Icon size={16} color="var(--canopy)" strokeWidth={1.8} />
              </div>
              <div className="stat-value">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-center flex-between mb-20 community-results-head">
          <div>
            <div className="section-label">PUBLIC DIRECTORY</div>
            <h2 className="impact-panel-title">Community profiles</h2>
          </div>
          <span className="badge badge-emerald">
            <ShieldCheck size={11} /> Public-safe view
          </span>
        </div>

        {loading ? (
          <div className="empty-impact-state">Loading community profiles...</div>
        ) : profiles.length === 0 ? (
          <div className="empty-impact-state">
            <Users size={30} color="var(--canopy)" />
            <h3>No public profiles found</h3>
            <p>Try a different name or email.</p>
          </div>
        ) : (
          <div className="profile-grid">
            {profiles.map((profile) => {
              const earned = profile.badges.filter((badge) => badge.earned).length;
              return (
                <Link
                  key={profile.user.id}
                  href={`/profile/${profile.user.id}`}
                  className="profile-card"
                >
                  <div className="profile-card-head">
                    <div className="profile-avatar">
                      {profile.user.display_name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h3>{profile.user.display_name}</h3>
                      <div className="profile-role">
                        <BadgeCheck size={12} /> {formatRole(profile.user.role)}
                      </div>
                    </div>
                  </div>

                  <div className="profile-mini-stats">
                    <div>
                      <strong>{formatPeso(profile.impact.total_donated_php)}</strong>
                      <span>public donations</span>
                    </div>
                    <div>
                      <strong>{profile.impact.campaigns_organized}</strong>
                      <span>campaigns</span>
                    </div>
                    <div>
                      <strong>{earned}</strong>
                      <span>badges</span>
                    </div>
                  </div>

                  <div className="profile-campaign-list">
                    {profile.top_campaigns.length > 0 ? (
                      profile.top_campaigns.map((campaign) => (
                        <span key={campaign.id}>{campaign.title}</span>
                      ))
                    ) : (
                      <span>No public campaigns yet</span>
                    )}
                  </div>

                  <div className="profile-card-foot">
                    <span>
                      <Trophy size={13} />
                      {profile.impact.community_rank ? `Rank #${profile.impact.community_rank}` : "Unranked"}
                    </span>
                    <span>
                      View profile <ArrowRight size={13} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="community-note">
          <Award size={18} color="var(--amber)" />
          <div>
            <strong>Privacy note:</strong> Public profiles show display-level impact only. Private
            dashboard controls, full emails, and non-public certificates stay hidden.
          </div>
        </div>
      </div>
    </div>
  );
}
