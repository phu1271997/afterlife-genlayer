import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Spectral } from "next/font/google";

import { Navbar } from "@/components/Navbar";
import { ContractInfoFooter } from "@/components/ContractInfoFooter";

import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spectral = Spectral({
  subsets: ["latin"],
  variable: "--font-spectral",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AfterLife",
  description:
    "AI-verified digital wills on GenLayer. Preserve assets, final messages, and family legacy with dignity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${inter.variable} ${spectral.variable}`}
    >
      <body>
        <Navbar />
        <main>{children}</main>
        <ContractInfoFooter />
      </body>
    </html>
  );
}
