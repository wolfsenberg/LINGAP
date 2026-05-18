"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, ArrowUpRight, CheckCircle2, Clock, Plus, X } from "lucide-react";
import { donationsApi } from "@/lib/api";
import { format } from "date-fns";
import type { Donation } from "@/types";
import toast from "react-hot-toast";

function StatusBadge({ confirmed }: { confirmed: boolean }) {
  return confirmed ? (
    <span className="badge-green">Confirmed</span>
  ) : (
    <span className="badge-yellow">Pending</span>
  );
}

function DonationModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    amount: "",
    asset: "XLM",
    purpose: "",
    stellarTxHash: "",
  });

  const mutation = useMutation({
    mutationFn: () =>
      donationsApi.create({
        amount: parseFloat(form.amount),
        asset: form.asset,
        purpose: form.purpose,
        stellarTxHash: form.stellarTxHash,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donations"] });
      toast.success("Donation recorded successfully!");
      onClose();
    },
    onError: () => toast.error("Failed to record donation."),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Record Donation</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Amount</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Asset</label>
            <select
              value={form.asset}
              onChange={(e) => setForm((p) => ({ ...p, asset: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="XLM">XLM (Stellar Lumens)</option>
              <option value="USDC">USDC</option>
              <option value="PHP">PHP</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Purpose</label>
            <input
              type="text"
              value={form.purpose}
              onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              placeholder="e.g. Food relief - Typhoon Pablo"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Stellar Transaction Hash
            </label>
            <input
              type="text"
              value={form.stellarTxHash}
              onChange={(e) => setForm((p) => ({ ...p, stellarTxHash: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs focus:border-brand-500 focus:outline-none"
              placeholder="Paste tx hash after sending on Stellar"
            />
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.amount || !form.stellarTxHash}
            className="btn-primary flex-1 justify-center"
          >
            {mutation.isPending ? "Recording…" : "Record Donation"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DonationsPage() {
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["donations", page],
    queryFn: () => donationsApi.list(page).then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Donations</h1>
          <p className="mt-1 text-sm text-gray-500">
            All on-chain donations with Stellar provenance
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> Record Donation
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                {["Donor", "Amount", "Asset", "Purpose", "Status", "Date", "Tx Hash"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data?.items ?? []).map((d: Donation) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{d.donorName}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {d.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{d.asset}</td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-gray-500">
                    {d.purpose ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge confirmed={d.blockchainConfirmed} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {format(new Date(d.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${d.stellarTxHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-xs text-brand-600 hover:underline"
                    >
                      {d.stellarTxHash.slice(0, 8)}…
                      <ArrowUpRight className="h-3 w-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data?.items?.length === 0 && (
            <p className="py-12 text-center text-sm text-gray-400">No donations recorded yet.</p>
          )}
        </div>
      )}

      {showModal && <DonationModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
