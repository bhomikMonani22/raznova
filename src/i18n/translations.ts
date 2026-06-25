import type { Locale } from "./locales";

export type Translations = {
  nav: {
    home: string;
    motorcycle: string;
    threeWheeler: string;
    requestQuote: string;
    language: string;
  };
  hero: {
    title: string;
    subtitle: string;
    cta: string;
  };
  showcase: {
    title: string;
    subtitle: string;
    fitmentRef: string;
    viewCatalog: string;
  };
  catalog: {
    title: string;
    backToBrands: string;
    viewPdf: string;
    download: string;
    filterByModel: string;
    clearFilter: string;
    noResults: string;
  };
  quote: {
    title: string;
    subtitle: string;
    name: string;
    company: string;
    country: string;
    email: string;
    whatsapp: string;
    partsList: string;
    partsListPlaceholder: string;
    submit: string;
    submitting: string;
    success: string;
    error: string;
    orContact: string;
    whatsappButton: string;
    emailButton: string;
  };
  disclaimer: {
    fitment: string;
  };
  footer: {
    brandLine: string;
    gstin: string;
    disclaimer: string;
    regions: string;
    rights: string;
  };
};

export const TRANSLATIONS: Record<Locale, Translations> = {
  en: {
    nav: {
      home: "Home",
      motorcycle: "Motorcycle",
      threeWheeler: "Three Wheeler",
      requestQuote: "Request Quote",
      language: "Language",
    },
    hero: {
      title: "Genuine & OEM-Grade Two-Wheeler Spare Parts, Exported Worldwide",
      subtitle:
        "Raznova supplies own-brand and trusted carried-brand spare parts for Hero, Bajaj, TVS and more — built for export partners across Latin America and Africa.",
      cta: "Request a Quote",
    },
    showcase: {
      title: "Featured Bikes & Fast-Moving Parts",
      subtitle: "A curated look at our most-requested models and parts.",
      fitmentRef: "Fitment ref.",
      viewCatalog: "View full catalogue",
    },
    catalog: {
      title: "Catalogue",
      backToBrands: "Back to brands",
      viewPdf: "View",
      download: "Download",
      filterByModel: "Filter by model",
      clearFilter: "Clear filter",
      noResults: "No catalogues found for this selection.",
    },
    quote: {
      title: "Request a Quote",
      subtitle: "Send us your sample order list and we'll get back to you with availability and lead times.",
      name: "Full name",
      company: "Company",
      country: "Country",
      email: "Email",
      whatsapp: "WhatsApp number",
      partsList: "Parts list / sample order",
      partsListPlaceholder: "e.g. Apache RTR 160 brake shoe x 50, Boxer CT100 chain sprocket kit x 100 ...",
      submit: "Send Request",
      submitting: "Sending...",
      success: "Thank you! Your request has been received — our team will contact you shortly.",
      error: "Something went wrong. Please try again or contact us directly.",
      orContact: "Or reach us directly",
      whatsappButton: "WhatsApp Us",
      emailButton: "Email Us",
    },
    disclaimer: {
      fitment:
        "OEM part numbers and brand names are referenced for fitment identification only. Raznova is not affiliated with the original equipment manufacturers.",
    },
    footer: {
      brandLine: "Raznova is a brand of Shrinath Ji Enterprises.",
      gstin: "GSTIN 27HFRPM4730J1ZT",
      disclaimer:
        "OEM brand names are referenced for fitment identification only.",
      regions: "Serving export partners across Latin America & Africa.",
      rights: "All rights reserved.",
    },
  },
  es: {
    nav: {
      home: "Inicio",
      motorcycle: "Motocicleta",
      threeWheeler: "Triciclo",
      requestQuote: "Solicitar Cotización",
      language: "Idioma",
    },
    hero: {
      title: "Repuestos para Motos de Calidad OEM, Exportados a Todo el Mundo",
      subtitle:
        "Raznova suministra repuestos de marca propia y de marcas reconocidas para Hero, Bajaj, TVS y más — pensado para socios exportadores en América Latina y África.",
      cta: "Solicitar Cotización",
    },
    showcase: {
      title: "Motos Destacadas y Repuestos de Alta Rotación",
      subtitle: "Una selección de nuestros modelos y repuestos más solicitados.",
      fitmentRef: "Ref. de compatibilidad",
      viewCatalog: "Ver catálogo completo",
    },
    catalog: {
      title: "Catálogo",
      backToBrands: "Volver a marcas",
      viewPdf: "Ver",
      download: "Descargar",
      filterByModel: "Filtrar por modelo",
      clearFilter: "Quitar filtro",
      noResults: "No se encontraron catálogos para esta selección.",
    },
    quote: {
      title: "Solicitar Cotización",
      subtitle: "Envíenos su lista de pedido de muestra y le responderemos con disponibilidad y tiempos de entrega.",
      name: "Nombre completo",
      company: "Empresa",
      country: "País",
      email: "Correo electrónico",
      whatsapp: "Número de WhatsApp",
      partsList: "Lista de repuestos / pedido de muestra",
      partsListPlaceholder: "ej. Zapata de freno Apache RTR 160 x 50, kit de piñón y cadena Boxer CT100 x 100 ...",
      submit: "Enviar Solicitud",
      submitting: "Enviando...",
      success: "¡Gracias! Hemos recibido su solicitud — nuestro equipo se pondrá en contacto pronto.",
      error: "Ocurrió un error. Intente nuevamente o contáctenos directamente.",
      orContact: "O contáctenos directamente",
      whatsappButton: "Escríbenos por WhatsApp",
      emailButton: "Escríbenos por Correo",
    },
    disclaimer: {
      fitment:
        "Los números de pieza OEM y nombres de marca se mencionan únicamente para identificar compatibilidad. Raznova no está afiliada con los fabricantes originales.",
    },
    footer: {
      brandLine: "Raznova es una marca de Shrinath Ji Enterprises.",
      gstin: "GSTIN 27HFRPM4730J1ZT",
      disclaimer:
        "Los nombres de marcas OEM se mencionan únicamente para identificar compatibilidad.",
      regions: "Atendiendo a socios exportadores en América Latina y África.",
      rights: "Todos los derechos reservados.",
    },
  },
  "en-ZA": {
    nav: {
      home: "Home",
      motorcycle: "Motorcycle",
      threeWheeler: "Three Wheeler",
      requestQuote: "Request Quote",
      language: "Language",
    },
    hero: {
      title: "Genuine & OEM-Grade Two-Wheeler Spare Parts, Exported to Africa",
      subtitle:
        "Raznova supplies own-brand and trusted carried-brand spare parts for Hero, Bajaj, TVS and more — built for distribution partners across Southern and East Africa.",
      cta: "Request a Quote",
    },
    showcase: {
      title: "Featured Bikes & Fast-Moving Parts",
      subtitle: "A curated look at our most-requested models and parts.",
      fitmentRef: "Fitment ref.",
      viewCatalog: "View full catalogue",
    },
    catalog: {
      title: "Catalogue",
      backToBrands: "Back to brands",
      viewPdf: "View",
      download: "Download",
      filterByModel: "Filter by model",
      clearFilter: "Clear filter",
      noResults: "No catalogues found for this selection.",
    },
    quote: {
      title: "Request a Quote",
      subtitle: "Send us your sample order list and we'll get back to you with availability and shipping lead times to Africa.",
      name: "Full name",
      company: "Company",
      country: "Country",
      email: "Email",
      whatsapp: "WhatsApp number",
      partsList: "Parts list / sample order",
      partsListPlaceholder: "e.g. Apache RTR 160 brake shoe x 50, Boxer CT100 chain sprocket kit x 100 ...",
      submit: "Send Request",
      submitting: "Sending...",
      success: "Thank you! Your request has been received — our team will contact you shortly.",
      error: "Something went wrong. Please try again or contact us directly.",
      orContact: "Or reach us directly",
      whatsappButton: "WhatsApp Us",
      emailButton: "Email Us",
    },
    disclaimer: {
      fitment:
        "OEM part numbers and brand names are referenced for fitment identification only. Raznova is not affiliated with the original equipment manufacturers.",
    },
    footer: {
      brandLine: "Raznova is a brand of Shrinath Ji Enterprises.",
      gstin: "GSTIN 27HFRPM4730J1ZT",
      disclaimer:
        "OEM brand names are referenced for fitment identification only.",
      regions: "Shipping to distribution partners across Southern & East Africa.",
      rights: "All rights reserved.",
    },
  },
};

export function getTranslations(locale: Locale): Translations {
  return TRANSLATIONS[locale];
}
