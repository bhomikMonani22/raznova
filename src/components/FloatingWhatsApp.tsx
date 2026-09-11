"use client";

import { usePathname } from "next/navigation";
import { whatsappLink } from "@/lib/config";

// Always-available WhatsApp entry point, fixed bottom-right on every page, so
// a visitor is never more than one tap from an enquiry. The message is
// pre-filled (and locale-aware) so the first line already reads as a lead.
// wa.me clicks are recorded by the site-wide Analytics click listener, so
// these show up as whatsapp_click in /insights. Hidden on the private
// dashboard and on the quote page (which has its own form + CTAs).

const LABEL = { en: "Chat on WhatsApp", es: "WhatsApp" };
const MESSAGE = {
  en: "Hi Raznova, I'd like a wholesale quote for two-wheeler spare parts (Hero-fitment, Bajaj, TVS).",
  es: "Hola Raznova, quiero cotizar repuestos al por mayor para motos (fitment Hero, Bajaj, TVS).",
};

export default function FloatingWhatsApp() {
  const pathname = usePathname() || "/";
  if (pathname.startsWith("/insights") || /\/quote\/?$/.test(pathname)) return null;

  const isEs = pathname === "/es" || pathname.startsWith("/es/");
  const lang: "en" | "es" = isEs ? "es" : "en";

  return (
    <a
      href={whatsappLink(MESSAGE[lang])}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={LABEL[lang]}
      className="wa-float fixed bottom-5 right-5 z-40 inline-flex min-h-14 items-center gap-2.5 rounded-full bg-[#25D366] pl-4 pr-5 text-[15px] font-semibold text-[#04310f] shadow-lg transition-transform duration-200 hover:scale-105 md:bottom-6 md:right-6"
    >
      <svg
        viewBox="0 0 24 24"
        width="26"
        height="26"
        fill="currentColor"
        aria-hidden="true"
        className="shrink-0"
      >
        <path d="M17.47 14.38c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.5 0 1.47 1.08 2.9 1.23 3.1.15.2 2.12 3.24 5.14 4.54.72.31 1.28.5 1.71.64.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35zM12.04 21.5h-.01a9.4 9.4 0 0 1-4.79-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.38 9.38 0 0 1-1.44-5.01c0-5.18 4.22-9.4 9.41-9.4 2.51 0 4.87.98 6.64 2.76a9.35 9.35 0 0 1 2.75 6.65c-.01 5.18-4.22 9.4-9.4 9.4zm8-17.4A11.32 11.32 0 0 0 12.04 1C5.8 1 .73 6.07.73 12.3c0 1.99.52 3.94 1.51 5.65L.64 23.5l5.7-1.49a11.28 11.28 0 0 0 5.7 1.45h.01c6.23 0 11.3-5.07 11.3-11.3 0-3.02-1.18-5.86-3.31-7.99z" />
      </svg>
      <span>{LABEL[lang]}</span>
    </a>
  );
}
