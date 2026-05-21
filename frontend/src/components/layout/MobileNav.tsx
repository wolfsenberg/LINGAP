"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, ShieldCheck, Heart } from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/proof", label: "Proof", icon: ShieldCheck },
  { href: "/donor", label: "My Impact", icon: Heart },
];

export default function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="mobile-nav">
      {items.map((item) => (
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
