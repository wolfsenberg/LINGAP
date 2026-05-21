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
  category: "Medical" | "Disaster Relief" | "Education";
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
  accentColor: string;
  spending: SpendItem[];
  milestones: Milestone[];
};

export const CAMPAIGNS: Campaign[] = [
  {
    id: 0,
    slug: "maria-santos-cancer",
    category: "Medical",
    urgencyLabel: "URGENT",
    urgencyClass: "badge-red",
    title: "Maria Santos — Stage 3 Ovarian Cancer Treatment",
    shortTitle: "Maria Santos — Stage 3 Cancer",
    description:
      "37-year-old mother of three from Quezon City. Undergoing chemotherapy at Philippine General Hospital. Needs funds for continued treatment.",
    story: [
      "Maria Santos is a 37-year-old mother of three beautiful children from Quezon City. Last March 2025, she was diagnosed with Stage 3 Ovarian Cancer at the Philippine General Hospital. Despite the devastating news, Maria continues to fight — not just for herself, but for her children who need her most.",
      "Her chemotherapy treatment costs ₱35,000 every 3 weeks. She has already completed 3 cycles but needs at least 5 more to achieve remission. Her husband, a jeepney driver, cannot sustain the cost alone.",
      "All funds go directly to PGH's billing department through LINGAP's escrow system. Not a single peso will enter Maria's or her family's personal accounts.",
    ],
    organizer: "Ana Santos (Daughter)",
    location: "Quezon City, Metro Manila",
    startDate: "Nov 12, 2025",
    institution: "Philippine General Hospital",
    institutionBadge: "DOH Accredited Level 4 Hospital",
    institutionDesc: "PGH Verified",
    raisedLabel: "₱182,400",
    raised: 182400,
    goal: 250000,
    goalLabel: "₱250,000",
    donors: 342,
    daysLeft: 12,
    pct: 73,
    credibility: 9.4,
    transparencyScore: 94,
    heroGradient: "linear-gradient(135deg,#1a3a2a,#2d5a3d)",
    heroIcon: "🏥",
    accentColor: "var(--canopy)",
    spending: [
      { label: "🏥 Chemotherapy (PGH)", pct: 60, amount: "₱150,000", bg: "linear-gradient(90deg,var(--forest),var(--forest-light))" },
      { label: "💊 Medications", pct: 20, amount: "₱50,000", bg: "linear-gradient(90deg,var(--canopy),var(--canopy-light))" },
      { label: "🩺 Lab Tests & Imaging", pct: 12, amount: "₱30,000", bg: "linear-gradient(90deg,var(--amber),var(--amber-light))" },
      { label: "🚗 Transport & Logistics", pct: 8, amount: "₱20,000", bg: "linear-gradient(90deg,#6d28d9,#8b5cf6)" },
    ],
    milestones: [
      { dot: "ml-dot-done", title: "✅ Campaign Created & Verified", sub: "Nov 12, 2025 • Documents reviewed by LINGAP team", badge: "badge-emerald", badgeText: "Complete" },
      { dot: "ml-dot-done", title: "✅ Milestone 1: Chemo Cycles 1–3", sub: "Nov 28, 2025 • ₱75,000 released to PGH Billing", badge: "badge-emerald", badgeText: "₱75,000 Released" },
      { dot: "ml-dot-active", title: "⏳ Milestone 2: Chemo Cycles 4–6", sub: "In progress • Receipts submitted, pending verification", badge: "badge-blue", badgeText: "Under Review" },
      { dot: "ml-dot-pending", title: "🔒 Milestone 3: Medication & Lab Tests", sub: "Locked • Will unlock after Milestone 2 completion", badge: "badge-navy", badgeText: "Locked" },
      { dot: "ml-dot-pending", title: "🏁 Final: Recovery & Post-Treatment", sub: "Locked • Pending previous milestones", badge: "badge-navy", badgeText: "Locked" },
    ],
  },
  {
    id: 1,
    slug: "typhoon-carina-batangas",
    category: "Disaster Relief",
    urgencyLabel: "Emergency",
    urgencyClass: "badge-orange",
    title: "Typhoon Carina Relief — 400 Batangas Families",
    shortTitle: "Typhoon Carina — Batangas Relief",
    description:
      "Immediate food packs, temporary shelter, and medicine for coastal communities in Batangas devastated by Typhoon Carina.",
    story: [
      "Typhoon Carina made landfall in Batangas on July 24, 2025, leaving over 400 families homeless along the coastal barangays of Lemery, Taal, and Agoncillo. Storm surge reached up to 3 meters in some areas, destroying homes, fishing boats, and livelihoods overnight.",
      "As of August 2025, families remain in evacuation centers with limited food, water, and medical supplies. Children and elderly are most at risk from dehydration and respiratory illness in the crowded shelters.",
      "All funds are released directly to DSWD-accredited relief partners and local government units. Every purchase is receipted and uploaded to the Proof Center before the next fund release.",
    ],
    organizer: "DSWD Batangas Provincial Office",
    location: "Batangas Province, Region IV-A",
    startDate: "Jul 26, 2025",
    institution: "DSWD Region IV-A",
    institutionBadge: "Government Accredited Relief Agency",
    institutionDesc: "DSWD Partner",
    raisedLabel: "₱890,000",
    raised: 890000,
    goal: 1200000,
    goalLabel: "₱1,200,000",
    donors: 1203,
    daysLeft: 5,
    pct: 74,
    credibility: 9.7,
    transparencyScore: 97,
    heroGradient: "linear-gradient(135deg,#1a3a2a,#3d7a52)",
    heroIcon: "⛑️",
    accentColor: "var(--canopy)",
    spending: [
      { label: "🍱 Food Packs (3,200 families)", pct: 45, amount: "₱540,000", bg: "linear-gradient(90deg,var(--forest),var(--forest-light))" },
      { label: "🏕️ Temporary Shelter Materials", pct: 30, amount: "₱360,000", bg: "linear-gradient(90deg,var(--canopy),var(--canopy-light))" },
      { label: "💊 Medical Supplies & Medicines", pct: 15, amount: "₱180,000", bg: "linear-gradient(90deg,var(--amber),var(--amber-light))" },
      { label: "🚚 Logistics & Transport", pct: 10, amount: "₱120,000", bg: "linear-gradient(90deg,#6d28d9,#8b5cf6)" },
    ],
    milestones: [
      { dot: "ml-dot-done", title: "✅ Emergency Response Activated", sub: "Jul 26, 2025 • DSWD deployed initial relief teams", badge: "badge-emerald", badgeText: "Complete" },
      { dot: "ml-dot-done", title: "✅ Milestone 1: First Wave Relief", sub: "Aug 1, 2025 • ₱350,000 released for food and shelter", badge: "badge-emerald", badgeText: "₱350,000 Released" },
      { dot: "ml-dot-active", title: "⏳ Milestone 2: Medical & Sanitation", sub: "In progress • Medicines procured, distribution ongoing", badge: "badge-blue", badgeText: "Distributing" },
      { dot: "ml-dot-pending", title: "🔒 Milestone 3: Livelihood Recovery", sub: "Locked • Fishing boat replacement and livelihood kits", badge: "badge-navy", badgeText: "Locked" },
      { dot: "ml-dot-pending", title: "🏁 Final: Home Reconstruction Support", sub: "Locked • Semi-permanent shelter for 80 families", badge: "badge-navy", badgeText: "Locked" },
    ],
  },
  {
    id: 2,
    slug: "juan-delacruz-scholar",
    category: "Education",
    urgencyLabel: null,
    urgencyClass: null,
    title: "Juan dela Cruz — PUP Engineering Scholar from Samar",
    shortTitle: "Juan dela Cruz — Engineering Scholarship",
    description:
      "19-year-old top student from Eastern Samar. Qualified for PUP Manila Engineering but cannot afford tuition and board.",
    story: [
      "Juan dela Cruz grew up in a small fishing village in Borongan, Eastern Samar. Despite having no stable electricity at home for most of his childhood, he ranked 1st in his barangay in the National Achievement Test and passed the PUP Manila College Entrance Test for BS Computer Engineering.",
      "His father fishes for a living. Their combined household income is ₱8,000 per month — not enough to cover tuition, dormitory, food, and school materials in Manila. Without support, Juan will have to decline his slot.",
      "All funds go directly to PUP Manila's Student Accounts Office and an accredited dormitory near the campus. Juan's tuition receipts and enrollment certificate are uploaded each semester as proof.",
    ],
    organizer: "Ma. Luz dela Cruz (Mother)",
    location: "Borongan, Eastern Samar",
    startDate: "Jun 5, 2025",
    institution: "Polytechnic University of the Philippines",
    institutionBadge: "CHED Accredited State University",
    institutionDesc: "PUP Verified",
    raisedLabel: "₱48,000",
    raised: 48000,
    goal: 65000,
    goalLabel: "₱65,000",
    donors: 87,
    daysLeft: 18,
    pct: 74,
    credibility: 8.9,
    transparencyScore: 91,
    heroGradient: "linear-gradient(135deg,#3d2a10,#6b4a20)",
    heroIcon: "🎓",
    accentColor: "var(--amber)",
    spending: [
      { label: "🎓 Tuition — 1st Year", pct: 55, amount: "₱35,750", bg: "linear-gradient(90deg,var(--amber),var(--amber-light))" },
      { label: "🏠 Dormitory (10 months)", pct: 25, amount: "₱16,250", bg: "linear-gradient(90deg,var(--forest),var(--forest-light))" },
      { label: "📚 Books & Materials", pct: 12, amount: "₱7,800", bg: "linear-gradient(90deg,var(--canopy),var(--canopy-light))" },
      { label: "🍱 Daily Allowance", pct: 8, amount: "₱5,200", bg: "linear-gradient(90deg,#6d28d9,#8b5cf6)" },
    ],
    milestones: [
      { dot: "ml-dot-done", title: "✅ Campaign Verified & Approved", sub: "Jun 5, 2025 • PUP acceptance letter and grades validated", badge: "badge-emerald", badgeText: "Complete" },
      { dot: "ml-dot-done", title: "✅ Milestone 1: Enrollment & Tuition", sub: "Jun 20, 2025 • ₱35,750 released to PUP Student Accounts", badge: "badge-emerald", badgeText: "₱35,750 Released" },
      { dot: "ml-dot-active", title: "⏳ Milestone 2: Dormitory & Allowance", sub: "In progress • Dorm receipt submitted, under review", badge: "badge-blue", badgeText: "Under Review" },
      { dot: "ml-dot-pending", title: "🔒 Milestone 3: 2nd Semester Tuition", sub: "Locked • Unlocks Nov 2025 upon passing grades submitted", badge: "badge-navy", badgeText: "Locked" },
    ],
  },
];

export function getCampaign(id: number): Campaign | undefined {
  return CAMPAIGNS.find((c) => c.id === id);
}
