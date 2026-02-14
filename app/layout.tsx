import type { Metadata } from "next";
import { Cormorant_Garamond, Libre_Baskerville } from "next/font/google";
import localFont from "next/font/local";
import SiteFooter from "@/components/layout/site-footer";
import SiteHeader from "@/components/layout/site-header";
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
        <SiteHeader />
        <main className="min-h-[calc(100vh-16rem)]">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
