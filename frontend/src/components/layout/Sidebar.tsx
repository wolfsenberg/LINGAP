"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Heart,
  Users,
  FileText,
  BarChart3,
  Shield,
  Settings,
  LogOut,
} from "lucide-react";
import { clsx } from "clsx";
import { useAuthStore } from "@/store/authStore";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/donations", label: "Donations", icon: Heart },
  { href: "/beneficiaries", label: "Beneficiaries", icon: Users },
  { href: "/aid-requests", label: "Aid Requests", icon: FileText },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-white" style={{borderColor:'var(--border)',background:'var(--surface)'}}>
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5" style={{borderBottom:'1px solid var(--border)'}}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{background:'var(--forest)'}}>
          <Shield className="h-5 w-5" style={{color:'var(--canopy-light)'}} />
        </div>
        <span className="text-lg font-bold" style={{color:'var(--forest)',fontFamily:'Sora,sans-serif'}}>LINGAP</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <ul className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === href
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-200 p-4">
        <div className="mb-3 flex items-center gap-3 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            {user?.name?.[0] ?? "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{user?.name ?? "User"}</p>
            <p className="truncate text-xs text-gray-500 capitalize">{user?.role ?? "guest"}</p>
          </div>
        </div>
        <div className="space-y-1">
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            <Settings className="h-4 w-4" /> Settings
          </Link>
          <button
            onClick={clearAuth}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
