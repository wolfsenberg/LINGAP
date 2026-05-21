import AuthenticatedShell from "@/components/layout/AuthenticatedShell";

export default function BeneficiariesLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedShell>{children}</AuthenticatedShell>;
}
