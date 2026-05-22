import type { Donation } from "@/types";

const STORAGE_KEY = "lingap_pending_donations";

export type PendingDonation = {
  userId?: string;
  amount: number;
  asset: string;
  purpose?: string;
  stellarTxHash: string;
  createdAt: string;
};

function readAll(): PendingDonation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(items: PendingDonation[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function addPendingDonation(item: PendingDonation) {
  const items = readAll();
  if (items.some((existing) => existing.stellarTxHash === item.stellarTxHash)) return;
  writeAll([item, ...items]);
}

export function removePendingDonation(txHash: string) {
  writeAll(readAll().filter((item) => item.stellarTxHash !== txHash));
}

export function getPendingDonations(userId?: string) {
  return readAll().filter((item) => !item.userId || !userId || item.userId === userId);
}

export function toDonation(item: PendingDonation): Donation {
  return {
    id: `pending-${item.stellarTxHash}`,
    donorId: item.userId || "pending",
    donorName: "You",
    amount: item.amount,
    asset: item.asset,
    purpose: item.purpose,
    stellarTxHash: item.stellarTxHash,
    blockchainConfirmed: true,
    disbursed: false,
    disbursedAmount: 0,
    createdAt: item.createdAt,
  };
}
