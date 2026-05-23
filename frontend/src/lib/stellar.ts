import {
  Networks,
  TransactionBuilder,
  Operation,
  Asset,
  Keypair,
  Horizon,
  BASE_FEE,
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
  const sourceAccount = await loadAccount(sourcePublicKey);

  const txBuilder = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: STELLAR_CONFIG.network,
  });

  txBuilder.addOperation(
    Operation.payment({ destination: destinationPublicKey, asset, amount })
  );

  if (memo) txBuilder.addMemo(Memo.text(memo));

  txBuilder.setTimeout(180);
  return txBuilder.build();
}

export async function submitSignedTransactionXdr(signedXdr: string) {
  const transaction = TransactionBuilder.fromXDR(signedXdr, STELLAR_CONFIG.network);
  return horizonServer.submitTransaction(transaction);
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
