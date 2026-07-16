// Business credentials — displayed prominently and consistently site-wide.
export const WHATSAPP_NUMBER = "+919307429165";
export const CONTACT_PHONE_DISPLAY = "+91 93074 29165";
export const CONTACT_EMAIL = "raznovaexports@gmail.com";
export const COMPANY = "Shrinath Ji Enterprises, Pune, India";
export const ENTITY_LINE = "Raznova Exports · A unit of Shrinath Ji Enterprises · Pune, India";
export const IEC = "HFRPM4730J";
export const GSTIN = "27HFRPM4730J1ZT";
export const SITE_DOMAIN = "raznova.in";
export const SUPABASE_URL = "https://lsnudhxlyypugunlgwxi.supabase.co";

export const BRAND_NAME = "Raznova";

export function whatsappLink(message: string) {
  const digits = WHATSAPP_NUMBER.replace(/[^\d+]/g, "");
  return `https://wa.me/${digits.replace("+", "")}?text=${encodeURIComponent(message)}`;
}

export function telLink() {
  return `tel:${WHATSAPP_NUMBER}`;
}

export function mailtoLink(subject: string) {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
