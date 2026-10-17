import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import SiteScrollbar from "./components/site-scrollbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const gtSuper = localFont({
  src: "./fonts/gt-super-display-bold.woff2",
  variable: "--font-editorial",
  weight: "700",
  style: "normal",
  adjustFontFallback: "Times New Roman",
  display: "swap",
});

export const metadata: Metadata = {
  title: "slow. — A little ritual. A better day.",
  description:
    "Good coffee. A little intention. Discover a slower kind of everyday, from the first beautiful bean to the last lovely sip.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      id="page-root"
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${gtSuper.variable}`}
    >
      <body>{children}<SiteScrollbar /></body>
    </html>
  );
}
