"use client";

import Link from "next/link";
import { CSSProperties, ReactNode, useState } from "react";
import { Lock, X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

type AuthPromptLinkProps = {
  href: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

export default function AuthPromptLink({ href, className, style, children }: AuthPromptLinkProps) {
  const { hasHydrated, isAuthenticated } = useAuthStore();
  const [showPrompt, setShowPrompt] = useState(false);

  if (hasHydrated && isAuthenticated) {
    return (
      <Link href={href} className={className} style={style}>
        {children}
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        className={`auth-prompt-trigger ${className ?? ""}`}
        style={style}
        onClick={() => setShowPrompt(true)}
      >
        {children}
      </button>

      {showPrompt && (
        <div className="auth-prompt-backdrop" role="dialog" aria-modal="true" aria-labelledby="auth-prompt-title">
          <div className="auth-prompt-modal">
            <button
              type="button"
              className="auth-prompt-close"
              aria-label="Close sign in prompt"
              onClick={() => setShowPrompt(false)}
            >
              <X size={16} />
            </button>
            <div className="auth-prompt-icon">
              <Lock size={22} strokeWidth={1.8} />
            </div>
            <h2 id="auth-prompt-title">Sign in to view campaign details</h2>
            <p>
              You can browse verified campaigns freely, but opening a campaign requires a LINGAP account so donations,
              escrow status, and certificates stay connected to you.
            </p>
            <div className="auth-prompt-actions">
              <Link href={`/login?next=${encodeURIComponent(href)}`} className="btn btn-emerald">
                Sign In
              </Link>
              <button type="button" className="btn btn-outline" onClick={() => setShowPrompt(false)}>
                Keep Browsing
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
