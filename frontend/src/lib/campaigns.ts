export type SpendItem = {
  label: string;
  pct: number;
  amount: string;
  bg: string;
};

export type Milestone = {
  dot: string;
  title: string;
  sub: string;
  badge: string;
  badgeText: string;
};

export type Campaign = {
  id: number;
  slug: string;
  category: "Community" | "Animal Rescue" | "Disaster Relief" | "Medical" | "Education";
  urgencyLabel: string | null;
  urgencyClass: string | null;
  title: string;
  shortTitle: string;
  description: string;
  story: string[];
  organizer: string;
  location: string;
  startDate: string;
  institution: string;
  institutionBadge: string;
  institutionDesc: string;
  raisedLabel: string;
  raised: number;
  goal: number;
  goalLabel: string;
  donors: number;
  daysLeft: number;
  pct: number;
  credibility: number;
  transparencyScore: number;
  heroGradient: string;
  heroIcon: string;
  imageSrc: string;
  accentColor: string;
  spending: SpendItem[];
  milestones: Milestone[];
};

export type PublicCampaignSummary = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  status: string;
  raised_amount: number;
  goal_amount: number;
  raised_label?: string;
  goal_label?: string;
  progress: number;
  donors: number;
  institution: string;
  location: string;
  image_src?: string | null;
  updated_at: string;
  source: string;
  organizer_name?: string | null;
};

function pesoLabel(amount: number) {
  return `₱${Math.round(amount).toLocaleString()}`;
}

export function applyCampaignSummary(campaign: Campaign, summary?: PublicCampaignSummary): Campaign {
  if (!summary) return campaign;

  return {
    ...campaign,
    raised: summary.raised_amount,
    raisedLabel: summary.raised_label ?? pesoLabel(summary.raised_amount),
    goal: summary.goal_amount,
    goalLabel: summary.goal_label ?? pesoLabel(summary.goal_amount),
    donors: summary.donors,
    pct: summary.progress,
  };
}

export function mergeCampaignSummaries(summaries: PublicCampaignSummary[]) {
  const bySlug = new Map(summaries.map((item) => [item.slug, item]));
  return CAMPAIGNS.map((campaign) => applyCampaignSummary(campaign, bySlug.get(campaign.slug)));
}

