"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, CheckCircle, XCircle, Send, ArrowUpRight, Plus, X } from "lucide-react";
import { aidRequestsApi } from "@/lib/api";
import { format } from "date-fns";
import type { AidRequest } from "@/types";
import toast from "react-hot-toast";
import { clsx } from "clsx";

const STATUS_BADGE: Record<AidRequest["status"], string> = {
  pending: "badge-yellow",
  approved: "badge-blue",
  disbursed: "badge-green",
  rejected: "badge-red",
};

function NewRequestModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    beneficiaryId: "",
    requestedAmount: "",
    asset: "XLM",
    purpose: "",
  });

  const mutation = useMutation({
    mutationFn: () =>
      aidRequestsApi.create({
        beneficiaryId: form.beneficiaryId,
        requestedAmount: parseFloat(form.requestedAmount),
        asset: form.asset,
        purpose: form.purpose,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aid-requests"] });
      toast.success("Aid request submitted!");
      onClose();
    },
    onError: () => toast.error("Failed to submit request."),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">New Aid Request</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Beneficiary ID</label>
            <input
              value={form.beneficiaryId}
              onChange={(e) => setForm((p) => ({ ...p, beneficiaryId: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="Beneficiary UUID"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Amount</label>
              <input
                type="number"
                value={form.requestedAmount}
                onChange={(e) => setForm((p) => ({ ...p, requestedAmount: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
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
                <option value="XLM">XLM</option>
                <option value="USDC">USDC</option>
                <option value="PHP">PHP</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Purpose</label>
            <textarea
              value={form.purpose}
              onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none resize-none"
              placeholder="Describe the aid needed..."
            />
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.beneficiaryId || !form.requestedAmount}
            className="btn-primary flex-1 justify-center"
          >
            {mutation.isPending ? "Submitting…" : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AidRequestsPage() {
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["aid-requests", filter],
    queryFn: () =>
      aidRequestsApi
        .list(1, 20, filter === "all" ? undefined : filter)
        .then((r) => r.data),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => aidRequestsApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aid-requests"] });
      toast.success("Request approved!");
    },
  });

  const disburseMutation = useMutation({
    mutationFn: (id: string) => aidRequestsApi.disburse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aid-requests"] });
      toast.success("Aid disbursed on-chain!");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => aidRequestsApi.reject(id, "Rejected by admin"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aid-requests"] });
      toast.error("Request rejected.");
    },
  });

  const filters = ["all", "pending", "approved", "disbursed", "rejected"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aid Requests</h1>
          <p className="mt-1 text-sm text-gray-500">Review and disburse aid to verified beneficiaries</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> New Request
        </button>
      </div>

      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              "rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition",
              filter === f
                ? "bg-brand-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        </div>
      ) : (
        <div className="space-y-3">
          {(data?.items ?? []).map((req: AidRequest) => (
            <div key={req.id} className="card flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <FileText className="h-5 w-5 flex-shrink-0 text-gray-400" />
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{req.purpose}</p>
                  <p className="text-xs text-gray-500">
                    {req.beneficiaryName} · {req.requestedAmount.toLocaleString()} {req.asset} ·{" "}
                    {format(new Date(req.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={clsx("badge", STATUS_BADGE[req.status])}>{req.status}</span>
                {req.stellarTxHash && (
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${req.stellarTxHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
                  >
                    Tx <ArrowUpRight className="h-3 w-3" />
                  </a>
                )}
                {req.status === "pending" && (
                  <>
                    <button
                      onClick={() => approveMutation.mutate(req.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100"
                    >
                      <CheckCircle className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => rejectMutation.mutate(req.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </button>
                  </>
                )}
                {req.status === "approved" && (
                  <button
                    onClick={() => disburseMutation.mutate(req.id)}
                    className="inline-flex items-center gap-1 rounded-lg bg-stellar-blue/10 px-3 py-1.5 text-xs font-medium text-stellar-blue hover:bg-stellar-blue/20"
                  >
                    <Send className="h-3.5 w-3.5" /> Disburse
                  </button>
                )}
              </div>
            </div>
          ))}
          {data?.items?.length === 0 && (
            <p className="py-16 text-center text-sm text-gray-400">No aid requests found.</p>
          )}
        </div>
      )}

      {showModal && <NewRequestModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
