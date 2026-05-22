"use client";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  Heart,
  Users,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Activity,
} from "lucide-react";
import { dashboardApi, aidRequestsApi } from "@/lib/api";
import { format } from "date-fns";

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  color = "brand",
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
  color?: "brand" | "blue" | "amber" | "red";
}) {
  const colorMap = {
    brand: "bg-brand-50 text-brand-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <div className="card flex items-start gap-4">
      <div className={`rounded-xl p-3 ${colorMap[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboardApi.stats().then((r) => r.data.data),
  });

  // Fetch all campaigns for dynamic classification stats
  const { data: campaignsData, isLoading: campaignsLoading } = useQuery({
    queryKey: ["all-campaigns-stats"],
    queryFn: () => aidRequestsApi.list(1, 1000).then((r) => r.data),
  });

  if (isLoading || campaignsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  const stats = data ?? {
    totalDonations: 0,
    totalDisbursed: 0,
    activeBeneficiaries: 0,
    pendingRequests: 0,
    fundUtilizationRate: 0,
    recentTransactions: [],
  };

  // --- Dynamic Classification Metrics ---
  const campaigns: any[] = campaignsData?.items ?? [];

  // Active Campaigns: count where status === 'active' (or approved/pending as active equivalents)
  const activeCampaigns = campaigns.filter(
    (c) => c.status === "active" || c.status === "approved" || c.status === "pending"
  ).length;

  // Verified Campaigns: count where is_verified === true
  const verifiedCampaigns = campaigns.filter(
    (c) => c.is_verified === true
  ).length;

  // Total Requested: aggregate sum of requested_amount
  const totalRequested = campaigns.reduce(
    (sum: number, c: any) => sum + (c.requested_amount || c.requestedAmount || 0),
    0
  );

  // Confirmed Fraud: count where status === 'fraud' or classification === 'fraud'
  const confirmedFraud = campaigns.filter(
    (c) => c.status === "fraud" || c.classification === "fraud"
  ).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Real-time overview of LINGAP aid operations
        </p>
      </div>

      {/* Dynamic Campaign Classification Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Campaigns"
          value={activeCampaigns}
          icon={Activity}
          sub={`${campaigns.length} total campaigns`}
          color="brand"
        />
        <StatCard
          label="Verified Campaigns"
          value={verifiedCampaigns}
          icon={ShieldCheck}
          sub="is_verified = true"
          color="blue"
        />
        <StatCard
          label="Total Requested"
          value={`₱${totalRequested.toLocaleString()}`}
          icon={TrendingUp}
          sub="Sum of all requested amounts"
          color="amber"
        />
        <StatCard
          label="Confirmed Fraud"
          value={confirmedFraud}
          icon={ShieldAlert}
          sub={confirmedFraud === 0 ? "Zero fraud detected" : `${confirmedFraud} flagged`}
          color="red"
        />
      </div>

      {/* Original financial stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Donations"
          value={`₱${stats.totalDonations.toLocaleString()}`}
          icon={Heart}
          sub="Received on-chain"
          color="brand"
        />
        <StatCard
          label="Total Disbursed"
          value={`₱${stats.totalDisbursed.toLocaleString()}`}
          icon={TrendingUp}
          sub="Sent to beneficiaries"
          color="blue"
        />
        <StatCard
          label="Active Beneficiaries"
          value={stats.activeBeneficiaries}
          icon={Users}
          sub="Verified recipients"
          color="brand"
        />
        <StatCard
          label="Pending Requests"
          value={stats.pendingRequests}
          icon={Clock}
          sub="Awaiting approval"
          color="amber"
        />
      </div>

      {/* Utilization rate */}
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Fund Utilization Rate</h2>
          <span className="text-2xl font-bold text-brand-600">
            {stats.fundUtilizationRate.toFixed(1)}%
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all"
            style={{ width: `${stats.fundUtilizationRate}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          {stats.fundUtilizationRate.toFixed(1)}% of received funds successfully disbursed to
          verified beneficiaries
        </p>
      </div>

      {/* Recent transactions */}
      <div className="card">
        <h2 className="mb-4 font-semibold text-gray-900">Recent Blockchain Transactions</h2>
        {stats.recentTransactions.length === 0 ? (
          <p className="text-center py-8 text-sm text-gray-400">No transactions yet</p>
        ) : (
          <div className="space-y-3">
            {stats.recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-4"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-brand-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      ₱{tx.amount.toLocaleString()} {tx.asset}
                    </p>
                    <p className="text-xs text-gray-500">
                      Ledger #{tx.ledger} ·{" "}
                      {format(new Date(tx.timestamp), "MMM d, yyyy HH:mm")}
                    </p>
                  </div>
                </div>
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${tx.stellarTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-brand-600 hover:underline"
                >
                  View <ArrowUpRight className="h-3 w-3" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
