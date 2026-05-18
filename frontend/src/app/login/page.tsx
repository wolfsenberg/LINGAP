"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: "", password: "" });

  const mutation = useMutation({
    mutationFn: () => authApi.login(form.email, form.password),
    onSuccess: (res) => {
      const { token, user } = res.data.data;
      setAuth(user, token);
      localStorage.setItem("lingap_token", token);
      toast.success(`Welcome back, ${user.name}!`);
      router.push("/dashboard");
    },
    onError: () => toast.error("Invalid credentials. Please try again."),
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sign in to LINGAP</h1>
          <p className="mt-1 text-sm text-gray-500">
            Transparent humanitarian aid powered by Stellar
          </p>
        </div>

        <div className="card space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && mutation.mutate()}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && mutation.mutate()}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="••••••••"
            />
          </div>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.email || !form.password}
            className="btn-primary w-full justify-center py-2.5"
          >
            {mutation.isPending ? "Signing in…" : "Sign In"}
          </button>
          <p className="text-center text-xs text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href="/" className="text-brand-600 hover:underline">
              Contact your admin
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
