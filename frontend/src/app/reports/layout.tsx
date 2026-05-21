import AuthenticatedShell from "@/components/layout/AuthenticatedShell";

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedShell>{children}</AuthenticatedShell>;
}
