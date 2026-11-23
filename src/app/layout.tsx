import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GlobalAntiCheat } from "@/components/GlobalAntiCheat";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Online Examination Portal",
  description: "Southland College multimedia, UX, and AI workflow examination portal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full m-0 p-0 bg-[#f5f5f7] text-[#1d1d1f]">
        <GlobalAntiCheat>
          {children}
        </GlobalAntiCheat>
      </body>
    </html>
  );
}
