"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/discover", label: "Discover", icon: "🔍" },
  { href: "/escrow", label: "Escrow", icon: "🔒" },
  { href: "/volunteer", label: "Volunteer", icon: "🤝" },
  { href: "/donor", label: "My Impact", icon: "💙" },
  { href: "/admin", label: "Admin", icon: "⚙️" },
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
          <span className="mn-icon">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
