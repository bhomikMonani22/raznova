import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// AI / LLM crawlers we explicitly welcome. Being readable by these is a
// necessary condition for ChatGPT, Claude, Gemini, Perplexity, etc. to be
// able to cite or recommend the site when a user asks about exporters from
// India. Each is allowed everything except /api. Google-Extended and
// Applebot-Extended govern training/answer use for Gemini and Apple.
const AI_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Amazonbot",
  "Bytespider",
  "CCBot",
  "cohere-ai",
  "Meta-ExternalAgent",
  "DuckAssistBot",
  "YouBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Everyone (search engines included) may crawl everything but /api.
      { userAgent: "*", allow: "/", disallow: ["/api/", "/insights"] },
      // Bing powers its own search plus ChatGPT Search and other AI answers,
      // so it is welcomed explicitly (already covered by * above).
      { userAgent: "Bingbot", allow: "/", disallow: ["/api/", "/insights"] },
      // Explicit welcome for AI crawlers — same access, stated unambiguously.
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: ["/api/", "/insights"],
      })),
    ],
    host: SITE_URL,
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
