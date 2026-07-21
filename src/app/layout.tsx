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
  metadataBase: new URL("https://raznova.in"),
  title: "Motorcycle Spare Parts Exporter India | Raznova Exports",
  description:
    "IEC-registered two-wheeler spare parts exporter in Pune, India. OEM-pattern and aftermarket compatible ranges shipped worldwide from Nhava Sheva (JNPT).",
  openGraph: {
    title: "Raznova Exports — Two-Wheeler Spare Parts Export",
    description:
      "Genuine and OEM-grade two-wheeler spare parts from Pune, India. IEC HFRPM4730J · GSTIN 27HFRPM4730J1ZT.",
    url: "https://raznova.in",
    siteName: "Raznova Exports",
    images: [{ url: "/brand/og.jpg", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    images: ["/brand/og.jpg"],
  },
};

// Runs synchronously before body paint: decides whether the once-per-session
// intro curtain shows, so returning visitors never see a flash of it.
// Desktop (fine pointer) only — mobile buyers land straight on content and
// the mobile LCP budget stays intact.
const INTRO_GATE = `try{if(!sessionStorage.getItem("rz-intro")&&matchMedia("(pointer: fine)").matches&&!matchMedia("(prefers-reduced-motion: reduce)").matches){document.documentElement.classList.add("intro-pending")}}catch(e){}`;

// One IntersectionObserver drives every [data-reveal] element on the page.
// ~400 bytes replaces per-section framer-motion hydration, so reveal-only
// sections stay server components (LCP/TBT budget). Elements reveal once.
const REVEAL_OBSERVER = `(function(){function s(){var m=matchMedia("(prefers-reduced-motion: reduce)").matches;var n=document.querySelectorAll("[data-reveal]:not(.is-visible)");if(m||!("IntersectionObserver"in window)){n.forEach(function(e){e.classList.add("is-visible")});return}var o=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("is-visible");o.unobserve(e.target)}})},{rootMargin:"0px 0px -8% 0px"});n.forEach(function(e){o.observe(e)});var c=document.querySelectorAll("[data-countup]");if(!c.length)return;var co=new IntersectionObserver(function(es){es.forEach(function(en){if(!en.isIntersecting)return;co.unobserve(en.target);var el=en.target,tv=parseInt(el.getAttribute("data-countup"),10)||0,sf=el.getAttribute("data-countup-suffix")||"",t0=0;function f(ts){if(!t0)t0=ts;var p=Math.min((ts-t0)/1200,1);el.textContent=Math.round(tv*(1-Math.pow(1-p,3)))+sf;if(p<1)requestAnimationFrame(f)}requestAnimationFrame(f)})},{rootMargin:"0px 0px -8% 0px"});c.forEach(function(e){co.observe(e)})}if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",s)}else{s()}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${display.variable} ${body.variable}`}>
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--ink)] antialiased font-body">
        <script dangerouslySetInnerHTML={{ __html: INTRO_GATE }} />
        <script dangerouslySetInnerHTML={{ __html: REVEAL_OBSERVER }} />
        <IntroCurtain />
        <LenisProvider />
        {children}
      </body>
    </html>
  );
}
