import {
  Networks,
  TransactionBuilder,
  Operation,
  Asset,
  Keypair,
  Horizon,
  Memo,
} from "@stellar/stellar-sdk";

const NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK as "testnet" | "mainnet";

export const STELLAR_CONFIG = {
  network: NETWORK === "mainnet" ? Networks.PUBLIC : Networks.TESTNET,
  horizonUrl:
    NETWORK === "mainnet"
      ? "https://horizon.stellar.org"
      : "https://horizon-testnet.stellar.org",
  sorobanUrl:
    NETWORK === "mainnet"
      ? "https://soroban-rpc.stellar.org"
      : "https://soroban-testnet.stellar.org",
};

export const horizonServer = new Horizon.Server(STELLAR_CONFIG.horizonUrl);

export async function loadAccount(publicKey: string) {
  return horizonServer.loadAccount(publicKey);
}

export async function buildPaymentTransaction(
  sourcePublicKey: string,
  destinationPublicKey: string,
  amount: string,
  asset: Asset = Asset.native(),
  memo?: string
) {
  // Always load a fresh account to get the latest sequence number.
  // Stale sequences cause tx_bad_seq errors when multiple transactions
  // are submitted in quick succession.
  const sourceAccount = await loadAccount(sourcePublicKey);

  const txBuilder = new TransactionBuilder(sourceAccount, {
    fee: "10000", // 10,000 stroops — avoids tx_insufficient_fee on testnet
    networkPassphrase: STELLAR_CONFIG.network,
  });

  txBuilder.addOperation(
    Operation.payment({ destination: destinationPublicKey, asset, amount })
  );

  if (memo) txBuilder.addMemo(Memo.text(memo));

  // 30s timeout — enough for Freighter to sign without the tx expiring
  txBuilder.setTimeout(30);
  return txBuilder.build();
}

export async function submitSignedTransactionXdr(
  signedXdr: string,
  retries = 1,
): Promise<{ hash: string; successful: boolean }> {
  // Submit the raw signed XDR directly to Horizon via fetch.
  // Using the SDK's submitTransaction() can silently re-encode the envelope
  // and drop the Freighter signature, causing tx_bad_auth errors.
  const params = new URLSearchParams({ tx: signedXdr });
  const res = await fetch(`${STELLAR_CONFIG.horizonUrl}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const data = await res.json();

  if (!res.ok) {
    const codes = data?.extras?.result_codes;
    const txCode: string = codes?.transaction ?? "";
    const opCodes: string[] = codes?.operations ?? [];

    // tx_bad_seq means the sequence was stale — the caller should rebuild
    // the transaction with a fresh sequence and re-sign. We surface this
    // as a distinct error so the UI can give a clear message.
    if (txCode === "tx_bad_seq") {
      throw new Error("TX_BAD_SEQ");
    }

    // op_underfunded — not enough XLM in the source wallet
    if (opCodes.includes("op_underfunded")) {
      throw new Error("Insufficient XLM in your Freighter wallet. Please fund your testnet account via friendbot.stellar.org.");
    }

    // op_no_destination — destination account doesn't exist on this network
    if (opCodes.includes("op_no_destination")) {
      throw new Error("The LINGAP receiving wallet doesn't exist on this network yet. Contact support.");
    }

    const detail = codes
      ? `Stellar error: ${JSON.stringify(codes)}`
      : data?.detail || data?.title || "Transaction failed";
    throw new Error(detail);
  }

  return data as { hash: string; successful: boolean };
}

/**
 * Build, sign (via Freighter), and submit a payment transaction.
 * Automatically retries once on tx_bad_seq by rebuilding with a fresh sequence.
 */
export async function buildSignAndSubmit(
  sourcePublicKey: string,
  destinationPublicKey: string,
  amount: string,
  memo: string,
  signFn: (xdr: string, networkPassphrase: string) => Promise<string>,
): Promise<{ hash: string }> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const tx = await buildPaymentTransaction(
      sourcePublicKey,
      destinationPublicKey,
      amount,
      undefined,
      memo,
    );
    const signedXdr = await signFn(tx.toXDR(), STELLAR_CONFIG.network);
    try {
      const result = await submitSignedTransactionXdr(signedXdr);
      return { hash: result.hash };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // On bad sequence, rebuild with fresh account data and retry once
      if (msg === "TX_BAD_SEQ" && attempt === 0) continue;
      throw err;
    }
  }
  throw new Error("Transaction failed after retry.");
}

export function getStellarExpertTxUrl(txHash: string) {
  const explorerNetwork = NETWORK === "mainnet" ? "public" : "testnet";
  return `https://stellar.expert/explorer/${explorerNetwork}/tx/${txHash}`;
}

export function isStellarTxHash(value?: string | null) {
  return /^[a-f0-9]{64}$/i.test(value || "");
}

export function formatLedgerReference(value?: string | null) {
  if (!value) return "LNGP-PENDING";
  if (value.startsWith("LINGAP-DEMO-DON-")) {
    return value.replace("LINGAP-DEMO-DON-", "LNGP-DON-").toUpperCase();
  }
  return value.toUpperCase();
}

export function getStellarExpertContractUrl(contractId?: string | null) {
  const id = contractId || process.env.NEXT_PUBLIC_CONTRACT_DONATION_VAULT;
  if (!id) return null;
  const explorerNetwork = NETWORK === "mainnet" ? "public" : "testnet";
  return `https://stellar.expert/explorer/${explorerNetwork}/contract/${id}`;
}

export async function getTransactionDetails(txHash: string) {
  return horizonServer.transactions().transaction(txHash).call();
}

export async function getAccountBalance(publicKey: string) {
  const account = await loadAccount(publicKey);
  const xlmBalance = account.balances.find((b) => b.asset_type === "native");
  return {
    xlm: xlmBalance?.balance ?? "0",
    balances: account.balances,
  };
}

export function generateKeypair() {
  const keypair = Keypair.random();
  return {
    publicKey: keypair.publicKey(),
    secretKey: keypair.secret(),
  };
}

export async function fundTestnetAccount(publicKey: string) {
  const res = await fetch(
    `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
  );
  return res.json();
}
