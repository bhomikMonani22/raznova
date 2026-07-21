import Image from "next/image";
import type { ShowcasePartLite } from "@/lib/types";

/** Pure presentational card — hover lift is CSS, no animation library.
 * `description` is resolved server-side so only the active locale's text
 * ships to the client. */
export default function PartCard({ part }: { part: ShowcasePartLite }) {
  return (
    <div className="flex h-full flex-col overflow-hidden card-surface transition-transform duration-300 hover:-translate-y-1">
      {/* Part photos are shot on white — a warm light panel keeps them
          reading as product imagery inside the dark card. */}
      <div className="relative m-2.5 aspect-[4/3] rounded-[10px] bg-[var(--cream)]">
        <Image
          src={part.image_url}
          alt={`${part.brand} ${part.model} ${part.description} — two-wheeler spare part for export`}
          fill
          sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 45vw"
          quality={70}
          className="object-contain p-3"
        />
      </div>
      <div className="flex flex-1 flex-col px-4 pb-4 pt-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          {part.category}
        </p>
        <p className="mt-1.5 text-[15px] leading-snug text-[var(--ink)]">
          {part.brand} {part.model} {part.description}
        </p>
      </div>
    </div>
  );
}
