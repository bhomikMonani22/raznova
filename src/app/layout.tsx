import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import "./globals.css";
import LenisProvider from "@/components/LenisProvider";
import { BRAND_NAME } from "@/lib/config";

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
      "OEM-pattern and aftermarket compatible two-wheeler spare parts from Pune, India. IEC HFRPM4730J · GSTIN 27HFRPM4730J1ZT.",
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

// Runs synchronously before body paint: sets the document language from the
// URL and decides whether the once-per-session intro curtain shows, so
// returning visitors never see a flash of it. Desktop (fine pointer) only —
// mobile buyers land straight on content and the LCP budget stays intact.
const HEAD_GATE = `try{var e=document.documentElement,m=location.pathname.match(/^\\/(en-ZA|en|es)(\\/|$)/);if(m)e.lang=m[1];if(!sessionStorage.getItem("rz-intro")&&matchMedia("(pointer: fine)").matches&&!matchMedia("(prefers-reduced-motion: reduce)").matches){e.classList.add("intro-pending");sessionStorage.setItem("rz-intro","1")}}catch(x){}`;

// All non-critical interactivity in ~1KB of inline script, so reveal-only
// sections, the hero and the contact finale stay server components with no
// hydration cost: [data-reveal] observer, [data-countup] counter, magnetic
// CTA pull, and the intro-curtain lift.
const BOOT = `(function(){var d=document,dE=d.documentElement,R=matchMedia("(prefers-reduced-motion: reduce)").matches;
function reveal(){var n=d.querySelectorAll("[data-reveal]:not(.is-visible)");if(R||!("IntersectionObserver"in window)){n.forEach(function(e){e.classList.add("is-visible")});return}var o=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("is-visible");o.unobserve(e.target)}})},{rootMargin:"0px 0px -8% 0px"});n.forEach(function(e){o.observe(e)});var c=d.querySelectorAll("[data-countup]");if(!c.length)return;var co=new IntersectionObserver(function(es){es.forEach(function(en){if(!en.isIntersecting)return;co.unobserve(en.target);var el=en.target,tv=parseInt(el.getAttribute("data-countup"),10)||0,sf=el.getAttribute("data-countup-suffix")||"",t0=0;function f(ts){if(!t0)t0=ts;var p=Math.min((ts-t0)/1200,1);el.textContent=Math.round(tv*(1-Math.pow(1-p,3)))+sf;if(p<1)requestAnimationFrame(f)}requestAnimationFrame(f)})},{rootMargin:"0px 0px -8% 0px"});c.forEach(function(e){co.observe(e)})}
function magnetic(){if(R||!matchMedia("(pointer: fine)").matches)return;d.querySelectorAll("[data-magnetic]").forEach(function(el){el.addEventListener("mousemove",function(ev){var r=el.getBoundingClientRect(),x=Math.max(-1,Math.min(1,(ev.clientX-(r.left+r.width/2))/(r.width/2)))*6,y=Math.max(-1,Math.min(1,(ev.clientY-(r.top+r.height/2))/(r.height/2)))*6;el.style.transform="translate("+x.toFixed(1)+"px,"+y.toFixed(1)+"px)"});el.addEventListener("mouseleave",function(){el.style.transform=""})})}
function curtain(){if(!dE.classList.contains("intro-pending"))return;setTimeout(function(){dE.classList.add("intro-lifting")},450);setTimeout(function(){dE.classList.remove("intro-pending","intro-lifting")},1000)}
function boot(){reveal();magnetic();curtain()}
if(d.readyState==="loading"){d.addEventListener("DOMContentLoaded",boot)}else{boot()}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${display.variable} ${body.variable}`}>
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--ink)] antialiased font-body">
        <script dangerouslySetInnerHTML={{ __html: HEAD_GATE }} />
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />

        {/* Once-per-session intro curtain. Rendered server-side; visibility
            and the lift are driven entirely by the scripts above + CSS, so
            no client component is needed. */}
        <div
          id="intro-curtain"
          aria-hidden="true"
          className="fixed inset-0 z-[100] items-center justify-center bg-[var(--bg)]"
        >
          <span className="intro-mark flex flex-col items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/raznova-mark.png"
              alt=""
              width={72}
              height={72}
              className="h-[72px] w-[72px]"
            />
            <span className="font-display text-3xl font-bold tracking-tight text-[var(--ink)]">
              {BRAND_NAME}
              <span className="text-[var(--accent)]">.</span>
            </span>
          </span>
        </div>

        <LenisProvider />
        {children}
      </body>
    </html>
  );
}
