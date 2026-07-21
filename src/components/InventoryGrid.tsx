import Image from "next/image";
import type { Translations } from "@/i18n/translations";
import SectionHeading from "./SectionHeading";

type Tile = {
  src: string;
  caption: string;
  alt: string;
  className: string;
  sizes: string;
};

/** Server component — clip-path wipe reveals come from the shared
 * [data-reveal="wipe"] observer, hover scale from CSS. No client JS. */
export default function InventoryGrid({ t }: { t: Translations }) {
  // One large frame + four satellites. All photos are real warehouse
  // floor shots; portrait originals are cropped by their frames.
  const tiles: Tile[] = [
    {
      src: "/warehouse/floor-wide.jpg",
      caption: t.inventory.captionFloor,
      alt: "Raznova Exports warehouse floor in Pune stacked with two-wheeler spare parts export cartons",
      className: "col-span-2 md:col-span-7 md:row-span-2 aspect-[16/10] md:aspect-auto",
      sizes: "(min-width: 768px) 58vw, 100vw",
    },
    {
      src: "/warehouse/aisle-office.jpg",
      caption: t.inventory.captionOffice,
      alt: "Racked aisle of boxed OEM-pattern motorcycle spare parts ready for export",
      className: "md:col-span-5 aspect-[3/4] md:aspect-[16/10]",
      sizes: "(min-width: 768px) 42vw, 50vw",
    },
    {
      src: "/warehouse/aisle-pigeonholes.jpg",
      caption: t.inventory.captionPigeonholes,
      alt: "Pigeonhole racking holding fast-moving small two-wheeler parts by SKU",
      className: "md:col-span-5 aspect-[3/4] md:aspect-[16/10]",
      sizes: "(min-width: 768px) 42vw, 50vw",
    },
    {
      src: "/warehouse/bulk-cartons.jpg",
      caption: t.inventory.captionBulk,
      alt: "Bulk carton storage aisle of motorcycle spare parts awaiting container consolidation",
      className: "md:col-span-6 aspect-[3/4] md:aspect-[16/9]",
      sizes: "(min-width: 768px) 50vw, 50vw",
    },
    {
      src: "/warehouse/aisle-dispatch.jpg",
      caption: t.inventory.captionDispatch,
      alt: "Dispatch aisle with open cartons being picked for a spare parts export order",
      className: "md:col-span-6 aspect-[3/4] md:aspect-[16/9]",
      sizes: "(min-width: 768px) 50vw, 50vw",
    },
  ];

  return (
    <section className="px-5 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow={t.inventory.eyebrow}
          title={t.inventory.title}
          subtitle={t.inventory.subtitle}
        />

        <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-12 md:gap-4">
          {tiles.map((tile, i) => (
            <figure
              key={tile.src}
              data-reveal="wipe"
              style={{ "--reveal-i": i } as React.CSSProperties}
              className={`group relative overflow-hidden rounded-[var(--radius-md)] border border-[var(--line)] ${tile.className}`}
            >
              <div className="absolute inset-0 transition-transform duration-700 [transition-timing-function:cubic-bezier(0.21,0.47,0.32,0.98)] group-hover:scale-[1.03]">
                <Image
                  src={tile.src}
                  alt={tile.alt}
                  fill
                  sizes={tile.sizes}
                  quality={65}
                  fetchPriority="low"
                  className="object-cover"
                />
              </div>
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-4 pb-3 pt-10 md:translate-y-3 md:opacity-0 md:transition-all md:duration-500 md:group-hover:translate-y-0 md:group-hover:opacity-100">
                <span className="text-xs font-medium tracking-wide text-[var(--ink)]">
                  {tile.caption}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
