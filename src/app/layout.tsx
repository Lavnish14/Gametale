import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { CursorGlow } from "@/components/cursor-glow";
import { ToastProvider } from "@/components/toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GameTale | Your Gaming Universe",
  description: "Discover, track, and review your favorite games. Join the ultimate gaming community with real ratings from real gamers.",
  keywords: ["games", "gaming", "reviews", "wishlist", "gamepass", "steam", "pc games", "playstation", "xbox", "nintendo"],
  authors: [{ name: "GameTale" }],
  creator: "GameTale",
  publisher: "GameTale",
  robots: "index, follow",
  openGraph: {
    title: "GameTale | Your Gaming Universe",
    description: "Discover, track, and review your favorite games. Join the ultimate gaming community.",
    type: "website",
    siteName: "GameTale",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "GameTale | Your Gaming Universe",
    description: "Discover, track, and review your favorite games.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Animated Mesh Gradient Background */}
        <div className="mesh-gradient" />

        {/* Film Grain Texture Overlay */}
        <div className="grain-overlay" />

        {/* Cursor Glow Effect */}
        <CursorGlow />

        <QueryProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}


