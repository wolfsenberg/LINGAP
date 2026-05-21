import axios from "axios";
import type {
  User,
  Donation,
  Beneficiary,
  AidRequest,
  ProvenanceRecord,
  DashboardStats,
  DonationCertificate,
  ApiResponse,
  PaginatedResponse,
} from "@/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});

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
  login: (email: string, password: string) =>
    api.post<ApiResponse<{ token: string; user: User }>>("/api/v1/auth/login", { email, password }),
  register: (data: Partial<User> & { password: string }) =>
    api.post<ApiResponse<User>>("/api/v1/auth/register", data),
  me: () => api.get<ApiResponse<User>>("/api/v1/auth/me"),
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

export const paymongoApi = {
  checkout: (amount_php: number, purpose: string) =>
    api.post<ApiResponse<{ checkout_url: string; checkout_id: string; donation_id: string }>>(
      "/api/v1/paymongo/checkout",
      { amount_php, purpose }
    ),
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

export const certificatesApi = {
  get: (id: string) =>
    api.get<ApiResponse<DonationCertificate>>(`/api/v1/certificates/${id}`),
  getByDonation: (donationId: string) =>
    api.get<ApiResponse<DonationCertificate>>(`/api/v1/certificates/donation/${donationId}`),
  listByDonor: (donorId: string) =>
    api.get<ApiResponse<DonationCertificate[]>>(`/api/v1/certificates/donor/${donorId}/all`),
  updateVisibility: (id: string, isPublic: boolean) =>
    api.patch<ApiResponse<DonationCertificate>>(`/api/v1/certificates/${id}`, {
      is_public: isPublic,
    }),
  getDownloadUrl: (id: string) =>
    api.get<ApiResponse<{ download_url: string; filename: string }>>(`/api/v1/certificates/${id}/download`),
};

export default api;
