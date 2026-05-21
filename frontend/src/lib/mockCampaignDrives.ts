import { CAMPAIGNS } from "./campaigns";

export type CampaignDrive = {
  id: string;
  title: string;
  category: string;
  status: "Draft" | "Under Review" | "Active" | "Funded";
  raised: string;
  goal: string;
  progress: number;
  donors: number;
  updated: string;
  institution: string;
};

export const organizedDrives: CampaignDrive[] = CAMPAIGNS.map((c) => ({
  id: `DRV-${String(c.id).padStart(4, "0")}`,
  title: c.shortTitle,
  category: c.category,
  status: "Active",
  raised: c.raisedLabel,
  goal: c.goalLabel,
  progress: c.pct,
  donors: c.donors,
  updated: `${c.daysLeft} days left`,
  institution: c.institution,
}));
