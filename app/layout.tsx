import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#6b4684",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://hotsite-evento-pink.vercel.app"),
  title: "Fernanda Seppi - 40 Anos 🌸✨",
  description: "Sistema Oficial de Convites, RSVP e Gestão de Festa de 40 Anos da Fernanda Seppi",
  manifest: "/manifest.json",
  openGraph: {
    title: "Fernanda Seppi - 40 Anos 🌸✨",
    description: "Confirmação de Presença Oficial para os 40 Anos da Fernanda Seppi",
    url: "https://hotsite-evento-pink.vercel.app",
    siteName: "Fernanda Seppi 40 Anos",
    images: [
      {
        url: "/og-save-the-date.jpg",
        width: 1200,
        height: 1600,
        alt: "Save The Date - Fernanda Seppi 40 Anos",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fernanda Seppi - 40 Anos 🌸✨",
    description: "Confirmação de Presença Oficial para os 40 Anos da Fernanda Seppi",
    images: ["/og-save-the-date.jpg"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Fernanda 40",
  },
};

import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
