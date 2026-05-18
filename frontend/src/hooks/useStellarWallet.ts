"use client";
import { useState, useCallback } from "react";
import { getAccountBalance, fundTestnetAccount } from "@/lib/stellar";

export function useStellarWallet(publicKey?: string) {
  const [balance, setBalance] = useState<string>("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    setError(null);
    try {
      const { xlm } = await getAccountBalance(publicKey);
      setBalance(xlm);
    } catch (e) {
      setError("Failed to fetch balance");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  const fundTestnet = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    try {
      await fundTestnetAccount(publicKey);
      await fetchBalance();
    } catch (e) {
      setError("Funding failed");
    } finally {
      setLoading(false);
    }
  }, [publicKey, fetchBalance]);

  return { balance, loading, error, fetchBalance, fundTestnet };
}
