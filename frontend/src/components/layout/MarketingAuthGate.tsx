"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

const publicMarketingPaths = new Set(["/", "/admin", "/discover", "/proof", "/community"]);

function isPublicMarketingPath(pathname: string) {
  return publicMarketingPaths.has(pathname) || pathname.startsWith("/profile/");
}

export default function MarketingAuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { hasHydrated, isAuthenticated } = useAuthStore();
  const isPublicPath = isPublicMarketingPath(pathname);

  useEffect(() => {
    if (hasHydrated && !isPublicPath && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [hasHydrated, isAuthenticated, isPublicPath, pathname, router]);

  if (isPublicPath) return <>{children}</>;

  if (!hasHydrated || !isAuthenticated) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-card">
          <img src="/images/donate.png" alt="" />
          <span>{hasHydrated ? "Redirecting to sign in..." : "Checking your LINGAP session..."}</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
