// Fill these in before going live.
export const WHATSAPP_NUMBER = "+91XXXXXXXXXX";
export const CONTACT_EMAIL = "sales@raznova.in";
export const COMPANY = "Shrinath Ji Enterprises, Pune, India";
export const GSTIN = "27HFRPM4730J1ZT";
export const SITE_DOMAIN = "raznova.in";
export const SUPABASE_URL = "https://lsnudhxlyypugunlgwxi.supabase.co";

export const BRAND_NAME = "Raznova";

export function whatsappLink(message: string) {
  const digits = WHATSAPP_NUMBER.replace(/[^\d+]/g, "");
  return `https://wa.me/${digits.replace("+", "")}?text=${encodeURIComponent(message)}`;
}

export function mailtoLink(subject: string) {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
