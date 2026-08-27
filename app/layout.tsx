import type { Metadata } from "next";
import type { ReactNode } from "react";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "NIHSS Erhebung",
  description:
    "Mobile-first Dokumentation von NIHSS-Untersuchungen ohne patientenidentifizierende Daten.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de" className="bg-background text-foreground">
      <body className="min-h-screen bg-background text-foreground">
        <Header />
        {children}
      </body>
    </html>
  );
}
