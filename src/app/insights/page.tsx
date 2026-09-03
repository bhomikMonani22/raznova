import type { Metadata } from "next";
import InsightsDashboard from "@/components/InsightsDashboard";

// Private analytics dashboard. Kept out of search and the site's nav; the
// data endpoint is password-gated server-side. Top-level route (not under a
// locale or the marketing layout) so it renders without the site header/footer.
export const metadata: Metadata = {
  title: "Raznova Insights",
  robots: { index: false, follow: false, nocache: true },
};

export default function InsightsPage() {
  return <InsightsDashboard />;
}
