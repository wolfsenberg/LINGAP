import axios from "axios";
import type {
  User,
  Donation,
  Beneficiary,
  AidRequest,
  ProvenanceRecord,
  DashboardStats,
  ApiResponse,
  PaginatedResponse,
} from "@/types";

type ApiUser = {
  id: string;
  email: string;
  name: string;
  role: User["role"];
  stellar_public_key?: string | null;
  kyc_verified: boolean;
  created_at: string;
};

type RegisterRequest = {
  email: string;
  name: string;
  password: string;
  role?: User["role"];
  stellarPublicKey?: string;
};

type DonationCreateRequest = {
  amount: number;
  asset: string;
  purpose?: string;
  stellarTxHash?: string;
  stellar_tx_hash?: string;
};

type ApiDonation = {
  id: string;
  donor_id: string;
  donor_name: string;
  amount: number;
  asset: string;
  purpose?: string | null;
  stellar_tx_hash: string;
  blockchain_confirmed: boolean;
  disbursed: boolean;
  disbursed_amount: number;
  created_at: string;
};

export type CampaignDriveApi = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  raised_amount: number;
  goal_amount: number;
  progress: number;
  donors: number;
  institution: string;
  location: string;
  image_src?: string | null;
  updated_at: string;
  source: string;
};

export type PublicCampaignApi = CampaignDriveApi & {
  slug: string;
  organizer_id?: string | null;
  raised_label?: string;
  goal_label?: string;
  organizer_name?: string | null;
};

export type CampaignChangeLogApi = {
  id: string;
  campaign_id: string;
  campaign_title: string;
  actor_id: string;
  actor_name: string;
  actor_email: string;
  changed_fields: string[];
  changes: Record<string, { before: unknown; after: unknown }>;
  summary: string;
  created_at: string;
};

export type CampaignEscrowApi = {
  campaign: PublicCampaignApi;
  summary: {
    total_escrowed_xlm: number;
    total_escrowed_php: number;
    released_php: number;
    locked_php: number;
    pending_verification_php: number;
    confirmed_donation_count: number;
  };
  transactions: Array<{
    id: string;
    donor_id: string;
    donor_name: string;
    amount: number;
    asset: string;
    amount_php: number;
    stellar_tx_hash: string;
    blockchain_confirmed: boolean;
    disbursed: boolean;
    disbursed_amount: number;
    created_at: string;
  }>;
};

export type ProofCenterApi = {
  stats: {
    verified_documents: number;
    confirmed_donations: number;
    anchored_documents: number;
    verified_amount_php: number;
  };
  risk_feed: Array<{
    campaign_id: string;
    campaign_title: string;
    level: "LOW RISK" | "AWAITING PROOF" | string;
    status: string;
    confidence: number;
    created_at: string;
  }>;
  documents: Array<{
    id: string;
    kind: string;
    title: string;
    filename?: string | null;
    campaign_id?: string;
    campaign_title: string;
    donor_name?: string;
    claimed_amount: number;
    amount_xlm?: number;
    sha256?: string | null;
    stellar_tx_hash?: string | null;
    created_at: string;
    status: string;
    source: "confirmed_donation" | "proof_artifact" | string;
  }>;
};

export type LeaderboardDonorApi = {
  rank: number;
  user_id: string;
  name: string;
  total_donated: number;
  donation_count: number;
  last_donation_at?: string | null;
};

export type PublicProfileCampaignApi = PublicCampaignApi;

export type PublicProfileApi = {
  user: {
    id: string;
    display_name: string;
    role: string;
    kyc_verified: boolean;
    joined_at: string;
  };
  impact: {
    total_donated_xlm: number;
    total_donated_php: number;
    donation_count: number;
    campaigns_organized: number;
    active_campaigns: number;
    completed_campaigns: number;
    public_certificates: number;
    community_rank?: number | null;
    last_activity_at?: string | null;
  };
  campaigns: PublicProfileCampaignApi[];
  certificates: Array<{
    id: string;
    beneficiary_name: string;
    amount: number;
    lives_touched: number;
    stellar_tx_hash?: string | null;
    verified: boolean;
    created_at: string;
  }>;
  activity: Array<{
    id: string;
    campaign_id: string;
    amount: number;
    asset: string;
    stellar_tx_hash: string;
    created_at: string;
  }>;
  badges: Array<{
    title: string;
    description: string;
    earned: boolean;
  }>;
};

export type PublicProfileSearchResultApi = {
  user: PublicProfileApi["user"];
  impact: PublicProfileApi["impact"];
  top_campaigns: PublicProfileCampaignApi[];
  badges: PublicProfileApi["badges"];
};

