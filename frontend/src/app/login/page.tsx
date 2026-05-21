"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Network,
  ShieldCheck,
  UserPlus,
  Wallet,
} from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { getFirstName } from "@/lib/userName";
import type { User } from "@/types";

type AuthMode = "login" | "register";

const roleOptions: Array<{ value: User["role"]; label: string; helper: string }> = [
  { value: "donor", label: "Donor", helper: "Give, track impact, and collect certificates." },
  { value: "beneficiary", label: "Beneficiary", helper: "Manage your verified aid profile." },
  { value: "aid_worker", label: "Aid Worker", helper: "Review proofs and support campaign verification." },
];

function routeForRole(role: User["role"]) {
  if (role === "admin" || role === "aid_worker") return "/dashboard";
  if (role === "beneficiary") return "/discover";
  return "/donor";
}

function getErrorMessage(error: unknown) {
  const err = error as {
    code?: string;
    message?: string;
    response?: { status?: number; data?: { detail?: string | Array<{ msg?: string }> } };
  };
  const detail = err.response?.data?.detail;

  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  if (!err.response) return "Backend is unavailable. Please make sure the API is running on port 8000.";
  if (err.response.status === 409 || err.response.status === 400) return "Please check your account details and try again.";
  if (err.response.status === 401) return "Invalid email or password.";

  return err.message || "Something went wrong. Please try again.";
}

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated, user } = useAuthStore();
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "donor" as User["role"],
    stellarPublicKey: "",
  });

  useEffect(() => {
    if (isAuthenticated && user) router.replace(routeForRole(user.role));
  }, [isAuthenticated, router, user]);

  const selectedRole = useMemo(
    () => roleOptions.find((role) => role.value === form.role) ?? roleOptions[0],
    [form.role]
  );

  const mutation = useMutation({
    mutationFn: async () => {
      if (mode === "register") {
        const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
        await authApi.register({
          name: fullName,
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          stellarPublicKey: form.stellarPublicKey.trim() || undefined,
        });
      }
      return authApi.login(form.email.trim(), form.password);
    },
    onSuccess: (res) => {
      const { token, user: authedUser } = res.data.data;
      setAuth(authedUser, token);
      toast.success(mode === "register" ? "Account created. Welcome to LINGAP." : `Welcome back, ${getFirstName(authedUser.name)}.`);
      router.push(routeForRole(authedUser.role));
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  function updateForm<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate();
  }

  const isDisabled =
    mutation.isPending ||
    !form.email.trim() ||
    !form.password ||
    (mode === "register" && (!form.firstName.trim() || !form.lastName.trim()));

  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <Link href="/" className="auth-back-link">
          <ArrowLeft size={15} /> Back to home
        </Link>
        <div>
          <div className="auth-logo-row">
            <img src="/images/donate.png" alt="" />
            <span>LIN<span>GAP</span></span>
          </div>
          <h1>Verified giving starts with a trusted account.</h1>
          <p>
            Sign in to track donations, view escrow status, verify Stellar references, and manage campaign activity from one secure dashboard.
          </p>
        </div>
        <div className="auth-trust-list">
          {[
            { Icon: Lock, title: "Escrow aware", sub: "See whether funds are locked, released, or pending proof." },
            { Icon: Network, title: "Stellar linked", sub: "Keep public transaction references connected to your activity." },
            { Icon: ShieldCheck, title: "Role protected", sub: "Normal users and reviewers land in the right workspace." },
          ].map((item) => (
            <div key={item.title} className="auth-trust-item">
              <div><item.Icon size={18} strokeWidth={1.8} /></div>
              <span>
                <strong>{item.title}</strong>
                <small>{item.sub}</small>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="auth-card-wrap">
        <div className="auth-card">
          <div className="auth-mode-tabs" aria-label="Authentication mode">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
              Sign in
            </button>
            <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
              Create account
            </button>
          </div>

          <div className="auth-card-head">
            <div className="auth-card-icon">
              {mode === "login" ? <ShieldCheck size={22} /> : <UserPlus size={22} />}
            </div>
            <div>
              <h2>{mode === "login" ? "Welcome back" : "Create your LINGAP account"}</h2>
              <p>{mode === "login" ? "Use your registered email to continue." : "Your role decides which dashboard you see after login."}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === "register" && (
              <div className="auth-name-grid">
                <label>
                  <span>First name</span>
                  <input
                    className="form-input"
                    value={form.firstName}
                    onChange={(event) => updateForm("firstName", event.target.value)}
                    placeholder="Jose"
                    autoComplete="given-name"
                  />
                </label>
                <label>
                  <span>Last name</span>
                  <input
                    className="form-input"
                    value={form.lastName}
                    onChange={(event) => updateForm("lastName", event.target.value)}
                    placeholder="Dela Cruz"
                    autoComplete="family-name"
                  />
                </label>
              </div>
            )}

            <label>
              <span>Email address</span>
              <input
                className="form-input"
                type="email"
                value={form.email}
                onChange={(event) => updateForm("email", event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>

            <label>
              <span>Password</span>
              <div className="auth-password-field">
                <input
                  className="form-input"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(event) => updateForm("password", event.target.value)}
                  placeholder="Enter your password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {mode === "register" && (
              <>
                <div>
                  <span className="auth-field-label">Account role</span>
                  <div className="auth-role-grid">
                    {roleOptions.map((role) => (
                      <button
                        key={role.value}
                        type="button"
                        className={form.role === role.value ? "active" : ""}
                        onClick={() => updateForm("role", role.value)}
                      >
                        <CheckCircle2 size={15} />
                        <span>{role.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="auth-role-helper">{selectedRole.helper}</p>
                </div>

                <label>
                  <span>Stellar public key <small>optional</small></span>
                  <div className="auth-password-field">
                    <input
                      className="form-input"
                      value={form.stellarPublicKey}
                      onChange={(event) => updateForm("stellarPublicKey", event.target.value)}
                      placeholder="G..."
                      autoComplete="off"
                    />
                    <div className="auth-input-icon"><Wallet size={16} /></div>
                  </div>
                </label>
              </>
            )}

            <button type="submit" className="btn btn-emerald btn-lg auth-submit" disabled={isDisabled}>
              {mutation.isPending ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
