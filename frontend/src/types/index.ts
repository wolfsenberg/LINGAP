export type StellarNetwork = "testnet" | "mainnet";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "donor" | "beneficiary" | "aid_worker";
  stellarPublicKey?: string;
  kycVerified: boolean;
  createdAt: string;
}

export interface Beneficiary {
  id: string;
  name: string;
  nationalId: string;
  location: string;
  category: "individual" | "family" | "community" | "organization";
  needLevel: "critical" | "high" | "medium" | "low";
  verified: boolean;
  stellarPublicKey?: string;
  totalReceived: number;
  aidRequests: AidRequest[];
  createdAt: string;
}

export interface Donation {
  id: string;
  donorId: string;
  donorName: string;
  amount: number;
  asset: string;
  purpose?: string;
  stellarTxHash: string;
  blockchainConfirmed: boolean;
  disbursed: boolean;
  disbursedAmount: number;
  createdAt: string;
}

export interface AidRequest {
  id: string;
  beneficiaryId: string;
  beneficiaryName: string;
  requestedAmount: number;
  asset: string;
  purpose: string;
  status: "pending" | "approved" | "disbursed" | "rejected";
  stellarTxHash?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProvenanceRecord {
  id: string;
  donationId: string;
  aidRequestId: string;
  beneficiaryId: string;
  amount: number;
  asset: string;
  contractAddress: string;
  stellarTxHash: string;
  ledger: number;
  timestamp: string;
}

export interface DonationCertificate {
  id: string;
  donationId: string;
  s3Url: string;
  isPublic: boolean;
  donorName: string;
  amount: number;
  beneficiaryName: string;
  milestoneDescription: string;
  livesTouched: number;
  totalDonated: number;
  createdAt: string;
}

export interface DashboardStats {
  totalDonations: number;
  totalDisbursed: number;
  activeBeneficiaries: number;
  pendingRequests: number;
  fundUtilizationRate: number;
  recentTransactions: ProvenanceRecord[];
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}
