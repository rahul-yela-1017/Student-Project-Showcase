import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { DataSourceBanner } from "@/components/DataSourceBanner";
import { INSTITUTE } from "@/lib/constants";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display-var",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Student Project Showcase — Malla Reddy Vishwavidyapeeth",
    template: "%s — Student Project Showcase",
  },
  description:
    "A centralized platform for Malla Reddy Vishwavidyapeeth students to publish academic projects, share technical skills, and discover innovative work from their peers.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <AppProviders>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[110] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary focus:shadow-lg"
          >
            Skip to main content
          </a>
          <Navbar />
          <DataSourceBanner />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
        </AppProviders>
        <script
          dangerouslySetInnerHTML={{
            __html: `document.title = document.title || "Student Project Showcase — ${INSTITUTE.name}";`,
          }}
        />
      </body>
    </html>
  );
}
