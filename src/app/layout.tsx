import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Thai, Sarabun, Bai_Jamjuree } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-sans-thai",
  subsets: ["thai"],
  weight: ["300", "400", "500", "600", "700"],
});

// Prefer Sarabun for better Thai legibility
const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["thai"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

// Looped Thai font (มีหัว) - formal and highly readable
const baiJamjuree = Bai_Jamjuree({
  variable: "--font-bai-jamjuree",
  subsets: ["thai"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "A-med Helper Unipharm MSU",
  description: "A-med Helper Unipharm MSU",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSansThai.variable} ${sarabun.variable} ${baiJamjuree.variable} antialiased font-sans`}
        style={{ fontSynthesis: "none", textRendering: "optimizeLegibility" }}
      >
        {children}
      </body>
    </html>
  );
}
