// User-Agent based bot/crawler classification. Runs server-side in the
// /api/track route so every recorded event is tagged is_bot + bot_reason.
// Human reports filter is_bot = false; crawler activity stays queryable.
//
// Ordering matters: named crawlers are matched before the generic
// bot|crawler|spider catch-all so bot_reason is as specific as possible.

const NAMED_BOTS: [RegExp, string][] = [
  [/Googlebot|Google-InspectionTool|Storebot-Google|APIs-Google|AdsBot-Google/i, "googlebot"],
  [/bingbot|BingPreview|adidxbot/i, "bingbot"],
  [/GPTBot/i, "gptbot"],
  [/ChatGPT-User|OAI-SearchBot/i, "chatgpt-user"],
  [/ClaudeBot|Claude-Web|anthropic-ai|Anthropic/i, "claudebot"],
  [/PerplexityBot|Perplexity-User/i, "perplexitybot"],
  [/AhrefsBot|AhrefsSiteAudit/i, "ahrefsbot"],
  [/SemrushBot|SiteAuditBot/i, "semrushbot"],
  [/MJ12bot/i, "mj12bot"],
  [/DotBot/i, "dotbot"],
  [/PetalBot|AspiegelBot/i, "petalbot"],
  [/YandexBot|YandexImages|YandexAccessibilityBot/i, "yandexbot"],
  [/Baiduspider/i, "baiduspider"],
  [/facebookexternalhit|facebookcatalog|meta-externalagent/i, "facebook"],
  [/Twitterbot/i, "twitterbot"],
  [/LinkedInBot/i, "linkedinbot"],
  [/Applebot/i, "applebot"],
  [/DuckDuckBot|DuckDuckGo-Favicons-Bot/i, "duckduckbot"],
  [/Slackbot|Slack-ImgProxy/i, "slackbot"],
  [/WhatsApp/i, "whatsapp-preview"],
  [/TelegramBot/i, "telegrambot"],
  [/Discordbot/i, "discordbot"],
  [/Bytespider/i, "bytespider"],
  [/CCBot/i, "ccbot"],
  [/DataForSeoBot/i, "dataforseobot"],
  [/BLEXBot/i, "blexbot"],
  [/SeznamBot/i, "seznambot"],
  [/Amazonbot/i, "amazonbot"],
  // curl / scripting libraries — never a real buyer's browser
  [/\bcurl\/|Wget\/|python-requests|python-httpx|Go-http-client|Java\/|node-fetch|axios\/|okhttp|libwww-perl|Apache-HttpClient/i, "http-library"],
];

// Generic catch-all — checked only after the named list above.
const GENERIC_BOT = /\bbot\b|crawler|spider|crawling|scraper|feedfetcher|facebookexternalua/i;

export type BotResult = { isBot: boolean; reason: string | null };

/** Classify a request as automated or human from its User-Agent.
 *
 * HeadlessChrome note: real customers do not browse in headless Chrome, so we
 * flag it (is_bot = true, reason = "headless-chrome"). Our own Playwright
 * verification also uses HeadlessChrome, so test traffic is correctly kept out
 * of human reports. It is only ever *flagged*, never dropped — bot_reason
 * makes it easy to include or exclude in a query if you ever want to. */
export function detectBot(userAgent: string | null | undefined): BotResult {
  const ua = (userAgent ?? "").trim();
  if (!ua) return { isBot: true, reason: "empty-user-agent" };

  for (const [pattern, reason] of NAMED_BOTS) {
    if (pattern.test(ua)) return { isBot: true, reason };
  }
  if (/HeadlessChrome|Headless/i.test(ua)) return { isBot: true, reason: "headless-chrome" };
  if (/PhantomJS|SlimerJS|Electron/i.test(ua)) return { isBot: true, reason: "automation" };
  if (GENERIC_BOT.test(ua)) return { isBot: true, reason: "generic-bot-pattern" };

  return { isBot: false, reason: null };
}

/** Coarse device class from the User-Agent — mobile / tablet / desktop. */
export function deviceType(userAgent: string | null | undefined): string {
  const ua = userAgent ?? "";
  if (!ua) return "unknown";
  if (/\biPad\b|Tablet|PlayBook|Silk|(?=.*\bAndroid\b)(?!.*\bMobile\b)/i.test(ua)) return "tablet";
  if (/Mobi|iPhone|iPod|Android.*Mobile|Windows Phone|BlackBerry|IEMobile|Opera Mini/i.test(ua))
    return "mobile";
  return "desktop";
}
