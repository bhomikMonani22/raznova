import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LandingPage from "@/components/LandingPage";
import { getLanding } from "@/lib/landings";
import { SITE_URL } from "@/lib/seo";

const SLUG = "motorcycle-spare-parts-kenya";

export function generateMetadata(): Metadata {
  const data = getLanding(SLUG);
  if (!data) return {};
  const url = `${SITE_URL}/${SLUG}`;
  return {
    title: { absolute: data.metaTitle },
    description: data.metaDescription,
    alternates: { canonical: url },
    openGraph: { title: data.metaTitle, description: data.metaDescription, url },
  };
}

export default function Page() {
  const data = getLanding(SLUG);
  if (!data) notFound();
  return <LandingPage data={data} />;
}
