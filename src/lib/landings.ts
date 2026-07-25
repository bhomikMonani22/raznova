// Programmatic B2B landing pages — capped at the ten below, each with unique,
// substantive content (Google's scaled-content policy penalises thin mass
// permutations). Copy is trademark-safe throughout: vehicle-brand names only
// ever appear as compatible-fitment wording ("Hero-fitment", "compatible with
// Bajaj", "TVS-pattern", "OEM-pattern"), never as "genuine <brand>".

export type LandingFaq = { q: string; a: string };
export type LandingSection = { heading: string; body: string[] };
export type LandingLink = { label: string; href: string };

export type Landing = {
  slug: string;
  metaTitle: string; // <= 60 chars
  metaDescription: string; // <= 155 chars
  eyebrow: string;
  h1: string;
  lead: string;
  sections: LandingSection[];
  faqs: LandingFaq[];
  related: LandingLink[];
};

const QUOTE = "/en/quote";

// Shared closing paragraph used by several pages, kept DRY but each page
// still carries a majority of unique copy.
const COMMERCIAL_TERMS =
  "Minimum order quantities are set per line item and confirmed at quotation. We handle mixed-model, mixed-category container loads, and we accept smaller trial orders from new partners who want to validate fitment and turnover before scaling to full-container volumes. Payment is on TT or LC terms, and export shipments are ECGC-insured.";

