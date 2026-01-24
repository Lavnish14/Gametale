import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { ToastProvider } from "@/components/toast";

const satoshi = Plus_Jakarta_Sans({
  variable: "--font-satoshi",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const siteUrl = "https://gametale.games";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "GameTale | Your Gaming Universe",
    template: "%s | GameTale",
  },
  description: "Discover, track, and review your favorite games. Join the ultimate gaming community with real ratings from real gamers.",
  keywords: ["games", "gaming", "reviews", "wishlist", "gamepass", "steam", "pc games", "playstation", "xbox", "nintendo", "game ratings", "game reviews", "gaming community"],
  authors: [{ name: "GameTale", url: siteUrl }],
  creator: "GameTale",
  publisher: "GameTale",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "GameTale | Your Gaming Universe",
    description: "Discover, track, and review your favorite games. Join the ultimate gaming community with real ratings from real gamers.",
    url: siteUrl,
    type: "website",
    siteName: "GameTale",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GameTale - Your Gaming Universe",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GameTale | Your Gaming Universe",
    description: "Discover, track, and review your favorite games. Join the ultimate gaming community.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.png?v=2", type: "image/png" },
      { url: "/icon.png?v=2", type: "image/png", sizes: "512x512" },
    ],
    apple: "/icon.png?v=2",
  },
  verification: {
    // Add your Google Search Console verification code here
    // google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#3b82f6',
          colorBackground: '#09090b',
          colorInputBackground: '#18181b',
          colorInputText: '#ffffff',
        },
      }}
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <html lang="en" className="dark">
        <body
          className={`${satoshi.variable} ${jetbrainsMono.variable} antialiased font-sans`}
        >
          {/* Background gradient */}
          <div className="mesh-gradient" />

          <QueryProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}



