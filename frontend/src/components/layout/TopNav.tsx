"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import WalletButton from "@/components/wallet/WalletButton";
import { Compass, Heart, Home, ShieldCheck } from "lucide-react";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/proof", label: "Proof Center", icon: ShieldCheck },
];

export default function TopNav() {
  const pathname = usePathname();
  return (
    <nav className="topnav">
      <Link className="nav-logo" href="/">
        <img className="nav-logo-mark" src="/images/donate.png" alt="" />
        <span className="nav-logo-text">LIN<span>GAP</span></span>
      </Link>
      <div className="nav-links">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`nav-link${pathname === l.href ? " active" : ""}`}
          >
            <l.icon size={14} strokeWidth={1.9}/>
            {l.label}
          </Link>
        ))}
      </div>
      <div className="nav-right">
        <Link href="/donor" className={`nav-impact${pathname === "/donor" ? " active" : ""}`}>
          <Heart size={14} strokeWidth={2}/>
          My Impact
        </Link>
        <WalletButton />
        <Link href="/discover" className="btn btn-emerald btn-sm">Donate Now</Link>
      </div>
    </nav>
  );
}
