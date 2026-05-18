import Link from "next/link";
import { Shield, Heart, Search, TrendingUp, ArrowRight, CheckCircle } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Verified Integrity",
    description:
      "Every transaction is anchored on the Stellar blockchain, creating an immutable audit trail for all aid flows.",
  },
  {
    icon: Heart,
    title: "Need-based Giving",
    description:
      "Smart matching routes donations to beneficiaries based on verified need levels and request urgency.",
  },
  {
    icon: Search,
    title: "Aid Provenance",
    description:
      "Track your donation from wallet to beneficiary. Every peso accounted for via Soroban smart contracts.",
  },
  {
    icon: TrendingUp,
    title: "Impact Reports",
    description:
      "Real-time dashboards show fund utilization rates, disbursement timelines, and beneficiary outcomes.",
  },
];

const stats = [
  { label: "Total Disbursed", value: "₱2.4M" },
  { label: "Beneficiaries Served", value: "1,847" },
  { label: "Fund Utilization", value: "97.3%" },
  { label: "Blockchain Verified", value: "100%" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-brand-700">LINGAP</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-brand-600">
              Dashboard
            </Link>
            <Link href="/donations" className="text-sm text-gray-600 hover:text-brand-600">
              Donations
            </Link>
            <Link href="/beneficiaries" className="text-sm text-gray-600 hover:text-brand-600">
              Beneficiaries
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary text-sm">
              Sign In
            </Link>
            <Link href="/dashboard" className="btn-primary text-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-stellar-blue/5 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
            <CheckCircle className="h-4 w-4" />
            Powered by Stellar + Soroban
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
            Aid that's{" "}
            <span className="bg-gradient-to-r from-brand-600 to-stellar-blue bg-clip-text text-transparent">
              transparent
            </span>
            ,<br />
            accountable, and verifiable.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            LINGAP is a blockchain-powered humanitarian aid platform ensuring every donation
            reaches those who need it most — with full provenance recorded on the Stellar network.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/dashboard" className="btn-primary px-8 py-3 text-base">
              View Live Dashboard <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/donations" className="btn-secondary px-8 py-3 text-base">
              Make a Donation
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-100 bg-white py-16">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold text-brand-600">{s.value}</div>
              <div className="mt-1 text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Built for trust. Designed for impact.
            </h2>
            <p className="mt-4 text-gray-600">
              Every feature of LINGAP addresses a core challenge in humanitarian aid delivery.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="card hover:shadow-md transition-shadow">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
                  <f.icon className="h-6 w-6 text-brand-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-gray-500">
          <p className="font-semibold text-gray-700">LINGAP</p>
          <p className="mt-1">
            Ledger for Integrity, Need-based Giving, Aid Provenance, and Protection
          </p>
          <p className="mt-4">© 2026 LINGAP. Built on Stellar + Soroban.</p>
        </div>
      </footer>
    </div>
  );
}