export const CAMPAIGNS: Campaign[] = [
  {
    id: 0,
    slug: "kuya-gino-home-repair",
    category: "Community",
    urgencyLabel: "URGENT",
    urgencyClass: "badge-red",
    title: "Help Kuya Gino Make His Home Safe",
    shortTitle: "Kuya Gino — Home Repair",
    description:
      "Taho vendor Kuya Gino has worked 7 days a week for 10 years for his family. Their house has no doors or windows. Funds will install doors, windows, and fixtures to make their home safe.",
    story: [
      "We spent the day selling taho with Kuya Gino. He's worked seven days a week for the last ten years to provide for his partner and four kids. No complaints.",
      "Their house has no doors. No windows. Just open frames where they should be. The family is exposed to the elements, to insects, and to the risks that come with an unsecured home in the city.",
      "We're raising funds to help him change that — to make his home safe for his family. All funds go directly to verified construction materials and contracted labor, released milestone by milestone through LINGAP's escrow system.",
    ],
    organizer: "Cameron Graham (BayanihanPH)",
    location: "Manila, Metro Manila, Philippines",
    startDate: "May 15, 2026",
    institution: "BayanihanPH",
    institutionBadge: "Verified Community Crowdfunding Platform",
    institutionDesc: "BayanihanPH Verified",
    raisedLabel: "₱7,498",
    raised: 7498,
    goal: 15000,
    goalLabel: "₱15,000",
    donors: 6,
    daysLeft: 30,
    pct: 50,
    credibility: 9.2,
    transparencyScore: 92,
    heroGradient: "linear-gradient(135deg,#1a2a3a,#2d4a6a)",
    heroIcon: "🏠",
    imageSrc: "/images/help_kuya_gino.png",
    accentColor: "var(--canopy)",
    spending: [
      { label: "🚪 Doors & Window Frames", pct: 55, amount: "₱8,250", bg: "linear-gradient(90deg,var(--forest),var(--forest-light))" },
      { label: "🔨 Labor & Installation", pct: 25, amount: "₱3,750", bg: "linear-gradient(90deg,var(--canopy),var(--canopy-light))" },
      { label: "🪟 Glass & Fittings", pct: 12, amount: "₱1,800", bg: "linear-gradient(90deg,var(--amber),var(--amber-light))" },
      { label: "🔩 Hardware & Supplies", pct: 8, amount: "₱1,200", bg: "linear-gradient(90deg,#6d28d9,#8b5cf6)" },
    ],
    milestones: [
      { dot: "ml-dot-done", title: "✅ Campaign Created & Verified", sub: "May 15, 2026 • BayanihanPH identity documents reviewed", badge: "badge-emerald", badgeText: "Complete" },
      { dot: "ml-dot-active", title: "⏳ Milestone 1: Materials Procurement", sub: "In progress • Fundraising underway, 50% of goal reached", badge: "badge-blue", badgeText: "Fundraising" },
      { dot: "ml-dot-pending", title: "🔒 Milestone 2: Installation & Labor", sub: "Locked • Unlocks upon full materials funding", badge: "badge-navy", badgeText: "Locked" },
      { dot: "ml-dot-pending", title: "🏁 Final: Home Handover & Photo Verification", sub: "Locked • Completion photos uploaded to Proof Center", badge: "badge-navy", badgeText: "Locked" },
    ],
  },
  {
    id: 1,
    slug: "rescue-cats-shelter",
    category: "Animal Rescue",
    urgencyLabel: "Active",
    urgencyClass: "badge-orange",
    title: "Help Build a Safe Shelter for 39 Rescue Cats",
    shortTitle: "39 Rescue Cats — Safe Shelter",
    description:
      "Student rescuer Thomas Dymek is seeking funds to build a weatherproof shelter and cover ongoing veterinary care, food, and maintenance for 39 rescued cats.",
    story: [
      "Hi, I'm a student and a solo rescuer caring for 39 cats who were abandoned and left without food, water, or shelter. Each one was saved from the streets — some were injured, others malnourished.",
      "To provide them with a permanent, safe space I need to build a dedicated shelter structure. The funds will cover construction materials, basic fixtures, ongoing veterinary checkups, vaccines, food, and emergency medical care.",
      "Every donation is tracked and receipted. Build photos and vet receipts will be uploaded as proof. 523 donors have already shown their support — help us reach the finish line.",
    ],
    organizer: "Thomas Dymek (GoFundMe)",
    location: "Philippines",
    startDate: "Apr 20, 2026",
    institution: "GoFundMe Campaign",
    institutionBadge: "Verified GoFundMe Fundraiser",
    institutionDesc: "GoFundMe Verified",
    raisedLabel: "₱756,728",
    raised: 756728,
    goal: 900000,
    goalLabel: "₱900,000",
    donors: 523,
    daysLeft: 14,
    pct: 84,
    credibility: 9.0,
    transparencyScore: 90,
    heroGradient: "linear-gradient(135deg,#1a2a1a,#2d5a2d)",
    heroIcon: "🐱",
    imageSrc: "/images/help_build_a_safe_shelter.png",
    accentColor: "var(--forest)",
    spending: [
      { label: "🏗️ Shelter Construction", pct: 50, amount: "₱450,000", bg: "linear-gradient(90deg,var(--forest),var(--forest-light))" },
      { label: "🩺 Veterinary Care & Vaccines", pct: 25, amount: "₱225,000", bg: "linear-gradient(90deg,var(--canopy),var(--canopy-light))" },
      { label: "🍽️ Food & Nutrition", pct: 15, amount: "₱135,000", bg: "linear-gradient(90deg,var(--amber),var(--amber-light))" },
      { label: "🔧 Maintenance & Supplies", pct: 10, amount: "₱90,000", bg: "linear-gradient(90deg,#6d28d9,#8b5cf6)" },
    ],
    milestones: [
      { dot: "ml-dot-done", title: "✅ Campaign Launched & Verified", sub: "Apr 20, 2026 • GoFundMe organizer identity confirmed", badge: "badge-emerald", badgeText: "Complete" },
      { dot: "ml-dot-done", title: "✅ Milestone 1: Emergency Vet & Food", sub: "May 2026 • Immediate care funded for all 39 cats", badge: "badge-emerald", badgeText: "Funded" },
      { dot: "ml-dot-active", title: "⏳ Milestone 2: Shelter Construction", sub: "In progress • Materials sourced, build underway", badge: "badge-blue", badgeText: "Building" },
      { dot: "ml-dot-pending", title: "🔒 Milestone 3: Ongoing Care Fund", sub: "Locked • 3-month food and vet reserve", badge: "badge-navy", badgeText: "Locked" },
      { dot: "ml-dot-pending", title: "🏁 Final: Shelter Completion & Handover", sub: "Locked • Full photo & vet report uploaded", badge: "badge-navy", badgeText: "Locked" },
    ],
  },
  {
    id: 2,
    slug: "bulacan-dog-cat-rescue",
    category: "Animal Rescue",
    urgencyLabel: "Critical",
    urgencyClass: "badge-red",
    title: "Rescue and Care for Abandoned Dogs and Cats in Bulacan",
    shortTitle: "Bulacan Animal Rescue — Dogs & Cats",
    description:
      "In Pulilan, Bulacan, countless dogs and cats are abandoned daily. Eden Cayamanda's rescue operation covers vet fees, food, and shelter for rescued animals.",
    story: [
      "In the Philippines, countless dogs and cats are left abandoned and left to fend for themselves. In Pulilan, Bulacan, our small rescue operation takes them in — animals found injured on the road, starving in alleys, or surrendered by families who can no longer care for them.",
      "Every rescued animal receives a vet checkup, vaccinations, deworming, food, and a safe place to stay. We work with local vets and rely entirely on donations to fund day-to-day operations. There is no government funding and no institutional support.",
      "Your donation directly pays for vet bills, food bags, and basic shelter maintenance. With 10 donors already contributing $230 of our $900 goal, we are already making a difference — but we need more help to sustain operations month to month.",
    ],
    organizer: "Eden Cayamanda (GoFundMe)",
    location: "Pulilan, Bulacan, Philippines",
    startDate: "Feb 10, 2026",
    institution: "GoFundMe Campaign",
    institutionBadge: "Verified GoFundMe Fundraiser",
    institutionDesc: "GoFundMe Verified",
    raisedLabel: "₱13,110",
    raised: 13110,
    goal: 51300,
    goalLabel: "₱51,300",
    donors: 10,
    daysLeft: 60,
    pct: 26,
    credibility: 8.7,
    transparencyScore: 87,
    heroGradient: "linear-gradient(135deg,#2a1a1a,#5a2d2d)",
    heroIcon: "🐾",
    imageSrc: "/images/rescue_and_care.png",
    accentColor: "var(--amber)",
    spending: [
      { label: "🩺 Veterinary Care & Meds", pct: 45, amount: "₱23,085", bg: "linear-gradient(90deg,var(--amber),var(--amber-light))" },
      { label: "🍖 Food & Nutrition", pct: 35, amount: "₱17,955", bg: "linear-gradient(90deg,var(--forest),var(--forest-light))" },
      { label: "🏠 Shelter Maintenance", pct: 12, amount: "₱6,156", bg: "linear-gradient(90deg,var(--canopy),var(--canopy-light))" },
      { label: "🚗 Transport & Logistics", pct: 8, amount: "₱4,104", bg: "linear-gradient(90deg,#6d28d9,#8b5cf6)" },
    ],
    milestones: [
      { dot: "ml-dot-done", title: "✅ Rescue Operations Started", sub: "Feb 10, 2026 • First wave of animals admitted and triaged", badge: "badge-emerald", badgeText: "Complete" },
      { dot: "ml-dot-active", title: "⏳ Milestone 1: Monthly Vet & Food Run", sub: "In progress • 10 donors funded first month of operations", badge: "badge-blue", badgeText: "Ongoing" },
      { dot: "ml-dot-pending", title: "🔒 Milestone 2: Shelter Expansion", sub: "Locked • Additional kennels and cat enclosures", badge: "badge-navy", badgeText: "Locked" },
      { dot: "ml-dot-pending", title: "🏁 Final: 3-Month Sustainability Reserve", sub: "Locked • Ensures operations continue without interruption", badge: "badge-navy", badgeText: "Locked" },
    ],
  },
];

export function getCampaign(id: number): Campaign | undefined {
  return CAMPAIGNS.find((c) => c.id === id);
}
