"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import WalletButton from "@/components/wallet/WalletButton";

const links = [
  { href: "/", label: "Home" },
  { href: "/discover", label: "Discover" },
  { href: "/detail", label: "Campaign Detail" },
  { href: "/escrow", label: "Escrow Dashboard" },
  { href: "/proof", label: "Proof Center" },
  { href: "/volunteer", label: "Volunteer" },
  { href: "/donor", label: "My Impact" },
  { href: "/certificate", label: "Certificate" },
  { href: "/admin", label: "Admin" },
];

export default function TopNav() {
  const pathname = usePathname();
  return (
    <nav className="topnav">
      <Link className="nav-logo" href="/">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="#0D1B2A"/>
          <rect x="3" y="8" width="7" height="10" rx="2" fill="#6B7280"/>
          <rect x="4" y="9" width="5" height="8" rx="1" fill="#F4A6B2"/>
          <rect x="22" y="8" width="7" height="10" rx="2" fill="#6B7280"/>
          <rect x="23" y="9" width="5" height="8" rx="1" fill="#F4A6B2"/>
          <rect x="8" y="4" width="16" height="14" rx="4" fill="#9AA3B2"/>
          <rect x="11" y="8" width="4" height="5" rx="2" fill="#1a1a2e"/>
          <rect x="17" y="8" width="4" height="5" rx="2" fill="#1a1a2e"/>
          <rect x="12" y="9" width="2" height="2" rx="1" fill="white"/>
          <rect x="18" y="9" width="2" height="2" rx="1" fill="white"/>
          <rect x="14" y="17" width="4" height="3" rx="1" fill="#9AA3B2"/>
          <rect x="13" y="19" width="3" height="3" rx="1" fill="#8B939F"/>
          <rect x="8" y="21" width="16" height="9" rx="3" fill="#1E3A8A"/>
          <rect x="13" y="24" width="6" height="3" rx="1" fill="#FFDD57"/>
          <rect x="13" y="23" width="2" height="2" rx="1" fill="#FFDD57"/>
          <rect x="17" y="23" width="2" height="2" rx="1" fill="#FFDD57"/>
        </svg>
        <span className="nav-logo-text">LIN<span>GAP</span></span>
      </Link>
      <div className="nav-links">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`nav-link${pathname === l.href ? " active" : ""}`}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <div className="nav-right">
        <WalletButton />
        <Link href="/discover" className="btn btn-emerald btn-sm">Donate Now 💚</Link>
      </div>
    </nav>
  );
}
