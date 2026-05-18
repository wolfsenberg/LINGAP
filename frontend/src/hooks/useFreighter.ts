"use client";
import { useState, useEffect, useCallback } from "react";
import {
  isConnected,
  getAddress,
  signTransaction,
  requestAccess,
} from "@stellar/freighter-api";

export type WalletState = {
  connected: boolean;
  publicKey: string | null;
  loading: boolean;
  error: string | null;
};

export function useFreighter() {
  const [state, setState] = useState<WalletState>({
    connected: false,
    publicKey: null,
    loading: true,
    error: null,
  });

  // On mount, check if Freighter is already connected.
  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const connected = await isConnected();
        if (!connected.isConnected || cancelled) {
          setState((s) => ({ ...s, loading: false }));
          return;
        }
        const addr = await getAddress();
        if (!cancelled) {
          setState({
            connected: true,
            publicKey: addr.address ?? null,
            loading: false,
            error: null,
          });
        }
      } catch {
        if (!cancelled) setState((s) => ({ ...s, loading: false }));
      }
    }
    check();
    return () => { cancelled = true; };
  }, []);

  const connect = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      // requestAccess prompts Freighter if not yet approved.
      const result = await requestAccess();
      if (result.error) throw new Error(result.error);
      const addr = await getAddress();
      setState({
        connected: true,
        publicKey: addr.address ?? null,
        loading: false,
        error: null,
      });
    } catch (e: unknown) {
      setState((s) => ({
        ...s,
        loading: false,
        error: e instanceof Error ? e.message : "Connection failed",
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({ connected: false, publicKey: null, loading: false, error: null });
  }, []);

  // Sign a base64-encoded XDR transaction envelope with Freighter.
  const sign = useCallback(
    async (xdr: string, networkPassphrase: string) => {
      if (!state.publicKey) throw new Error("Wallet not connected");
      const result = await signTransaction(xdr, { networkPassphrase });
      if (result.error) throw new Error(result.error);
      return result.signedTxXdr;
    },
    [state.publicKey]
  );

  return { ...state, connect, disconnect, sign };
}
