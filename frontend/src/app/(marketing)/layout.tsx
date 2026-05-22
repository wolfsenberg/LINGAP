import TopNav from "@/components/layout/TopNav";
import MobileNav from "@/components/layout/MobileNav";
import MarketingAuthGate from "@/components/layout/MarketingAuthGate";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopNav />
      <div style={{ paddingTop: 64 }}>
        <MarketingAuthGate>{children}</MarketingAuthGate>
      </div>
      <MobileNav />
    </>
  );
}