const normalizeUser = (user: ApiUser): User => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  stellarPublicKey: user.stellar_public_key ?? undefined,
  kycVerified: user.kyc_verified,
  createdAt: user.created_at,
});

const normalizeDonation = (donation: ApiDonation): Donation => ({
  id: donation.id,
  donorId: donation.donor_id,
  donorName: donation.donor_name,
  amount: donation.amount,
  asset: donation.asset,
  purpose: donation.purpose ?? undefined,
  stellarTxHash: donation.stellar_tx_hash,
  blockchainConfirmed: donation.blockchain_confirmed,
  disbursed: donation.disbursed,
  disbursedAmount: donation.disbursed_amount,
  createdAt: donation.created_at,
});

const normalizePaginatedDonations = (res: PaginatedResponse<ApiDonation>): PaginatedResponse<Donation> => ({
  ...res,
  items: res.items.map(normalizeDonation),
});

function getApiBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL;
  const productionUrl = "https://lingap.onrender.com";

  if (typeof window === "undefined") {
    return configuredUrl || productionUrl;
  }

  const isLocalFrontend =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  const isLocalApi =
    !configuredUrl ||
    configuredUrl.includes("localhost") ||
    configuredUrl.includes("127.0.0.1");

  if (!isLocalFrontend && isLocalApi) return productionUrl;
  return configuredUrl || (isLocalFrontend ? "http://localhost:8000" : productionUrl);
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { "Content-Type": "application/json" },
});

export { api };

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("lingap_token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("lingap_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await api.post<ApiResponse<{ token: string; user: ApiUser }>>("/api/v1/auth/login", { email, password });
    return {
      ...res,
      data: {
        ...res.data,
        data: {
          token: res.data.data.token,
          user: normalizeUser(res.data.data.user),
        },
      },
    };
  },
  adminLogin: async (email: string, password: string) => {
    const res = await api.post<ApiResponse<{ token: string; user: ApiUser }>>("/api/v1/auth/admin-login", {
      email,
      password,
    });
    return {
      ...res,
      data: {
        ...res.data,
        data: {
          token: res.data.data.token,
          user: normalizeUser(res.data.data.user),
        },
      },
    };
  },
  register: async (data: RegisterRequest) => {
    const res = await api.post<ApiResponse<ApiUser>>("/api/v1/auth/register", {
      email: data.email,
      name: data.name,
      password: data.password,
      role: data.role ?? "donor",
      stellar_public_key: data.stellarPublicKey || null,
    });
    return {
      ...res,
      data: {
        ...res.data,
        data: normalizeUser(res.data.data),
      },
    };
  },
  me: async () => {
    const res = await api.get<ApiResponse<ApiUser>>("/api/v1/auth/me");
    return {
      ...res,
      data: {
        ...res.data,
        data: normalizeUser(res.data.data),
      },
    };
  },
};

export const donationsApi = {
  list: async (page = 1, size = 20) => {
    const res = await api.get<PaginatedResponse<ApiDonation>>("/api/v1/donations", { params: { page, size } });
    return { ...res, data: normalizePaginatedDonations(res.data) };
  },
  mine: async (page = 1, size = 20) => {
    const res = await api.get<PaginatedResponse<ApiDonation>>("/api/v1/donations/me", { params: { page, size } });
    return { ...res, data: normalizePaginatedDonations(res.data) };
  },
  get: async (id: string) => {
    const res = await api.get<ApiResponse<ApiDonation>>(`/api/v1/donations/${id}`);
    return { ...res, data: { ...res.data, data: normalizeDonation(res.data.data) } };
  },
  create: (data: DonationCreateRequest) =>
    api.post<ApiResponse<ApiDonation>>("/api/v1/donations", {
      amount: data.amount,
      asset: data.asset,
      purpose: data.purpose,
      stellar_tx_hash: data.stellar_tx_hash ?? data.stellarTxHash,
    }).then((res) => ({ ...res, data: { ...res.data, data: normalizeDonation(res.data.data) } })),
  getProvenance: (id: string) =>
    api.get<ApiResponse<ProvenanceRecord[]>>(`/api/v1/donations/${id}/provenance`),
};

export const beneficiariesApi = {
  list: (page = 1, size = 20) =>
    api.get<PaginatedResponse<Beneficiary>>("/api/v1/beneficiaries", { params: { page, size } }),
  get: (id: string) => api.get<ApiResponse<Beneficiary>>(`/api/v1/beneficiaries/${id}`),
  create: (data: Partial<Beneficiary>) =>
    api.post<ApiResponse<Beneficiary>>("/api/v1/beneficiaries", data),
  verify: (id: string) =>
    api.patch<ApiResponse<Beneficiary>>(`/api/v1/beneficiaries/${id}/verify`),
};

