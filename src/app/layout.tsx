import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";

// Design spec calls for Clash Display (600/700) + Satoshi (400/500/600),
// both free Fontshare fonts that aren't on next/font/google and aren't
// straightforward to self-host via @font-face in this environment (no
// network access to fetch the font files at build time). Substituting the
// closest next/font/google equivalents: Outfit (geometric, confident
// display letterforms similar to Clash Display) for headings, and Inter
// (humanist, highly legible UI/body grotesque similar to Satoshi) for body
// copy. Swap these for the real Fontshare files later by replacing this
// block with local @font-face declarations in globals.css.
const display = Outfit({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Raznova — Two-Wheeler Spare Parts Export",
  description:
    "Raznova exports genuine and OEM-grade two-wheeler spare parts to Latin America and Africa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${display.variable} ${body.variable}`}>
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--ink)] antialiased font-body">
        {children}
      </body>
    </html>
  );
}
