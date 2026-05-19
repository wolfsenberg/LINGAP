/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    NEXT_PUBLIC_STELLAR_NETWORK: process.env.NEXT_PUBLIC_STELLAR_NETWORK || "testnet",
    NEXT_PUBLIC_CONTRACT_AID_PROVENANCE: process.env.NEXT_PUBLIC_CONTRACT_AID_PROVENANCE || "",
    NEXT_PUBLIC_CONTRACT_DONATION_VAULT: process.env.NEXT_PUBLIC_CONTRACT_DONATION_VAULT || "",
  },
};

export default nextConfig;
