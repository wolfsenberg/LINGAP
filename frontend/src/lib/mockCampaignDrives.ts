export type CampaignDrive = {
  id: string;
  title: string;
  category: "Medical" | "Relief" | "Education" | "Community";
  status: "Draft" | "Under Review" | "Active" | "Funded";
  raised: string;
  goal: string;
  progress: number;
  donors: number;
  updated: string;
  institution: string;
};

export const organizedDrives: CampaignDrive[] = [
  {
    id: "DRV-BPH-001",
    title: "Help Kuya Gino Make His Home Safe",
    category: "Community",
    status: "Active",
    raised: "₱7,498",
    goal: "₱15,000",
    progress: 50,
    donors: 6,
    updated: "Updated today",
    institution: "BayanihanPH",
  },
  {
    id: "DRV-GFM-002",
    title: "Help Build a Safe Shelter for 39 Rescue Cats",
    category: "Community",
    status: "Active",
    raised: "₱756,728",
    goal: "₱900,000",
    progress: 84,
    donors: 523,
    updated: "Updated yesterday",
    institution: "GoFundMe Campaign",
  },
  {
    id: "DRV-GFM-003",
    title: "Rescue and Care for Abandoned Dogs and Cats in Bulacan",
    category: "Community",
    status: "Active",
    raised: "₱13,110",
    goal: "₱51,300",
    progress: 26,
    donors: 10,
    updated: "Updated 2 days ago",
    institution: "GoFundMe Campaign",
  },
];
