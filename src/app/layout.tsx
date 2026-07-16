import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import "./globals.css";
import LenisProvider from "@/components/LenisProvider";
import IntroCurtain from "@/components/IntroCurtain";

// Display: Geist (600/700, -2% tracking via .font-display) for confident,
// institutional headlines. Body: Inter at 15-16px. Mono (credentials) and
// serif (pull-quotes) use system stacks — zero extra font payload.
// display: "optional" — fonts are preloaded and almost always ready at first
// paint; when they're not, the fallback stays. No late swap repaint, so text
// LCP entries are never re-emitted (budget rule: perf wins over polish).
const display = Geist({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
  display: "optional",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "optional",
});

export const metadata: Metadata = {
  title: "Raznova Exports — Two-Wheeler Spare Parts, Exported Worldwide",
  description:
    "Raznova Exports supplies genuine and OEM-grade two-wheeler spare parts from Pune, India to Latin America and Africa. IEC HFRPM4730J · GSTIN 27HFRPM4730J1ZT.",
};

// Runs synchronously before body paint: decides whether the once-per-session
// intro curtain shows, so returning visitors never see a flash of it.
// Desktop (fine pointer) only — mobile buyers land straight on content and
// the mobile LCP budget stays intact.
const INTRO_GATE = `try{if(!sessionStorage.getItem("rz-intro")&&matchMedia("(pointer: fine)").matches&&!matchMedia("(prefers-reduced-motion: reduce)").matches){document.documentElement.classList.add("intro-pending")}}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${display.variable} ${body.variable}`}>
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--ink)] antialiased font-body">
        <script dangerouslySetInnerHTML={{ __html: INTRO_GATE }} />
        <IntroCurtain />
        <LenisProvider />
        {children}
      </body>
    </html>
  );
}
