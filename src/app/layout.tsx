import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SmartphoneFrame } from "@/components/SmartphoneFrame";
import { BottomNav } from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "AFTER DARK — Party Game Sociale",
  description: "Il party game sociale multiplayer per le tue serate dal vivo. Missioni segrete, bluff e caos controllato.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AFTER DARK",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#06030c",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" className="dark h-full antialiased bg-[#040208] text-slate-100 selection:bg-rose-500 selection:text-white">
      <body className="min-h-full font-sans bg-[#040208] text-slate-100 overflow-x-hidden">
        <SmartphoneFrame>
          {children}
          <BottomNav />
        </SmartphoneFrame>
      </body>
    </html>
  );
}
