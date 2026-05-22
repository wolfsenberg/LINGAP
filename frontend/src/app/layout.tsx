import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import QueryProvider from "@/components/providers/QueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "LINGAP — Aid Provenance & Protection",
  description:
    "Ledger for Integrity, Need-based Giving, Aid Provenance, and Protection — powered by Stellar blockchain.",
  keywords: ["humanitarian", "aid", "blockchain", "stellar", "transparency", "donations"],
  icons: {
    icon: "/logo/icon.ico",
    shortcut: "/logo/icon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <QueryProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              className: "text-sm font-medium",
              duration: 4000,
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
