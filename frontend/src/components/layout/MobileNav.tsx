"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, ShieldCheck, Heart } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/proof", label: "Proof", icon: ShieldCheck },
  { href: "/donor", label: "My Impact", icon: Heart },
];

export default function MobileNav() {
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const visibleItems = isAuthenticated ? items : items.filter((item) => item.href !== "/donor");

  return (
    <nav className="mobile-nav">
      {visibleItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`mn-item${pathname === item.href ? " active" : ""}`}
        >
          <span className="mn-icon"><item.icon size={20} strokeWidth={1.8}/></span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
