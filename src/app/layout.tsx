/**
 * Root layout [module: app / routing]
 * Configures global fonts (Geist, Playfair Display, Material Icons) and SEO metadata.
 * Wraps the entire application with AuthProvider so every page has access to auth state.
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "YiYi AI — AI Outfit Planner & Smart Wardrobe",
  description:
    "YiYi AI generates personalized daily outfit recommendations using your wardrobe, real-time weather, and AI. Manage your closet, plan outfits, and discover your style with AI-powered fashion intelligence.",
  keywords: [
    "AI outfit planner",
    "AI wardrobe",
    "outfit generator",
    "smart closet",
    "AI fashion",
    "daily outfit",
    "wardrobe organizer",
    "outfit recommendation",
    "AI styling",
    "virtual try-on",
  ],
  openGraph: {
    title: "YiYi AI — AI Outfit Planner & Smart Wardrobe",
    description:
      "Generate personalized outfit recommendations with AI. Upload your wardrobe, get weather-aware daily looks, and discover your style.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link
          crossOrigin="anonymous"
          href="https://fonts.gstatic.com"
          rel="preconnect"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Epilogue:wght@400;500;600;700;800;900&family=Manrope:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
