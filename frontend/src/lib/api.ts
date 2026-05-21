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

const normalizeUser = (user: ApiUser): User => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  stellarPublicKey: user.stellar_public_key ?? undefined,
  kycVerified: user.kyc_verified,
  createdAt: user.created_at,
});

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
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
  list: (page = 1, size = 20) =>
    api.get<PaginatedResponse<Donation>>("/api/v1/donations", { params: { page, size } }),
  get: (id: string) => api.get<ApiResponse<Donation>>(`/api/v1/donations/${id}`),
  create: (data: Partial<Donation>) => api.post<ApiResponse<Donation>>("/api/v1/donations", data),
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