export const aidRequestsApi = {
  list: (page = 1, size = 20, status?: string) =>
    api.get<PaginatedResponse<AidRequest>>("/api/v1/aid-requests", {
      params: { page, size, status },
    }),
  get: (id: string) => api.get<ApiResponse<AidRequest>>(`/api/v1/aid-requests/${id}`),
  create: (data: Partial<AidRequest>) =>
    api.post<ApiResponse<AidRequest>>("/api/v1/aid-requests", data),
  approve: (id: string) =>
    api.patch<ApiResponse<AidRequest>>(`/api/v1/aid-requests/${id}/approve`),
  disburse: (id: string) =>
    api.patch<ApiResponse<AidRequest>>(`/api/v1/aid-requests/${id}/disburse`),
  reject: (id: string, reason: string) =>
    api.patch<ApiResponse<AidRequest>>(`/api/v1/aid-requests/${id}/reject`, { reason }),
};

export const dashboardApi = {
  stats: () => api.get<ApiResponse<DashboardStats>>("/api/v1/dashboard/stats"),
};

export const campaignsApi = {
  publicList: () => api.get<ApiResponse<PublicCampaignApi[]>>("/api/v1/campaigns/public"),
  proofCenter: () => api.get<ApiResponse<ProofCenterApi>>("/api/v1/campaigns/proof-center"),
  publicOne: (campaignId: string) =>
    api.get<ApiResponse<PublicCampaignApi | null>>(`/api/v1/campaigns/public/${campaignId}`),
  escrow: (campaignId: string) =>
    api.get<ApiResponse<CampaignEscrowApi | null>>(`/api/v1/campaigns/public/${campaignId}/escrow`),
  mine: () => api.get<ApiResponse<CampaignDriveApi[]>>("/api/v1/campaigns/mine"),
  changeLog: (limit = 25) =>
    api.get<ApiResponse<CampaignChangeLogApi[]>>("/api/v1/campaigns/admin/change-log", {
      params: { limit },
    }),
  uploadCover: async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post<ApiResponse<{ url: string }>>("/api/v1/campaigns/uploads/cover", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const url = res.data.data.url;
    return {
      ...res,
      data: {
        ...res.data,
        data: {
          url: url.startsWith("http") ? url : `${getApiBaseUrl()}${url}`,
        },
      },
    };
  },
  create: (data: {
    title: string;
    description: string;
    category: string;
    institution: string;
    location: string;
    goal_amount: number;
    image_src?: string | null;
  }) => api.post<ApiResponse<CampaignDriveApi>>("/api/v1/campaigns", data),
  update: (
    campaignId: string,
    data: Partial<{
      title: string;
      description: string;
      category: string;
      institution: string;
      location: string;
      goal_amount: number;
      image_src: string | null;
    }>
  ) => api.patch<ApiResponse<CampaignDriveApi>>(`/api/v1/campaigns/${campaignId}`, data),
};

export const donorsApi = {
  leaderboard: (limit = 10) =>
    api.get<ApiResponse<LeaderboardDonorApi[]>>("/api/v1/donors/leaderboard", {
      params: { limit },
    }),
  myImpact: () =>
    api.get<ApiResponse<{ name: string; total_donated: number; campaigns_helped: number; lives_impacted: number }>>(
      "/api/v1/donors/me/impact"
    ),
};

export const profilesApi = {
  search: (q = "", limit = 8) =>
    api.get<ApiResponse<PublicProfileSearchResultApi[]>>("/api/v1/profiles/search", {
      params: { q, limit },
    }),
  me: () =>
    api.get<ApiResponse<PublicProfileApi>>("/api/v1/profiles/me"),
  get: (userId: string) =>
    api.get<ApiResponse<PublicProfileApi | null>>(`/api/v1/profiles/${userId}`),
};

export const stellarApi = {
  verifyTransaction: (txHash: string) =>
    api.get<ApiResponse<{ confirmed: boolean; ledger: number }>>("/api/v1/stellar/verify", {
      params: { tx_hash: txHash },
    }),
  accountInfo: (publicKey: string) =>
    api.get<ApiResponse<{ balance: string; sequence: string }>>("/api/v1/stellar/account", {
      params: { public_key: publicKey },
    }),
};

