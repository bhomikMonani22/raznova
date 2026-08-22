import type { Locale } from "./locales";

export type Translations = {
  nav: {
    home: string;
    motorcycle: string;
    threeWheeler: string;
    partBrands: string;
    requestQuote: string;
    language: string;
  };
  hero: {
    title: string;
    subtitle: string;
    cta: string;
    ctaBrowse: string;
    ctaQuote: string;
    ctaWhatsapp: string;
    ctaEmail: string;
    statFitment: string;
    statShipping: string;
    statExport: string;
  };
  trust: {
    brandsLabel: string;
    brandsSub: string;
    iecLabel: string;
    gstinLabel: string;
    portLabel: string;
    portValue: string;
  };
  inventory: {
    eyebrow: string;
    title: string;
    subtitle: string;
    captionFloor: string;
    captionOffice: string;
    captionPigeonholes: string;
    captionBulk: string;
    captionDispatch: string;
  };
  categories: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: { title: string; body: string }[];
  };
  howWeWork: {
    eyebrow: string;
    title: string;
    steps: { title: string; body: string }[];
  };
  lightSection: {
    eyebrow: string;
    title: string;
    body: string;
    quote: string;
  };
  contactFinale: {
    eyebrow: string;
    title: string;
    whatsappCta: string;
    emailCta: string;
    callLabel: string;
    credsTitle: string;
  };
  about: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
    linksTitle: string;
  };
  partsIndex: {
    eyebrow: string;
    title: string;
    lead: string;
    note: string;
    partsFor: string;
    viewCatalogue: string;
    linkLabel: string;
  };
  catalogue: {
    eyebrow: string;
    title: string;
    lead: string;
    note: string;
    partNo: string;
    description: string;
    fits: string;
    category: string;
    download: string;
    partsCount: string;
    otherBrands: string;
    linkLabel: string;
  };
  globalReach: {
    eyebrow: string;
    title: string;
    lead: string;
    originLabel: string;
    lanesTitle: string;
    transitLabel: string;
    lanes: { port: string; country: string; transit: string }[];
  };
  positioning: {
    line: string;
  };
  brandsMarquee: {
    title: string;
  };
  showcase: {
    title: string;
    subtitle: string;
    viewCatalog: string;
  };
  fitmentStrip: {
    label: string;
  };
  whyRaznova: {
    title: string;
    sourcingTitle: string;
    sourcingBody: string;
    workhorseTitle: string;
    workhorseBody: string;
    moqTitle: string;
    moqBody: string;
    termsTitle: string;
    termsBody: string;
  };
  howToOrder: {
    title: string;
    step1Title: string;
    step1Body: string;
    step2Title: string;
    step2Body: string;
    step3Title: string;
    step3Body: string;
  };
  markets: {
    title: string;
    latamTitle: string;
    latamBody: string;
    africaTitle: string;
    africaBody: string;
  };
  quoteCta: {
    title: string;
    subtitle: string;
    button: string;
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
      partBrands: "Part Brands",
      requestQuote: "Request Quote",
      language: "Language",
    },
    hero: {
      title: "Genuine & OEM-Grade Two-Wheeler Spare Parts, Exported Worldwide",
      subtitle:
        "Raznova supplies own-brand and trusted carried-brand spare parts for Hero, Bajaj, TVS and more — built for export partners across Latin America and Africa.",
      cta: "Request a Quote",
      ctaBrowse: "Browse Catalogs",
      ctaQuote: "Request a Quote",
      ctaWhatsapp: "Get a Quote on WhatsApp",
      ctaEmail: "Email us",
      statFitment: "Hero · Bajaj · TVS fitment",
      statShipping: "Shipping to LatAm & Africa",
      statExport: "Export-ready: IEC & GST registered",
    },
    trust: {
      brandsLabel: "brand patterns",
      brandsSub: "Hero · Bajaj · TVS · Honda fitment",
      iecLabel: "IEC",
      gstinLabel: "GSTIN",
      portLabel: "Ships from",
      portValue: "Nhava Sheva (JNPT)",
    },
    inventory: {
      eyebrow: "Inventory",
      title: "Full Range. Full Inventory.",
      subtitle:
        "Complete two-wheeler parts coverage — engine, electrical, transmission, body — stocked and dispatch-ready.",
      captionFloor: "Export cartons staged on the dispatch floor",
      captionOffice: "OEM-pattern stock, binned and labelled",
      captionPigeonholes: "Small-parts racking — thousands of live SKUs",
      captionBulk: "Bulk carton storage, ready to consolidate",
      captionDispatch: "Pick faces replenished daily",
    },
    categories: {
      eyebrow: "Coverage",
      title: "Product categories",
      subtitle: "Eight families of coverage across every fast-moving platform.",
      items: [
        { title: "Engine Components", body: "Cylinder blocks, valves, timing kits, oil seals." },
        { title: "Electricals & CDI", body: "CDI units, ignition coils, switches, indicators, bulbs." },
        { title: "Clutch & Transmission", body: "Clutch assemblies, plates, pressure plates, chain-sprocket kits." },
        { title: "Cables & Controls", body: "Accelerator, clutch, brake and speedometer cables, levers, locksets." },
        { title: "Brakes & Suspension", body: "Brake shoes, levers, front and rear shock absorbers." },
        { title: "Filters & Service Parts", body: "Air filters, oil filters, spark plugs, bearings." },
        { title: "Body & Visors", body: "Mirrors, visors, indicators and body fitment parts." },
        { title: "Batteries & Tyres-Tubes", body: "Batteries plus JK Tyre tyres and tubes, export-packed." },
      ],
    },
    howWeWork: {
      eyebrow: "Export operations",
      title: "How we work",
      steps: [
        { title: "Enquiry", body: "Send your parts list on WhatsApp or email — model, part, quantity." },
        { title: "Quote in 24h", body: "Line-by-line pricing with availability and lead times, within one working day." },
        { title: "Packing & QC", body: "Every carton checked, sea-worthy export packing, photographed before sealing." },
        { title: "Dispatch & BL", body: "Container dispatch from Nhava Sheva (JNPT) with the full document set — BL, invoice, packing list." },
      ],
    },
    lightSection: {
      eyebrow: "Sourcing",
      title: "Sourced from Pune's OE-supplier belt.",
      body: "Raznova operates from Pune, home to the Tier-1 ecosystem that supplies India's two-wheeler OEMs. Two decades of distributor-grade parts knowledge decide what goes into every container.",
      quote: "We ship the parts that keep a fleet earning — nothing that sits on a shelf.",
    },
    contactFinale: {
      eyebrow: "Contact",
      title: "Sourcing two-wheeler spares? Talk to us today.",
      whatsappCta: "Get a Quote on WhatsApp",
      emailCta: "Email us",
      callLabel: "Call or WhatsApp",
      credsTitle: "Business credentials",
    },
    about: {
      eyebrow: "About Raznova Exports",
      title: "Two-wheeler spare parts exporter, Pune, India",
      paragraphs: [
        "Raznova Exports is an IEC-registered exporter of two-wheeler spare parts, operating from Pune in the heart of India's OE-supplier belt. We supply OEM-pattern and aftermarket compatible parts with fitment across Hero, Bajaj, TVS and Honda motorcycle platforms to importers, distributors, wholesalers and dealer networks overseas.",
        "Our range covers engine components, electricals and CDI, clutch and transmission, cables and controls, brakes and suspension, filters and service parts, body and visors, and batteries and tyres-tubes. We stock the fast-moving references that turn over in real markets rather than slow long-tail parts, and we consolidate mixed-model, mixed-category container loads so a distributor can cover a whole market from one shipment.",
        "Every consignment is QC-checked, sea-worthy export-packed and photographed before sealing, then dispatched from Nhava Sheva (JNPT) with a complete document set — bill of lading, commercial invoice and packing list. We ship to Latin America and to East and Southern Africa on TT or LC terms, with ECGC-insured export shipments and quotations returned within one working day.",
      ],
      linksTitle: "Export markets and fitment ranges",
    },
    partsIndex: {
      eyebrow: "Parts index",
      title: "Two-wheeler spare parts index",
      lead: "The complete reference list of spare parts we stock and export, grouped by the motorcycle platform they fit. Every item below is an OEM-pattern or aftermarket compatible part held for wholesale export from Pune, India.",
      note: "Part names indicate the vehicle a component fits. Send any list of items from this page for a line-by-line quotation with availability and lead times.",
      partsFor: "spare parts",
      viewCatalogue: "View catalogue",
      linkLabel: "Full parts index",
    },
    catalogue: {
      eyebrow: "Colombia · Parts catalogue",
      title: "Hero-fitment parts catalogue — Colombia",
      lead: "Working reference list of Hero-fitment spare parts we supply into the Colombian market, listed by the model each part fits. Part numbers are OEM-pattern references for fitment identification. No pricing is published — send a list for a line-by-line quotation.",
      note: "Descriptions are shown in Spanish exactly as they appear on our Colombian order sheets, with an English equivalent alongside.",
      partNo: "Part number",
      description: "Description",
      fits: "Fits",
      category: "Category",
      download: "Download as CSV",
      partsCount: "part references",
      otherBrands: "Bajaj-compatible and TVS-pattern catalogues for Colombia are available on request — send us the models you stock and we will return a matching list.",
      linkLabel: "Colombia parts catalogue",
    },
    globalReach: {
      eyebrow: "Global reach",
      title: "From Nhava Sheva to your port",
      lead: "Every consignment leaves India through Nhava Sheva (JNPT) and sails on established lanes to our active markets. Indicative transit times below; exact timing is confirmed at booking.",
      originLabel: "Nhava Sheva (JNPT), India",
      lanesTitle: "Active shipping lanes",
      transitLabel: "Indicative transit",
      lanes: [
        { port: "Mombasa", country: "Kenya", transit: "2–3 weeks" },
        { port: "Durban", country: "South Africa", transit: "≈3 weeks" },
        { port: "Port Louis", country: "Mauritius", transit: "≈2 weeks" },
        { port: "Cartagena", country: "Colombia", transit: "Long-haul, via trans-shipment" },
      ],
    },
    positioning: {
      line: "Genuine-grade aftermarket parts · OEM fitment referenced · Export-ready",
    },
    brandsMarquee: {
      title: "Brands we carry",
    },
    showcase: {
      title: "Featured Bikes & Fast-Moving Parts",
      subtitle: "A curated look at our most-requested models and parts.",
      viewCatalog: "View full catalogue",
    },
    fitmentStrip: {
      label: "Compatible fitment for:",
    },
    whyRaznova: {
      title: "Why Raznova",
      sourcingTitle: "Consolidated sourcing",
      sourcingBody: "One supplier for own-brand and carried-brand parts across multiple OEM platforms — fewer vendors, simpler logistics.",
      workhorseTitle: "Workhorse-model focus",
      workhorseBody: "We stock fast-moving, high-volume models that move in real markets, not long-tail parts that sit in a warehouse.",
      moqTitle: "Flexible MOQ",
      moqBody: "Sample orders and scalable minimums so new partners can test fitment and demand before committing to volume.",
      termsTitle: "Secure terms",
      termsBody: "TT / LC payment terms and ECGC-insured export shipments for predictable, protected trade.",
    },
    howToOrder: {
      title: "How to order",
      step1Title: "Browse",
      step1Body: "Explore our catalogues by brand and model to find the parts you need.",
      step2Title: "Send a sample order list",
      step2Body: "Share your parts list with quantities — we'll check availability and lead times.",
      step3Title: "Receive your quote",
      step3Body: "We respond with pricing, lead times, and shipping terms for your review.",
    },
    markets: {
      title: "Markets served",
      latamTitle: "Latin America",
      latamBody: "Colombia, Peru, Ecuador, Bolivia, Central America",
      africaTitle: "Africa",
      africaBody: "East & Southern Africa, West Africa",
    },
    quoteCta: {
      title: "Ready to source from Raznova?",
      subtitle: "Send your sample order list and we'll respond with availability, pricing and lead times.",
      button: "Request a Quote",
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
        "Raznova Exports is an independent exporter of OEM-pattern and aftermarket compatible parts. Not affiliated with or authorized by Hero MotoCorp, Bajaj Auto, TVS Motor, or Honda.",
      regions: "Serving export partners across Latin America & Africa.",
      rights: "All rights reserved.",
    },
  },
  es: {
    nav: {
      home: "Inicio",
      motorcycle: "Motocicleta",
      threeWheeler: "Triciclo",
      partBrands: "Marcas de Repuestos", // TODO: confirm Spanish copy
      requestQuote: "Solicitar Cotización",
      language: "Idioma",
    },
    hero: {
      title: "Repuestos para Motos de Calidad OEM, Exportados a Todo el Mundo",
      subtitle:
        "Raznova suministra repuestos de marca propia y de marcas reconocidas para Hero, Bajaj, TVS y más — pensado para socios exportadores en América Latina y África.",
      cta: "Solicitar Cotización",
      ctaBrowse: "Ver Catálogos", // TODO: confirm Spanish copy
      ctaQuote: "Solicitar Cotización",
      ctaWhatsapp: "Cotice por WhatsApp",
      ctaEmail: "Escríbanos",
      statFitment: "Compatibilidad Hero · Bajaj · TVS", // TODO: confirm Spanish copy
      statShipping: "Envíos a LatAm y África", // TODO: confirm Spanish copy
      statExport: "Listo para exportar: IEC y GST registrados", // TODO: confirm Spanish copy
    },
    trust: {
      brandsLabel: "patrones de marca",
      brandsSub: "Compatibilidad Hero · Bajaj · TVS · Honda",
      iecLabel: "IEC",
      gstinLabel: "GSTIN",
      portLabel: "Embarques desde",
      portValue: "Nhava Sheva (JNPT)",
    },
    inventory: {
      eyebrow: "Inventario",
      title: "Gama completa. Inventario completo.",
      subtitle:
        "Cobertura completa de repuestos para motos — motor, eléctrico, transmisión, carrocería — en stock y listos para despacho.",
      captionFloor: "Cartones de exportación en el piso de despacho",
      captionOffice: "Stock de patrón OEM, clasificado y etiquetado",
      captionPigeonholes: "Estanterías de piezas menudas — miles de SKUs activos",
      captionBulk: "Almacenaje de cartones a granel, listo para consolidar",
      captionDispatch: "Frentes de picking reabastecidos a diario",
    },
    categories: {
      eyebrow: "Cobertura",
      title: "Categorías de producto",
      subtitle: "Ocho familias de cobertura para todas las plataformas de alta rotación.",
      items: [
        { title: "Componentes de motor", body: "Bloques de cilindro, válvulas, kits de distribución, retenes." },
        { title: "Eléctricos y CDI", body: "Unidades CDI, bobinas de encendido, comandos, direccionales, bombillos." },
        { title: "Embrague y transmisión", body: "Conjuntos de embrague, discos, platos de presión, kits de piñón y cadena." },
        { title: "Cables y controles", body: "Cables de acelerador, embrague, freno y velocímetro, palancas, switches." },
        { title: "Frenos y suspensión", body: "Zapatas de freno, palancas, amortiguadores delanteros y traseros." },
        { title: "Filtros y mantenimiento", body: "Filtros de aire y aceite, bujías, rodamientos." },
        { title: "Carrocería y visores", body: "Espejos, visores, direccionales y piezas de carrocería." },
        { title: "Baterías y llantas-neumáticos", body: "Baterías, más llantas y neumáticos JK Tyre, empacados para exportación." },
      ],
    },
    howWeWork: {
      eyebrow: "Operaciones de exportación",
      title: "Cómo trabajamos",
      steps: [
        { title: "Consulta", body: "Envíe su lista de repuestos por WhatsApp o correo — modelo, pieza, cantidad." },
        { title: "Cotización en 24h", body: "Precios línea por línea con disponibilidad y plazos, dentro de un día hábil." },
        { title: "Empaque y QC", body: "Cada cartón verificado, empaque marítimo de exportación, fotografiado antes de sellar." },
        { title: "Despacho y BL", body: "Despacho de contenedores desde Nhava Sheva (JNPT) con documentación completa — BL, factura, lista de empaque." },
      ],
    },
    lightSection: {
      eyebrow: "Abastecimiento",
      title: "Abastecidos del cinturón de proveedores OE de Pune.",
      body: "Raznova opera desde Pune, sede del ecosistema Tier-1 que abastece a los fabricantes de motos de la India. Dos décadas de conocimiento de repuestos a nivel distribuidor deciden qué va en cada contenedor.",
      quote: "Enviamos las piezas que mantienen una flota produciendo — nada que se quede en el estante.",
    },
    contactFinale: {
      eyebrow: "Contacto",
      title: "¿Busca repuestos para motos? Hable con nosotros hoy.",
      whatsappCta: "Cotice por WhatsApp",
      emailCta: "Escríbanos",
      callLabel: "Llame o WhatsApp",
      credsTitle: "Credenciales comerciales",
    },
    about: {
      eyebrow: "Sobre Raznova Exports",
      title: "Exportador de repuestos para motos, Pune, India",
      paragraphs: [
        "Raznova Exports es un exportador registrado (IEC) de repuestos para motos, con sede en Pune, en el corazón del cinturón de proveedores OE de India. Suministramos repuestos de patrón OEM y compatibles aftermarket con aplicación en plataformas Hero, Bajaj, TVS y Honda para importadores, distribuidores, mayoristas y redes de concesionarios en el exterior.",
        "Nuestra gama cubre componentes de motor, eléctricos y CDI, embrague y transmisión, cables y controles, frenos y suspensión, filtros y piezas de mantenimiento, carrocería y visores, además de baterías y llantas-neumáticos. Mantenemos en stock las referencias de alta rotación que realmente se mueven en el mercado, y consolidamos contenedores con modelos y categorías mixtas para que un distribuidor cubra todo su mercado en un solo embarque.",
        "Cada consignación se verifica, se empaca para transporte marítimo y se fotografía antes de sellar, y luego se despacha desde Nhava Sheva (JNPT) con la documentación completa: conocimiento de embarque, factura comercial y lista de empaque. Enviamos a América Latina y a África Oriental y Meridional con términos TT o LC, con embarques asegurados por ECGC y cotizaciones en un día hábil.",
      ],
      linksTitle: "Mercados de exportación y gamas de compatibilidad",
    },
    partsIndex: {
      eyebrow: "Índice de repuestos",
      title: "Índice de repuestos para motos",
      lead: "La lista de referencia completa de los repuestos que mantenemos en stock y exportamos, agrupados por la plataforma de motocicleta a la que corresponden. Cada artículo es una pieza de patrón OEM o compatible aftermarket disponible para exportación mayorista desde Pune, India.",
      note: "Los nombres de las piezas indican el vehículo al que corresponde cada componente. Envíe cualquier lista de artículos de esta página para recibir una cotización línea por línea con disponibilidad y plazos.",
      partsFor: "repuestos",
      viewCatalogue: "Ver catálogo",
      linkLabel: "Índice completo de repuestos",
    },
    catalogue: {
      eyebrow: "Colombia · Catálogo de repuestos",
      title: "Catálogo de repuestos compatibles con Hero — Colombia",
      lead: "Lista de referencia de repuestos compatibles con Hero que suministramos al mercado colombiano, ordenada por el modelo al que corresponde cada pieza. Los números de parte son referencias de patrón OEM para identificar compatibilidad. No publicamos precios — envíenos su lista para una cotización línea por línea.",
      note: "Las descripciones aparecen en español tal como figuran en nuestras órdenes para Colombia, con su equivalente en inglés al lado.",
      partNo: "Número de parte",
      description: "Descripción",
      fits: "Compatible con",
      category: "Categoría",
      download: "Descargar en CSV",
      partsCount: "referencias",
      otherBrands: "Los catálogos compatibles con Bajaj y de patrón TVS para Colombia están disponibles a solicitud — indíquenos los modelos que maneja y le enviaremos la lista correspondiente.",
      linkLabel: "Catálogo de repuestos Colombia",
    },
    globalReach: {
      eyebrow: "Alcance global",
      title: "De Nhava Sheva a su puerto",
      lead: "Cada consignación sale de India por Nhava Sheva (JNPT) y navega por rutas establecidas hacia nuestros mercados activos. Tiempos de tránsito indicativos; el plazo exacto se confirma en la reserva.",
      originLabel: "Nhava Sheva (JNPT), India",
      lanesTitle: "Rutas de embarque activas",
      transitLabel: "Tránsito indicativo",
      lanes: [
        { port: "Mombasa", country: "Kenia", transit: "2–3 semanas" },
        { port: "Durban", country: "Sudáfrica", transit: "≈3 semanas" },
        { port: "Port Louis", country: "Mauricio", transit: "≈2 semanas" },
        { port: "Cartagena", country: "Colombia", transit: "Larga distancia, vía trasbordo" },
      ],
    },
    positioning: {
      line: "Repuestos de calidad aftermarket · Compatibilidad OEM referenciada · Listo para exportar", // TODO: confirm Spanish copy
    },
    brandsMarquee: {
      title: "Marcas que distribuimos", // TODO: confirm Spanish copy
    },
    showcase: {
      title: "Motos Destacadas y Repuestos de Alta Rotación",
      subtitle: "Una selección de nuestros modelos y repuestos más solicitados.",
      viewCatalog: "Ver catálogo completo",
    },
    fitmentStrip: {
      label: "Compatibilidad referenciada para:", // TODO: confirm Spanish copy
    },
    whyRaznova: {
      title: "Por qué Raznova", // TODO: confirm Spanish copy
      sourcingTitle: "Abastecimiento consolidado", // TODO: confirm Spanish copy
      sourcingBody: "Un solo proveedor para repuestos de marca propia y de marcas distribuidas en múltiples plataformas OEM — menos proveedores, logística más simple.", // TODO: confirm Spanish copy
      workhorseTitle: "Enfoque en modelos de alta rotación", // TODO: confirm Spanish copy
      workhorseBody: "Mantenemos stock de modelos de alto volumen que realmente se mueven en el mercado, no repuestos de baja rotación que quedan en bodega.", // TODO: confirm Spanish copy
      moqTitle: "MOQ flexible", // TODO: confirm Spanish copy
      moqBody: "Pedidos de muestra y mínimos escalables para que nuevos socios prueben compatibilidad y demanda antes de comprometerse con volumen.", // TODO: confirm Spanish copy
      termsTitle: "Términos seguros", // TODO: confirm Spanish copy
      termsBody: "Términos de pago TT / LC y envíos de exportación asegurados por ECGC para un comercio predecible y protegido.", // TODO: confirm Spanish copy
    },
    howToOrder: {
      title: "Cómo ordenar", // TODO: confirm Spanish copy
      step1Title: "Explorar", // TODO: confirm Spanish copy
      step1Body: "Explore nuestros catálogos por marca y modelo para encontrar los repuestos que necesita.", // TODO: confirm Spanish copy
      step2Title: "Enviar una lista de pedido de muestra", // TODO: confirm Spanish copy
      step2Body: "Comparta su lista de repuestos con cantidades — verificaremos disponibilidad y tiempos de entrega.", // TODO: confirm Spanish copy
      step3Title: "Recibir su cotización", // TODO: confirm Spanish copy
      step3Body: "Respondemos con precios, tiempos de entrega y términos de envío para su revisión.", // TODO: confirm Spanish copy
    },
    markets: {
      title: "Mercados atendidos", // TODO: confirm Spanish copy
      latamTitle: "América Latina", // TODO: confirm Spanish copy
      latamBody: "Colombia, Perú, Ecuador, Bolivia, Centroamérica", // TODO: confirm Spanish copy
      africaTitle: "África", // TODO: confirm Spanish copy
      africaBody: "África Oriental y Meridional, África Occidental", // TODO: confirm Spanish copy
    },
    quoteCta: {
      title: "¿Listo para abastecerse con Raznova?", // TODO: confirm Spanish copy
      subtitle: "Envíe su lista de pedido de muestra y responderemos con disponibilidad, precios y tiempos de entrega.", // TODO: confirm Spanish copy
      button: "Solicitar Cotización",
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
        "Raznova Exports es un exportador independiente de repuestos de patrón OEM y compatibles aftermarket. No está afiliado ni autorizado por Hero MotoCorp, Bajaj Auto, TVS Motor ni Honda.",
      regions: "Atendiendo a socios exportadores en América Latina y África.",
      rights: "Todos los derechos reservados.",
    },
  },
  "en-ZA": {
    nav: {
      home: "Home",
      motorcycle: "Motorcycle",
      threeWheeler: "Three Wheeler",
      partBrands: "Part Brands", // inherited from en — no Africa-specific copy needed
      requestQuote: "Request Quote",
      language: "Language",
    },
    hero: {
      title: "Genuine & OEM-Grade Two-Wheeler Spare Parts, Exported to Africa",
      subtitle:
        "Raznova supplies own-brand and trusted carried-brand spare parts for Hero, Bajaj, TVS and more — built for distribution partners across Southern and East Africa.",
      cta: "Request a Quote",
      ctaBrowse: "Browse Catalogs", // inherited from en
      ctaQuote: "Request a Quote",
      ctaWhatsapp: "Get a Quote on WhatsApp",
      ctaEmail: "Email us",
      statFitment: "Hero · Bajaj · TVS fitment", // inherited from en
      statShipping: "Shipping to Southern & East Africa",
      statExport: "Export-ready: IEC & GST registered", // inherited from en
    },
    trust: {
      brandsLabel: "brand patterns",
      brandsSub: "Hero · Bajaj · TVS · Honda fitment",
      iecLabel: "IEC",
      gstinLabel: "GSTIN",
      portLabel: "Ships from",
      portValue: "Nhava Sheva (JNPT)",
    },
    inventory: {
      eyebrow: "Inventory",
      title: "Full Range. Full Inventory.",
      subtitle:
        "Complete two-wheeler parts coverage — engine, electrical, transmission, body — stocked and dispatch-ready.",
      captionFloor: "Export cartons staged on the dispatch floor",
      captionOffice: "OEM-pattern stock, binned and labelled",
      captionPigeonholes: "Small-parts racking — thousands of live SKUs",
      captionBulk: "Bulk carton storage, ready to consolidate",
      captionDispatch: "Pick faces replenished daily",
    },
    categories: {
      eyebrow: "Coverage",
      title: "Product categories",
      subtitle: "Eight families of coverage across every fast-moving platform.",
      items: [
        { title: "Engine Components", body: "Cylinder blocks, valves, timing kits, oil seals." },
        { title: "Electricals & CDI", body: "CDI units, ignition coils, switches, indicators, bulbs." },
        { title: "Clutch & Transmission", body: "Clutch assemblies, plates, pressure plates, chain-sprocket kits." },
        { title: "Cables & Controls", body: "Accelerator, clutch, brake and speedometer cables, levers, locksets." },
        { title: "Brakes & Suspension", body: "Brake shoes, levers, front and rear shock absorbers." },
        { title: "Filters & Service Parts", body: "Air filters, oil filters, spark plugs, bearings." },
        { title: "Body & Visors", body: "Mirrors, visors, indicators and body fitment parts." },
        { title: "Batteries & Tyres-Tubes", body: "Batteries plus JK Tyre tyres and tubes, export-packed." },
      ],
    },
    howWeWork: {
      eyebrow: "Export operations",
      title: "How we work",
      steps: [
        { title: "Enquiry", body: "Send your parts list on WhatsApp or email — model, part, quantity." },
        { title: "Quote in 24h", body: "Line-by-line pricing with availability and lead times, within one working day." },
        { title: "Packing & QC", body: "Every carton checked, sea-worthy export packing, photographed before sealing." },
        { title: "Dispatch & BL", body: "Container dispatch from Nhava Sheva (JNPT) to African ports with the full document set — BL, invoice, packing list." },
      ],
    },
    lightSection: {
      eyebrow: "Sourcing",
      title: "Sourced from Pune's OE-supplier belt.",
      body: "Raznova operates from Pune, home to the Tier-1 ecosystem that supplies India's two-wheeler OEMs. Two decades of distributor-grade parts knowledge decide what goes into every container.",
      quote: "We ship the parts that keep a fleet earning — nothing that sits on a shelf.",
    },
    contactFinale: {
      eyebrow: "Contact",
      title: "Sourcing two-wheeler spares? Talk to us today.",
      whatsappCta: "Get a Quote on WhatsApp",
      emailCta: "Email us",
      callLabel: "Call or WhatsApp",
      credsTitle: "Business credentials",
    },
    about: {
      eyebrow: "About Raznova Exports",
      title: "Two-wheeler spare parts exporter to Africa",
      paragraphs: [
        "Raznova Exports is an IEC-registered exporter of two-wheeler spare parts, operating from Pune in the heart of India's OE-supplier belt. We supply OEM-pattern and aftermarket compatible parts with fitment across Hero, Bajaj, TVS and Honda motorcycle platforms to importers, distributors and dealer networks across Southern and East Africa.",
        "Our range covers engine components, electricals and CDI, clutch and transmission, cables and controls, brakes and suspension, filters and service parts, body and visors, and batteries and tyres-tubes. We stock the fast-moving references that turn over in African markets — including the Boxer, HLX and commuter workhorse platforms — and consolidate mixed-model container loads so a distributor can cover a whole market from one shipment.",
        "Every consignment is QC-checked, sea-worthy export-packed and photographed before sealing, then dispatched from Nhava Sheva (JNPT) to Durban, Mombasa and Dar es Salaam with a complete document set — bill of lading, commercial invoice and packing list. We work on TT or LC terms, with ECGC-insured export shipments and quotations returned within one working day.",
      ],
      linksTitle: "Export markets and fitment ranges",
    },
    partsIndex: {
      eyebrow: "Parts index",
      title: "Two-wheeler spare parts index",
      lead: "The complete reference list of spare parts we stock and export to Africa, grouped by the motorcycle platform they fit. Every item below is an OEM-pattern or aftermarket compatible part held for wholesale export from Pune, India.",
      note: "Part names indicate the vehicle a component fits. Send any list of items from this page for a line-by-line quotation with availability and shipping lead times.",
      partsFor: "spare parts",
      viewCatalogue: "View catalogue",
      linkLabel: "Full parts index",
    },
    catalogue: {
      eyebrow: "Colombia · Parts catalogue",
      title: "Hero-fitment parts catalogue — Colombia",
      lead: "Working reference list of Hero-fitment spare parts we supply into the Colombian market, listed by the model each part fits. Part numbers are OEM-pattern references for fitment identification. No pricing is published — send a list for a line-by-line quotation.",
      note: "Descriptions are shown in Spanish exactly as they appear on our Colombian order sheets, with an English equivalent alongside.",
      partNo: "Part number",
      description: "Description",
      fits: "Fits",
      category: "Category",
      download: "Download as CSV",
      partsCount: "part references",
      otherBrands: "Bajaj-compatible and TVS-pattern catalogues for Colombia are available on request — send us the models you stock and we will return a matching list.",
      linkLabel: "Colombia parts catalogue",
    },
    globalReach: {
      eyebrow: "Global reach",
      title: "From Nhava Sheva to your port",
      lead: "Every consignment leaves India through Nhava Sheva (JNPT) and sails on established lanes to Southern and East African ports. Indicative transit times below; exact timing is confirmed at booking.",
      originLabel: "Nhava Sheva (JNPT), India",
      lanesTitle: "Active shipping lanes",
      transitLabel: "Indicative transit",
      lanes: [
        { port: "Durban", country: "South Africa", transit: "≈3 weeks" },
        { port: "Mombasa", country: "Kenya", transit: "2–3 weeks" },
        { port: "Port Louis", country: "Mauritius", transit: "≈2 weeks" },
        { port: "Cartagena", country: "Colombia", transit: "Long-haul, via trans-shipment" },
      ],
    },
    positioning: {
      line: "Genuine-grade aftermarket parts · OEM fitment referenced · Export-ready", // inherited from en
    },
    brandsMarquee: {
      title: "Brands we carry", // inherited from en
    },
    showcase: {
      title: "Featured Bikes & Fast-Moving Parts",
      subtitle: "A curated look at our most-requested models and parts.",
      viewCatalog: "View full catalogue",
    },
    fitmentStrip: {
      label: "Compatible fitment for:", // inherited from en
    },
    whyRaznova: {
      title: "Why Raznova", // inherited from en
      sourcingTitle: "Consolidated sourcing", // inherited from en
      sourcingBody: "One supplier for own-brand and carried-brand parts across multiple OEM platforms — fewer vendors, simpler logistics.", // inherited from en
      workhorseTitle: "Workhorse-model focus", // inherited from en
      workhorseBody: "We stock fast-moving, high-volume models that move in real markets, not long-tail parts that sit in a warehouse.", // inherited from en
      moqTitle: "Flexible MOQ", // inherited from en
      moqBody: "Sample orders and scalable minimums so new partners can test fitment and demand before committing to volume.", // inherited from en
      termsTitle: "Secure terms", // inherited from en
      termsBody: "TT / LC payment terms and ECGC-insured export shipments for predictable, protected trade.", // inherited from en
    },
    howToOrder: {
      title: "How to order", // inherited from en
      step1Title: "Browse", // inherited from en
      step1Body: "Explore our catalogues by brand and model to find the parts you need.", // inherited from en
      step2Title: "Send a sample order list", // inherited from en
      step2Body: "Share your parts list with quantities — we'll check availability and lead times.", // inherited from en
      step3Title: "Receive your quote", // inherited from en
      step3Body: "We respond with pricing, lead times, and shipping terms for your review.", // inherited from en
    },
    markets: {
      title: "Markets served",
      latamTitle: "Latin America", // inherited from en — kept for context even though this locale targets Africa
      latamBody: "Colombia, Peru, Ecuador, Bolivia, Central America", // inherited from en
      africaTitle: "Africa",
      africaBody: "Southern & East Africa, West Africa",
    },
    quoteCta: {
      title: "Ready to source from Raznova?", // inherited from en
      subtitle: "Send your sample order list and we'll respond with availability, pricing and shipping lead times to Africa.",
      button: "Request a Quote",
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
        "Raznova Exports is an independent exporter of OEM-pattern and aftermarket compatible parts. Not affiliated with or authorized by Hero MotoCorp, Bajaj Auto, TVS Motor, or Honda.",
      regions: "Shipping to distribution partners across Southern & East Africa.",
      rights: "All rights reserved.",
    },
  },
};

export function getTranslations(locale: Locale): Translations {
  return TRANSLATIONS[locale];
}
