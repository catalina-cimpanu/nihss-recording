import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "NIHSS Erhebung",
  description:
    "Mobile-first Dokumentation von NIHSS-Untersuchungen ohne patientenidentifizierende Daten.",
};

export const viewport: Viewport = {
  themeColor: "#00648A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de" className="bg-background text-foreground">
      <body className="flex min-h-screen flex-col bg-background text-foreground">
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
