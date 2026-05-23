"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import WalletButton from "@/components/wallet/WalletButton";
import { Compass, Heart, Home, LogOut, ShieldCheck, Users } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/proof", label: "Proof Center", icon: ShieldCheck },
  { href: "/community", label: "Community", icon: Users },
];

export default function TopNav() {
  const pathname = usePathname();
  const { user, isAuthenticated, clearAuth } = useAuthStore();

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
        {isAuthenticated && user ? (
          <>
            <Link href="/donor" className={`nav-impact${pathname === "/donor" ? " active" : ""}`}>
              <Heart size={14} strokeWidth={2}/>
              My Impact
            </Link>
            <Link href="/discover" className="btn btn-emerald btn-sm">Donate Now</Link>
            <WalletButton />
            <button type="button" onClick={clearAuth} className="nav-logout" aria-label="Sign out" title="Sign out">
              <LogOut size={13}/>
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className={`nav-login${pathname === "/login" ? " active" : ""}`}>
              Sign In
            </Link>
            <Link href="/discover" className="btn btn-emerald btn-sm">Donate Now</Link>
          </>
        )}
      </div>
    </nav>
  );
}
