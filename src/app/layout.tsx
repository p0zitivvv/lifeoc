import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LifeOSProvider } from "@/context/LifeOSContext";

export const metadata: Metadata = {
  title: "LIFE OS — Система личной дисциплины и продуктивности",
  description:
    "Персональная система управления повседневной жизнью: автоматическое планирование, привычки, учеба, фитнес, питание, водный баланс, экранный режим и сон.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LIFE OS",
  },
};

export const viewport: Viewport = {
  themeColor: "#84cc16",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark">
      <head>
        <link rel="icon" href="/icons/icon-192.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body className="bg-background text-zinc-100 min-h-screen">
        <LifeOSProvider>{children}</LifeOSProvider>
      </body>
    </html>
  );
}
