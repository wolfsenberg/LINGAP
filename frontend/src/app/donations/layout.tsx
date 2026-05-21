import AuthenticatedShell from "@/components/layout/AuthenticatedShell";

export default function DonationsLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedShell>{children}</AuthenticatedShell>;
}
