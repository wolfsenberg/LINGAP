"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, ShieldCheck, MapPin, Plus, X, AlertTriangle } from "lucide-react";
import { beneficiariesApi } from "@/lib/api";
import type { Beneficiary } from "@/types";
import toast from "react-hot-toast";
import { clsx } from "clsx";

const NEED_COLORS: Record<string, string> = {
  critical: "badge-red",
  high: "badge-yellow",
  medium: "badge-blue",
  low: "badge-gray",
};

function AddBeneficiaryModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    nationalId: "",
    location: "",
    category: "individual" as Beneficiary["category"],
    needLevel: "medium" as Beneficiary["needLevel"],
    stellarPublicKey: "",
  });

  const mutation = useMutation({
    mutationFn: () => beneficiariesApi.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beneficiaries"] });
      toast.success("Beneficiary added!");
      onClose();
    },
    onError: () => toast.error("Failed to add beneficiary."),
  });

  const field = (label: string, key: keyof typeof form, type = "text", placeholder = "") => (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={form[key] as string}
        onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Add Beneficiary</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {field("Full Name", "name", "text", "Juan dela Cruz")}
          {field("National ID", "nationalId", "text", "PSN-XXXX-XXXX")}
          {field("Location", "location", "text", "Barangay, City, Province")}
          {field("Stellar Public Key", "stellarPublicKey", "text", "G...")}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
            <select
              value={form.category}
              onChange={(e) =>
                setForm((p) => ({ ...p, category: e.target.value as Beneficiary["category"] }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="individual">Individual</option>
              <option value="family">Family</option>
              <option value="community">Community</option>
              <option value="organization">Organization</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Need Level</label>
            <select
              value={form.needLevel}
              onChange={(e) =>
                setForm((p) => ({ ...p, needLevel: e.target.value as Beneficiary["needLevel"] }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.name || !form.nationalId}
            className="btn-primary flex-1 justify-center"
          >
            {mutation.isPending ? "Adding…" : "Add Beneficiary"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BeneficiariesPage() {
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["beneficiaries"],
    queryFn: () => beneficiariesApi.list().then((r) => r.data),
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => beneficiariesApi.verify(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beneficiaries"] });
      toast.success("Beneficiary verified!");
    },
    onError: () => toast.error("Verification failed."),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Beneficiaries</h1>
          <p className="mt-1 text-sm text-gray-500">Verified aid recipients registered in LINGAP</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> Add Beneficiary
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.items ?? []).map((b: Beneficiary) => (
            <div key={b.id} className="card space-y-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700">
                    {b.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{b.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{b.category}</p>
                  </div>
                </div>
                {b.verified ? (
                  <ShieldCheck className="h-5 w-5 text-brand-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <MapPin className="h-3.5 w-3.5" />
                {b.location}
              </div>

              <div className="flex items-center justify-between">
                <span className={clsx("badge", NEED_COLORS[b.needLevel])}>
                  {b.needLevel} need
                </span>
                <span className="text-xs text-gray-500">
                  Received: ₱{b.totalReceived.toLocaleString()}
                </span>
              </div>

              {!b.verified && (
                <button
                  onClick={() => verifyMutation.mutate(b.id)}
                  disabled={verifyMutation.isPending}
                  className="btn-primary w-full justify-center text-xs py-1.5"
                >
                  Verify Beneficiary
                </button>
              )}
            </div>
          ))}
          {data?.items?.length === 0 && (
            <div className="col-span-3 py-16 text-center text-sm text-gray-400">
              No beneficiaries registered yet.
            </div>
          )}
        </div>
      )}

      {showModal && <AddBeneficiaryModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