export const escrowApi = {
  // Donor: get unsigned XDR → sign with Freighter → submit
  getDepositXdr: (campaignId: number, donorPublicKey: string, amountXlm: number) =>
    api.post<ApiResponse<{ xdr: string }>>("/api/v1/stellar/escrow/deposit-xdr", {
      campaign_id: campaignId,
      donor_public_key: donorPublicKey,
      amount_xlm: amountXlm,
    }),
  submitSignedXdr: (signedXdr: string) =>
    api.post<ApiResponse<{ tx_hash: string }>>("/api/v1/stellar/escrow/submit", {
      signed_xdr: signedXdr,
    }),

  // Admin: milestone lifecycle
  verifyMilestone: (campaignId: number) =>
    api.post<ApiResponse<{ tx_hash: string }>>(`/api/v1/stellar/escrow/verify/${campaignId}`),
  releaseMilestone: (campaignId: number) =>
    api.post<ApiResponse<{ tx_hash: string }>>(`/api/v1/stellar/escrow/release/${campaignId}`),
  pauseCampaign: (campaignId: number) =>
    api.post<ApiResponse<{ tx_hash: string }>>(`/api/v1/stellar/escrow/pause/${campaignId}`),
  unpauseCampaign: (campaignId: number) =>
    api.post<ApiResponse<{ tx_hash: string }>>(`/api/v1/stellar/escrow/unpause/${campaignId}`),

  // Read-only
  getCampaign: (campaignId: number) =>
    api.get<ApiResponse<{ campaign_id: number; result_xdr: string }>>(`/api/v1/stellar/escrow/campaign/${campaignId}`),
  getCampaignCount: () =>
    api.get<ApiResponse<{ count: number }>>("/api/v1/stellar/escrow/count"),

  // Donor voting
  getVoteXdr: (campaignId: number, donorPublicKey: string) =>
    api.post<ApiResponse<{ xdr: string; action: string }>>(`/api/v1/stellar/escrow/vote/${campaignId}`, {
      donor_public_key: donorPublicKey,
    }),
  getRevokeVoteXdr: (campaignId: number, donorPublicKey: string) =>
    api.delete<ApiResponse<{ xdr: string; action: string }>>(`/api/v1/stellar/escrow/vote/${campaignId}`, {
      data: { donor_public_key: donorPublicKey },
    }),
  getVoteStatus: (campaignId: number, donorPublicKey?: string) =>
    api.get<ApiResponse<{ campaign_id: number; campaign_xdr: string; donor_has_voted: boolean | null }>>(
      `/api/v1/stellar/escrow/votes/${campaignId}`,
      { params: donorPublicKey ? { donor_public_key: donorPublicKey } : {} }
    ),
  executeClawback: (campaignId: number) =>
    api.post<ApiResponse<{ tx_hash: string }>>(`/api/v1/stellar/escrow/clawback/${campaignId}`),
};

export type VolunteerOpportunity = {
  id: string;
  organizer_id?: string;
  organizer_name: string;
  campaign_name: string;
  title: string;
  description: string;
  category: "medical" | "legal" | "tech" | "logistics" | "teaching" | "counseling" | "construction" | "other";
  skills_needed: string[];
  location: string;
  schedule: string;
  slots: number;
  slots_filled: number;
  slots_remaining: number;
  status: "open" | "filled" | "closed";
  urgent: boolean;
  my_signup_status: "pending" | "accepted" | "rejected" | null;
  signup_id?: string;
  applied_at?: string | null;
  created_at: string | null;
};

export const volunteerApi = {
  listOpportunities: (category?: string) =>
    api.get<ApiResponse<VolunteerOpportunity[]>>("/api/v1/volunteer/opportunities", {
      params: category ? { category } : undefined,
    }),
  getStats: () =>
    api.get<ApiResponse<{ open_opportunities: number; total_volunteers: number; slots_needed: number }>>(
      "/api/v1/volunteer/stats"
    ),
  apply: (opportunityId: string, message: string, skills: string[]) =>
    api.post<ApiResponse<{ id: string; status: string }>>(`/api/v1/volunteer/opportunities/${opportunityId}/apply`, {
      message,
      skills,
    }),
  mySignups: () => api.get<ApiResponse<VolunteerOpportunity[]>>("/api/v1/volunteer/me/signups"),
};

export const certificatesApi = {
  listByDonor: (donorId: string) =>
    api.get<ApiResponse<any[]>>(`/api/v1/certificates`, { params: { donor_id: donorId } }),
  get: (id: string) => api.get<ApiResponse<any>>(`/api/v1/certificates/${id}`),
};

export const paymongoApi = {
  checkout: (amount: number, description: string) =>
    api.post<ApiResponse<{ checkout_url: string }>>("/api/v1/fiat/checkout", { amount, description }),
};

export default api;
