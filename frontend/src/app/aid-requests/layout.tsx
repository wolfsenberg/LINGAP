import AuthenticatedShell from "@/components/layout/AuthenticatedShell";

export default function AidRequestsLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedShell>{children}</AuthenticatedShell>;
}
