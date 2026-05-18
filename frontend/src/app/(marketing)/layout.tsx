import TopNav from "@/components/layout/TopNav";
import MobileNav from "@/components/layout/MobileNav";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopNav />
      <div style={{ paddingTop: 64 }}>{children}</div>
      <MobileNav />
    </>
  );
}
