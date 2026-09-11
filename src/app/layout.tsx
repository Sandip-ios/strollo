import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Baloo_2, Inter, IBM_Plex_Mono } from "next/font/google";
import NavigationProgress from "@/components/NavigationProgress";
import "./globals.css";

const baloo = Baloo_2({
  subsets: ["latin"],
  variable: "--font-baloo",
  weight: ["600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "Strollo — Happy Steps, Happy Dogs",
  description: "Book trusted, professional dog walkers near you.",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/favicon-64.png", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
  // Makes "Add to Home Screen" on iOS launch as a standalone app (hides
  // Safari's chrome) instead of just bookmarking the page, and gives it
  // a proper name under the icon. Combined with manifest.json's icons +
  // background_color, this is also what lets iOS 15.4+ auto-generate a
  // branded splash screen instead of a blank white flash while it loads
  // — without needing a hand-built image for every individual iPhone
  // screen size.
  appleWebApp: {
    capable: true,
    title: "Strollo",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#243b5a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${baloo.variable} ${inter.variable} ${plexMono.variable}`}>
      <body className="bg-paper font-sans text-ink antialiased">
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
