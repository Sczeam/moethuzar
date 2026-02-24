import type { Metadata } from "next";
import { Cormorant_Garamond, Libre_Baskerville } from "next/font/google";
import localFont from "next/font/local";
import { SiteChrome } from "@/components/layout/site-chrome";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const libreBaskerville = Libre_Baskerville({
  variable: "--font-libre-baskerville",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const cooperBlack = localFont({
  src: "../fonts/COOPBL.ttf",
  variable: "--font-cooper-black",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Moethuzar",
  description: "Vintage streetwear storefront from Myanmar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${cormorant.variable} ${libreBaskerville.variable} ${cooperBlack.variable} antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only z-[70] bg-paper-light px-4 py-2 text-sm font-semibold text-ink focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
        >
          Skip to main content
        </a>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
