import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RegisterSW } from "@/components/RegisterSW";
import { SafeAnalytics } from "@/components/SafeAnalytics";
import { UsageTracker } from "@/components/UsageTracker";

export const metadata: Metadata = {
  title: "Odogwu — spray money from your phone",
  description:
    "Digital money spraying for weddings, birthdays and every owambe. Guests spray from their phones, the celebrant gets paid to their bank the next working day.",
  applicationName: "Odogwu",
  appleWebApp: { capable: true, title: "Odogwu", statusBarStyle: "black-translucent" },
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#2a0820",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Unbounded:wght@600;700;800&display=swap"
        />
      </head>
      <body>
        {children}
        <RegisterSW />
        <SafeAnalytics />
        <UsageTracker />
      </body>
    </html>
  );
}
