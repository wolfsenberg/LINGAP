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
    id: "DRV-0921",
    title: "Maria Santos — Stage 3 Cancer Treatment",
    category: "Medical",
    status: "Active",
    raised: "₱182,400",
    goal: "₱250,000",
    progress: 73,
    donors: 342,
    updated: "Updated today",
    institution: "Philippine General Hospital",
  },
  {
    id: "DRV-0884",
    title: "Barangay Payatas Community Kitchen Rebuild",
    category: "Community",
    status: "Under Review",
    raised: "₱34,500",
    goal: "₱80,000",
    progress: 43,
    donors: 156,
    updated: "Updated yesterday",
    institution: "QC Social Services Partner",
  },
  {
    id: "DRV-0812",
    title: "Typhoon Carina Relief — Batangas Families",
    category: "Relief",
    status: "Active",
    raised: "₱890,000",
    goal: "₱1,200,000",
    progress: 74,
    donors: 1203,
    updated: "Updated 2 days ago",
    institution: "DSWD Batangas Relief Partner",
  },
  {
    id: "DRV-0768",
    title: "Juan dela Cruz — Engineering Scholarship",
    category: "Education",
    status: "Funded",
    raised: "₱65,000",
    goal: "₱65,000",
    progress: 100,
    donors: 104,
    updated: "Completed last week",
    institution: "Polytechnic University of the Philippines",
  },
  {
    id: "DRV-0711",
    title: "Cebu Infant Heart Surgery Fund",
    category: "Medical",
    status: "Draft",
    raised: "₱0",
    goal: "₱400,000",
    progress: 0,
    donors: 0,
    updated: "Draft saved",
    institution: "VSMMC Cebu",
  },
];
