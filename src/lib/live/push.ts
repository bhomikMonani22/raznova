// Web push to installed phones (Android Chrome). Keys come from secrets.ts (made on first use).
import webpush from "web-push";
import type { LiveState, Signal } from "./state";

export function message(sig: Signal) {
  const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
  return {
    title: `${sig.tier.toUpperCase()} · ${sig.player} ${sig.side === "over" ? "O" : "U"} ${sig.line} ${sig.label}`,
    body: `@ ${sig.odds.toFixed(2)} · fair ${pct(sig.fair)} · edge ${pct(sig.edge)} · ${sig.game}`,
    tag: sig.id,
    url: "/live",
  };
}

/** Sends to every subscription; returns the endpoints that are gone (to delete). */
export async function sendAll(state: LiveState, sigs: Signal[], keys: { publicKey: string; privateKey: string }): Promise<string[]> {
  if (!sigs.length || !Object.keys(state.push || {}).length) return [];
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "https://raznova.in/live", keys.publicKey, keys.privateKey);
  const gone: string[] = [];
  for (const sub of Object.values(state.push || {})) {
    for (const sig of sigs) {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, JSON.stringify(message(sig)),
          { TTL: 600, urgency: sig.tier === "strong" ? "high" : "normal" });
      } catch (e: unknown) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) { gone.push(sub.endpoint); break; }
      }
    }
  }
  return gone;
}