export const LANDINGS: Landing[] = [
  {
    slug: "hero-spare-parts-exporter",
    metaTitle: "Hero-Fitment Spare Parts Exporter | Raznova",
    metaDescription:
      "IEC-registered exporter of Hero-fitment two-wheeler spare parts from Pune, India. Splendor, HF Deluxe, Passion & Hunk pattern coverage, shipped worldwide.",
    eyebrow: "Export Operations",
    h1: "Hero-Fitment Two-Wheeler Spare Parts Exporter",
    lead: "Raznova Exports supplies OEM-pattern and aftermarket spare parts with fitment for Hero commuter and workhorse motorcycles, shipped from Pune, India to distributors and wholesalers across Latin America and Africa.",
    sections: [
      {
        heading: "Fitment and model coverage",
        body: [
          "Our Hero-fitment range concentrates on the high-turnover commuter platforms that actually move volume in importing markets — the Splendor and Splendor NXG, HF Deluxe, Passion, Glamour, and the Hunk and Achiever sports-commuter lines. These are the models whose parts a distributor sells every week, not slow-moving long-tail references that tie up working capital on the shelf.",
          "Category coverage spans engine components (cylinder blocks, valves, timing kits, oil seals), electricals and CDI, clutch and transmission assemblies, cables and controls, brakes and suspension, filters and service parts, and body and visor items. Every part is described by its fitment reference so your counter staff and mechanics can cross-check against the vehicle in front of them.",
        ],
      },
      {
        heading: "Shipping from Nhava Sheva (JNPT)",
        body: [
          "All consignments dispatch through Nhava Sheva (JNPT), India's largest container port, on the main east-coast and trans-shipment lanes serving East and Southern Africa and the west coast of Latin America. Cartons are checked, sea-worthy export-packed, and photographed before sealing, and every shipment carries a complete document set — bill of lading, commercial invoice and packing list.",
        ],
      },
      {
        heading: "Ordering, MOQ and terms",
        body: [COMMERCIAL_TERMS],
      },
    ],
    faqs: [
      {
        q: "Are these genuine Hero MotoCorp parts?",
        a: "No. Raznova is an independent exporter of OEM-pattern and aftermarket compatible parts. We are not affiliated with or authorised by Hero MotoCorp. Brand and model names are used only to identify the vehicles a part fits.",
      },
      {
        q: "Which Hero models do you cover?",
        a: "We focus on fast-moving commuter and workhorse platforms — Splendor, HF Deluxe, Passion, Glamour, Hunk and Achiever pattern parts — because these carry the demand and turnover that make a container profitable for an importer.",
      },
      {
        q: "What is the minimum order?",
        a: "MOQ is set per line item and confirmed on your quotation. We consolidate mixed-model, mixed-category loads and accept smaller trial orders from new partners before committing to full-container volumes.",
      },
      {
        q: "How do I get pricing?",
        a: "Send your parts list with quantities on WhatsApp or by email. We respond with line-by-line pricing, availability and lead times, typically within one working day.",
      },
    ],
    related: [
      { label: "Hero motorcycle catalogues", href: "/en/catalog/motorcycle/Hero" },
      { label: "Motorcycle spare parts exporter — India", href: "/motorcycle-spare-parts-exporter-india" },
      { label: "Two-wheeler spare parts wholesale", href: "/two-wheeler-spare-parts-wholesale" },
      { label: "Request a wholesale quote", href: QUOTE },
    ],
  },
  {
    slug: "bajaj-spare-parts-exporter",
    metaTitle: "Bajaj-Compatible Spare Parts Supplier | Raznova",
    metaDescription:
      "Wholesale supplier of Bajaj-compatible two-wheeler spare parts from India. Boxer, Pulsar, Discover & Platina pattern coverage, shipped from Nhava Sheva.",
    eyebrow: "Export Operations",
    h1: "Bajaj-Compatible Spare Parts Supplier & Exporter",
    lead: "Raznova Exports is an IEC-registered wholesale supplier of spare parts compatible with Bajaj motorcycles, serving importers and distributors in the African and Latin American markets where Bajaj platforms dominate the road.",
    sections: [
      {
        heading: "Fitment and model coverage",
        body: [
          "The Bajaj-compatible range is built around the platforms that carry real market share overseas: the Boxer (including the CT100 and BM150 workhorses that anchor the boda-boda and moto-taxi economies of East Africa), the Pulsar 150 and 180 sports commuters, and the Discover and Platina commuter families. These are the reference points a Bajaj-market distributor orders against month after month.",
          "We stock across every service category — engine internals, CDI and electricals, clutch and transmission, accelerator, clutch, brake and speedometer cables, brake shoes and suspension, filters, spark plugs and bearings, plus mirrors, visors and body fitment parts. Fast-moving service items are the backbone of the offer because that is what sells over the counter.",
        ],
      },
      {
        heading: "Shipping from Nhava Sheva (JNPT)",
        body: [
          "Consignments ship from Nhava Sheva (JNPT) on established lanes to Mombasa, Dar es Salaam, Durban and the Latin American Pacific ports. Every carton is QC-checked and export-packed for sea freight, photographed before sealing, and dispatched with the full document set so your customs clearance is clean.",
        ],
      },
      {
        heading: "Ordering, MOQ and terms",
        body: [COMMERCIAL_TERMS],
      },
    ],
    faqs: [
      {
        q: "Are these genuine Bajaj Auto parts?",
        a: "No. Raznova is an independent exporter of OEM-pattern and aftermarket compatible parts and is not affiliated with or authorised by Bajaj Auto. Model names identify fitment only.",
      },
      {
        q: "Do you supply Boxer CT100 and BM150 parts?",
        a: "Yes. The Boxer workhorse platforms are a core part of our range precisely because of their volume in East African markets. We cover engine, electrical, transmission, brake and body service parts for these models.",
      },
      {
        q: "Can I mix models in one container?",
        a: "Yes. We consolidate mixed-model and mixed-category loads so you can balance a container across Boxer, Pulsar and Discover demand in a single shipment.",
      },
      {
        q: "What payment terms do you offer?",
        a: "TT and LC terms, with ECGC-insured export shipments. Specifics are confirmed at the quotation stage.",
      },
    ],
    related: [
      { label: "Bajaj motorcycle catalogues", href: "/en/catalog/motorcycle/Bajaj" },
      { label: "Motorcycle spare parts — Kenya", href: "/motorcycle-spare-parts-kenya" },
      { label: "Motorcycle spare parts — Colombia", href: "/motorcycle-spare-parts-colombia" },
      { label: "Request a wholesale quote", href: QUOTE },
    ],
  },
  {
    slug: "tvs-spare-parts-exporter",
    metaTitle: "TVS-Pattern Spare Parts Exporter India | Raznova",
    metaDescription:
      "Exporter of TVS-pattern two-wheeler spare parts from Pune, India. Star HLX, Apache RTR & Sport coverage for wholesale importers, shipped from Nhava Sheva.",
    eyebrow: "Export Operations",
    h1: "TVS-Pattern Motorcycle Spare Parts Exporter",
    lead: "Raznova Exports supplies TVS-pattern two-wheeler spare parts to wholesale importers and distributors overseas, drawing on Pune's Tier-1 supplier ecosystem to keep fast-moving references in stock and dispatch-ready.",
    sections: [
      {
        heading: "Fitment and model coverage",
        body: [
          "Our TVS-pattern coverage centres on the models that sell in export markets — the Star HLX 125 and HLX 150 commuters that are workhorses across Africa, and the Apache RTR 160 sports line. These platforms drive predictable, repeat parts demand, which is what makes them worth stocking in depth.",
          "Across those models we carry engine components, CDI units and ignition parts, clutch assemblies and plates, chain and sprocket kits, cables, brake shoes and levers, shock absorbers, filters, spark plugs and bearings, plus mirrors and body items. Every reference is listed by its fitment so it can be verified against the machine.",
        ],
      },
      {
        heading: "Shipping from Nhava Sheva (JNPT)",
        body: [
          "Shipments leave Nhava Sheva (JNPT) on the trunk lanes to East and Southern Africa. Cartons are inspected, export-packed for the sea voyage and photographed before sealing; the bill of lading, invoice and packing list travel with every consignment.",
        ],
      },
      {
        heading: "Ordering, MOQ and terms",
        body: [COMMERCIAL_TERMS],
      },
    ],
    faqs: [
      {
        q: "Are these genuine TVS Motor parts?",
        a: "No. Raznova is an independent exporter of OEM-pattern and aftermarket compatible parts, not affiliated with or authorised by TVS Motor Company. Model names are used to indicate fitment only.",
      },
      {
        q: "Which TVS models do you cover?",
        a: "Star HLX 125 and HLX 150 commuter workhorses and the Apache RTR 160 sports line — the platforms with the volume that supports a full catalogue of service parts.",
      },
      {
        q: "Do you supply the Apache RTR 160 range?",
        a: "Yes, including brake, clutch, cable, electrical and service parts. Send your model and part list for a line-by-line quotation.",
      },
      {
        q: "How fast do you quote?",
        a: "Typically within one working day of receiving your parts list with quantities.",
      },
    ],
    related: [
      { label: "TVS motorcycle catalogues", href: "/en/catalog/motorcycle/TVS" },
      { label: "Motorcycle spare parts exporter — India", href: "/motorcycle-spare-parts-exporter-india" },
      { label: "Motorcycle spare parts — South Africa", href: "/motorcycle-spare-parts-south-africa" },
      { label: "Request a wholesale quote", href: QUOTE },
    ],
  },
  {
    slug: "honda-fitment-spare-parts-exporter",
    metaTitle: "Honda-Fitment Spare Parts Exporter | Raznova",
    metaDescription:
      "Exporter of Honda-fitment two-wheeler spare parts from India. CG, CB & commuter pattern coverage for wholesale importers, shipped from Nhava Sheva (JNPT).",
    eyebrow: "Export Operations",
    h1: "Honda-Fitment Two-Wheeler Spare Parts Exporter",
    lead: "Raznova Exports supplies OEM-pattern and aftermarket spare parts with fitment for Honda commuter motorcycles, sourced from India's two-wheeler component belt and shipped to distributors in Africa and Latin America.",
    sections: [
      {
        heading: "Fitment and model coverage",
        body: [
          "Honda commuter platforms remain a global reference for durability, and their aftermarket runs deep. Our Honda-fitment range targets the widely-sold commuter families — CG-pattern and CB-pattern service parts among them — that keep working fleets and owner-riders on the road in importing markets.",
          "Coverage runs across engine components, electricals and ignition, clutch and transmission, cables and controls, brakes and suspension, and filters and service parts. As with every range we carry, parts are catalogued by fitment reference rather than presented as brand-original, so identification is unambiguous for your workshop customers.",
        ],
      },
      {
        heading: "Shipping from Nhava Sheva (JNPT)",
        body: [
          "Dispatch is through Nhava Sheva (JNPT) with QC-checked, sea-worthy export packing and a complete document set on every shipment. We consolidate Honda-fitment references alongside Hero, Bajaj and TVS demand in a single container where that suits your ordering pattern.",
        ],
      },
      {
        heading: "Ordering, MOQ and terms",
        body: [COMMERCIAL_TERMS],
      },
    ],
    faqs: [
      {
        q: "Are these genuine Honda parts?",
        a: "No. Raznova is an independent exporter of OEM-pattern and aftermarket compatible parts and is not affiliated with or authorised by Honda. Model names indicate fitment only.",
      },
      {
        q: "Which Honda models do you support?",
        a: "Widely-sold commuter platforms, including CG-pattern and CB-pattern service parts. Send your specific models and we will confirm coverage on the quotation.",
      },
      {
        q: "Can Honda-fitment parts ship with other brands?",
        a: "Yes. We build mixed-brand, mixed-category containers so you can combine Honda-fitment demand with Hero, Bajaj and TVS references in one shipment.",
      },
      {
        q: "What are your payment and insurance terms?",
        a: "TT and LC terms with ECGC-insured export shipments, confirmed at quotation.",
      },
    ],
    related: [
      { label: "Two-wheeler spare parts wholesale", href: "/two-wheeler-spare-parts-wholesale" },
      { label: "Motorcycle spare parts exporter — India", href: "/motorcycle-spare-parts-exporter-india" },
      { label: "Motorcycle spare parts — Mauritius", href: "/motorcycle-spare-parts-mauritius" },
      { label: "Request a wholesale quote", href: QUOTE },
    ],
  },
  {
    slug: "motorcycle-spare-parts-exporter-india",
    metaTitle: "Motorcycle Spare Parts Exporter India | Raznova",
    metaDescription:
      "IEC-registered motorcycle spare parts exporter in Pune, India. OEM-pattern and aftermarket ranges for wholesale importers, shipped worldwide from Nhava Sheva.",
    eyebrow: "Export Operations",
    h1: "Motorcycle Spare Parts Exporter in India",
    lead: "Raznova Exports is an IEC-registered motorcycle and two-wheeler spare parts exporter based in Pune, at the centre of India's OE-supplier belt, shipping OEM-pattern and aftermarket ranges to importers and distributors across Latin America and Africa.",
    sections: [
      {
        heading: "Why source from Pune, India",
        body: [
          "India is the world's largest two-wheeler manufacturing base, and Pune sits inside the Tier-1 supplier ecosystem that feeds the country's OEM lines. Sourcing here means access to the same component clusters that supply original production, at export-scale pricing, with the breadth of range that only a mature domestic industry produces.",
          "Raznova consolidates own-brand and carried-brand parts across multiple OEM platforms — Hero, Bajaj, TVS and Honda fitment — so an importer deals with one supplier and one shipment instead of coordinating several vendors. Fewer vendors, simpler logistics, cleaner documentation.",
        ],
      },
      {
        heading: "Range and fitment breadth",
        body: [
          "Our catalogue covers engine components, electricals and CDI, clutch and transmission, cables and controls, brakes and suspension, filters and service parts, body and visors, and batteries and tyres-tubes. We prioritise fast-moving, high-volume references that turn over in real markets rather than slow long-tail parts, so your working capital stays productive.",
        ],
      },
      {
        heading: "Shipping, MOQ and terms",
        body: [
          "All shipments dispatch from Nhava Sheva (JNPT) with QC-checked export packing and a full document set. " +
            COMMERCIAL_TERMS,
        ],
      },
    ],
    faqs: [
      {
        q: "What does IEC-registered mean for me as a buyer?",
        a: "An Importer-Exporter Code (IEC HFRPM4730J) is the licence that authorises a company to export from India. It confirms you are dealing with a registered exporter able to raise compliant export documentation.",
      },
      {
        q: "Which brands' fitment do you cover?",
        a: "Hero, Bajaj, TVS and Honda fitment, plus carried aftermarket component brands. We supply OEM-pattern and aftermarket compatible parts, not brand-original goods.",
      },
      {
        q: "Do you ship worldwide?",
        a: "We ship from Nhava Sheva (JNPT) and are most active on the Latin American and African lanes. Tell us your destination port and we will confirm routing and documentation.",
      },
      {
        q: "How do I start?",
        a: "Send your parts list with quantities via WhatsApp or email for a line-by-line quotation, usually within one working day.",
      },
    ],
    related: [
      { label: "Two-wheeler spare parts wholesale", href: "/two-wheeler-spare-parts-wholesale" },
      { label: "Hero-fitment spare parts exporter", href: "/hero-spare-parts-exporter" },
      { label: "Bajaj-compatible spare parts supplier", href: "/bajaj-spare-parts-exporter" },
      { label: "TVS-pattern spare parts exporter", href: "/tvs-spare-parts-exporter" },
    ],
  },
  {
    slug: "two-wheeler-spare-parts-wholesale",
    metaTitle: "Two-Wheeler Spare Parts Wholesale Export | Raznova",
    metaDescription:
      "Wholesale two-wheeler spare parts for export from India. Mixed-model container loads, OEM-pattern ranges and trial orders for distributors and dealers.",
    eyebrow: "Wholesale Supply",
    h1: "Two-Wheeler Spare Parts — Wholesale Export",
    lead: "Raznova Exports supplies two-wheeler spare parts at wholesale, export scale to distributors, wholesalers and dealer networks — built around mixed-model container loads and the fast-moving references that turn over in real markets.",
    sections: [
      {
        heading: "Built for distributors, not retail",
        body: [
          "Everything about the offer is structured for the trade buyer. We consolidate mixed-model, mixed-category loads so a single container can be balanced across the exact demand profile of your market. We prioritise high-turnover service parts — the items a counter sells every day — over slow long-tail references that sit in a warehouse tying up capital.",
          "New partners can place smaller trial orders to validate fitment, quality and turnover before scaling to full-container volumes. That lowers the risk of a first order and lets a distributor test the range against their own demand before committing.",
        ],
      },
      {
        heading: "Range and quality control",
        body: [
          "Coverage spans engine, electrical and CDI, clutch and transmission, cables and controls, brakes and suspension, filters and service parts, body and visors, and batteries and tyres-tubes, with fitment across Hero, Bajaj, TVS and Honda platforms. Every carton is QC-checked and sea-worthy export-packed, and photographed before sealing so there is a visual record of what left the warehouse.",
        ],
      },
      {
        heading: "Shipping, MOQ and terms",
        body: [
          "Dispatch is from Nhava Sheva (JNPT) with a complete document set — bill of lading, invoice and packing list. " +
            COMMERCIAL_TERMS,
        ],
      },
    ],
    faqs: [
      {
        q: "Do you sell to retail customers?",
        a: "No. Raznova supplies importers, distributors, wholesalers and dealer networks at export volumes. Our pricing, MOQ and packing are built for the trade.",
      },
      {
        q: "Can I order a trial shipment first?",
        a: "Yes. We accept smaller trial orders from new partners so you can validate fitment and turnover before moving to full-container volumes.",
      },
      {
        q: "Can one container hold several brands and models?",
        a: "Yes — mixed-model, mixed-brand and mixed-category consolidation is standard. We help you balance the load against your market's demand.",
      },
      {
        q: "What are the payment terms?",
        a: "TT and LC terms with ECGC-insured export shipments, confirmed on your quotation.",
      },
    ],
    related: [
      { label: "Motorcycle spare parts exporter — India", href: "/motorcycle-spare-parts-exporter-india" },
      { label: "Hero-fitment spare parts exporter", href: "/hero-spare-parts-exporter" },
      { label: "Bajaj-compatible spare parts supplier", href: "/bajaj-spare-parts-exporter" },
      { label: "Request a wholesale quote", href: QUOTE },
    ],
  },
  {
    slug: "motorcycle-spare-parts-kenya",
    metaTitle: "Motorcycle Spare Parts Export to Kenya | Raznova",
    metaDescription:
      "Two-wheeler spare parts exporter from India to Kenya. Boxer, HLX & commuter pattern parts for the boda-boda market, shipped Nhava Sheva to Mombasa.",
    eyebrow: "Active Lane · Kenya",
    h1: "Motorcycle Spare Parts Export to Kenya",
    lead: "Raznova Exports supplies two-wheeler spare parts from India to importers and distributors in Kenya, with a range tuned to the boda-boda economy where motorcycle transport is the backbone of daily movement and last-mile logistics.",
    sections: [
      {
        heading: "Parts for the Kenyan market",
        body: [
          "Kenya's boda-boda fleet runs hard, and it runs on a specific set of workhorse platforms. Our range for this market leans into Bajaj Boxer (CT100 and BM150) and TVS Star HLX fitment — the commuter and workhorse models that dominate Kenyan roads — alongside broad Hero commuter coverage. These are high-wear, high-turnover machines, so brake shoes, clutch and transmission parts, cables, chains and sprockets, and electrical service items move fastest.",
          "Because these fleets are worked daily, a distributor's business is built on availability of fast-moving service parts. That is exactly where we stock in depth, rather than spreading thin across slow references.",
        ],
      },
      {
        heading: "Shipping to Mombasa",
        body: [
          "Consignments dispatch from Nhava Sheva (JNPT) to the Port of Mombasa on a direct East Africa lane — one of the shorter sea routes from India, which keeps lead times and freight competitive for Kenyan importers. Cartons are QC-checked, export-packed and photographed before sealing, and every shipment carries the bill of lading, commercial invoice and packing list for clean clearance at Mombasa. Indicative transit is typically in the region of two to three weeks; exact timing is confirmed at booking.",
        ],
      },
      {
        heading: "Ordering, MOQ and terms",
        body: [COMMERCIAL_TERMS],
      },
    ],
    faqs: [
      {
        q: "Which parts sell best in Kenya?",
        a: "Fast-wear service items for boda-boda workhorses — Boxer and HLX-pattern brake shoes, clutch and transmission parts, cables, chain-sprocket kits and electrical items. We stock these in depth.",
      },
      {
        q: "Which port do you ship to?",
        a: "Mombasa, via a direct lane from Nhava Sheva (JNPT). Indicative transit is around two to three weeks, confirmed at booking.",
      },
      {
        q: "Do you supply Boxer BM150 and CT100 parts?",
        a: "Yes — these Boxer workhorse platforms are central to our Kenya range because of their volume on Kenyan roads.",
      },
      {
        q: "What is the minimum first order?",
        a: "We accept smaller trial orders for new Kenyan partners, then scale to mixed-model container loads. MOQ per line is confirmed on your quotation.",
      },
    ],
    related: [
      { label: "Bajaj-compatible spare parts supplier", href: "/bajaj-spare-parts-exporter" },
      { label: "TVS-pattern spare parts exporter", href: "/tvs-spare-parts-exporter" },
      { label: "Motorcycle spare parts — South Africa", href: "/motorcycle-spare-parts-south-africa" },
      { label: "Request a wholesale quote", href: QUOTE },
    ],
  },
  {
    slug: "motorcycle-spare-parts-colombia",
    metaTitle: "Repuestos de Motos Exportados a Colombia | Raznova",
    metaDescription:
      "Exportador de repuestos para motos de India a Colombia. Piezas compatibles con Bajaj (Boxer, Pulsar) y Hero, enviadas desde Nhava Sheva.",
    eyebrow: "Active Lane · Colombia",
    h1: "Motorcycle Spare Parts Export to Colombia",
    lead: "Raznova Exports supplies two-wheeler spare parts from India to importers and distributors in Colombia, a market where Indian-origin motorcycle platforms — Bajaj above all — hold deep, established demand.",
    sections: [
      {
        heading: "Parts for the Colombian market",
        body: [
          "Colombia is one of Latin America's largest motorcycle markets, and Bajaj-derived platforms are woven through it, including locally-assembled lines built on Bajaj engineering. Our range for Colombia therefore leads with Bajaj-compatible fitment — Boxer, Pulsar 150/180 and Discover/Platina pattern parts — supported by Hero commuter coverage.",
          "Demand here spans both the utility-commuter segment and a strong sports-commuter following around the Pulsar line, so we carry engine, clutch and transmission, brake, cable, electrical and body service parts across those platforms. Spanish-language product context is available on our Spanish site for your local team and customers.",
        ],
      },
      {
        heading: "Shipping to Colombian ports",
        body: [
          "Consignments dispatch from Nhava Sheva (JNPT) to the Colombian ports — Buenaventura on the Pacific and Cartagena on the Caribbean — typically via trans-shipment given the distance. Cartons are QC-checked, sea-worthy export-packed and photographed before sealing, with the full document set travelling on every shipment. As a long-haul lane, indicative transit runs longer than the African routes and is confirmed precisely at booking.",
        ],
      },
      {
        heading: "Ordering, MOQ and terms",
        body: [COMMERCIAL_TERMS],
      },
    ],
    faqs: [
      {
        q: "¿Tienen información en español?",
        a: "Yes — our Spanish site carries product and company context in Spanish for your team and customers. This export lane page is in English; use the language switcher for the Spanish version of the main site.",
      },
      {
        q: "Which platforms do you cover for Colombia?",
        a: "Bajaj-compatible fitment leads — Boxer, Pulsar 150/180 and Discover/Platina pattern parts — with Hero commuter coverage alongside.",
      },
      {
        q: "Which ports do you ship to?",
        a: "Buenaventura and Cartagena, generally via trans-shipment. Transit is longer than the African lanes and is confirmed at booking.",
      },
      {
        q: "Can new importers start small?",
        a: "Yes. We accept trial orders to validate fitment and turnover before scaling to full-container, mixed-model loads.",
      },
    ],
    related: [
      { label: "Bajaj-compatible spare parts supplier", href: "/bajaj-spare-parts-exporter" },
      { label: "Sitio en español", href: "/es" },
      { label: "Two-wheeler spare parts wholesale", href: "/two-wheeler-spare-parts-wholesale" },
      { label: "Request a wholesale quote", href: QUOTE },
    ],
  },
  {
    slug: "motorcycle-spare-parts-mauritius",
    metaTitle: "Motorcycle Spare Parts Export to Mauritius | Raznova",
    metaDescription:
      "Two-wheeler spare parts exporter from India to Mauritius. OEM-pattern Hero, Bajaj & TVS coverage for importers, shipped Nhava Sheva to Port Louis.",
    eyebrow: "Active Lane · Mauritius",
    h1: "Motorcycle Spare Parts Export to Mauritius",
    lead: "Raznova Exports supplies two-wheeler spare parts from India to importers and retailers in Mauritius, where Indian-origin commuter motorcycles are a familiar part of the vehicle mix and a reliable parts pipeline matters.",
    sections: [
      {
        heading: "Parts for the Mauritian market",
        body: [
          "Mauritius is a compact market, which makes range balance and consolidation especially important — an importer needs the right spread of fast-moving parts in one shipment rather than deep stock of any single reference. Our coverage across Hero, Bajaj and TVS commuter fitment lets a Mauritian buyer cover the common platforms on the island in a single, well-composed load.",
          "We concentrate on service parts with steady turnover — brakes, clutch and transmission, cables, filters, electrical and body items — so stock keeps moving on a smaller island demand base.",
        ],
      },
      {
        heading: "Shipping to Port Louis",
        body: [
          "Consignments dispatch from Nhava Sheva (JNPT) to Port Louis on a comparatively short Indian Ocean lane, which keeps freight and lead times manageable for a smaller market. Cartons are QC-checked, export-packed and photographed before sealing, and the bill of lading, invoice and packing list accompany every shipment. Indicative transit is typically in the region of two weeks, confirmed at booking.",
        ],
      },
      {
        heading: "Ordering, MOQ and terms",
        body: [COMMERCIAL_TERMS],
      },
    ],
    faqs: [
      {
        q: "Can I get a balanced range in one shipment?",
        a: "Yes — mixed-brand, mixed-model consolidation is our standard approach, which suits the Mauritian market's need for range breadth over single-reference depth.",
      },
      {
        q: "Which port do you ship to?",
        a: "Port Louis, on a short Indian Ocean lane from Nhava Sheva (JNPT). Indicative transit is around two weeks, confirmed at booking.",
      },
      {
        q: "Which brands' fitment do you cover?",
        a: "Hero, Bajaj and TVS commuter fitment — the common Indian-origin platforms on the island — plus Honda-fitment on request.",
      },
      {
        q: "Do you accept trial orders?",
        a: "Yes, smaller trial orders are welcome for new partners before scaling volumes.",
      },
    ],
    related: [
      { label: "Hero-fitment spare parts exporter", href: "/hero-spare-parts-exporter" },
      { label: "TVS-pattern spare parts exporter", href: "/tvs-spare-parts-exporter" },
      { label: "Two-wheeler spare parts wholesale", href: "/two-wheeler-spare-parts-wholesale" },
      { label: "Request a wholesale quote", href: QUOTE },
    ],
  },
  {
    slug: "motorcycle-spare-parts-south-africa",
    metaTitle: "Motorcycle Spare Parts Export to South Africa | Raznova",
    metaDescription:
      "Two-wheeler spare parts exporter from India to South Africa. OEM-pattern Bajaj, TVS & Hero coverage for distributors, shipped Nhava Sheva to Durban.",
    eyebrow: "Active Lane · South Africa",
    h1: "Motorcycle Spare Parts Export to South Africa",
    lead: "Raznova Exports supplies two-wheeler spare parts from India to distributors and wholesalers in South Africa, serving both the commuter-motorcycle segment and the growing delivery-fleet demand across Southern Africa.",
    sections: [
      {
        heading: "Parts for the South African market",
        body: [
          "South Africa anchors the Southern African region, and its motorcycle parc mixes commuter machines with a fast-expanding delivery and courier fleet — a segment that runs bikes hard and consumes service parts steadily. Our range covers Bajaj-compatible, TVS-pattern and Hero-fitment platforms, with emphasis on the brake, clutch, transmission, cable, filter and electrical parts that delivery fleets replace most often.",
          "For a distributor, that means a supply base tuned to consumables and wear items with predictable repeat demand, from which a Durban or Johannesburg wholesaler can serve both counter trade and fleet accounts.",
        ],
      },
      {
        heading: "Shipping to Durban",
        body: [
          "Consignments dispatch from Nhava Sheva (JNPT) to the Port of Durban, the main gateway for Southern Africa, on an established lane. Cartons are QC-checked, sea-worthy export-packed and photographed before sealing, and every shipment carries the full document set for clearance. Indicative transit is typically in the region of three weeks, with exact timing confirmed at booking, and onward distribution into neighbouring Southern African markets is straightforward from Durban.",
        ],
      },
      {
        heading: "Ordering, MOQ and terms",
        body: [COMMERCIAL_TERMS],
      },
    ],
    faqs: [
      {
        q: "Do you supply delivery-fleet consumables?",
        a: "Yes. Brake shoes, clutch and transmission parts, cables, filters and electrical service items — the wear parts delivery fleets replace most — are a core focus of our South Africa range.",
      },
      {
        q: "Which port do you ship to?",
        a: "Durban, the main Southern African gateway, from Nhava Sheva (JNPT). Indicative transit is around three weeks, confirmed at booking.",
      },
      {
        q: "Can I distribute onward into the region?",
        a: "Yes — Durban is a practical hub for onward distribution into neighbouring Southern African markets.",
      },
      {
        q: "What payment and insurance terms apply?",
        a: "TT and LC terms with ECGC-insured export shipments, confirmed at quotation.",
      },
    ],
    related: [
      { label: "Bajaj-compatible spare parts supplier", href: "/bajaj-spare-parts-exporter" },
      { label: "TVS-pattern spare parts exporter", href: "/tvs-spare-parts-exporter" },
      { label: "Motorcycle spare parts — Kenya", href: "/motorcycle-spare-parts-kenya" },
      { label: "Request a wholesale quote", href: QUOTE },
    ],
  },
];

export function getLanding(slug: string): Landing | undefined {
  return LANDINGS.find((l) => l.slug === slug);
}

export const LANDING_SLUGS = LANDINGS.map((l) => l.slug);
