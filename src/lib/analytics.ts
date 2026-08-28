// Client-side analytics sender. Anonymous, non-blocking, and fail-silent:
// if anything here throws or the network is down, the site keeps working and
// the visitor never sees an error. No personal data is collected.

export type TrackEventType =
  | "page_view"
  | "quote_page_view"
  | "whatsapp_click"
  | "quote_submit"
  | "email_click";

const SESSION_COOKIE = "rz_sid";
const SESSION_TTL_SECONDS = 30 * 60; // 30-minute rolling session
const ENDPOINT = "/api/track";

function randomId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return "s-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

function readCookie(name: string): string | null {
  try {
    const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

function writeSessionCookie(value: string) {
  try {
    document.cookie =
      `${SESSION_COOKIE}=${encodeURIComponent(value)}; path=/; max-age=${SESSION_TTL_SECONDS}; samesite=lax`;
  } catch {
    /* cookies blocked — session just won't persist, which is fine */
  }
}

/** Anonymous first-party session id. Identifies a browsing session, never a
 * person. Refreshed on activity so a continuous session keeps one id. */
function getSessionId(): string {
  let id = readCookie(SESSION_COOKIE);
  if (!id) id = randomId();
  writeSessionCookie(id); // create or slide the expiry
  return id;
}

/** Fire an analytics event. Uses sendBeacon (survives page unload, never
 * blocks navigation) with a keepalive fetch fallback. Fully wrapped in
 * try/catch: analytics failure can never break the page. */
export function track(
  eventType: TrackEventType,
  metadata?: Record<string, string | number | boolean>
): void {
  try {
    if (typeof window === "undefined") return;

    const payload = {
      session_id: getSessionId(),
      pathname: window.location.pathname,
      referrer: document.referrer || null,
      event_type: eventType,
      metadata: metadata ?? {},
    };

    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });

    if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, blob)) return;

    // Fallback for browsers where sendBeacon is unavailable or returns false.
    void fetch(ENDPOINT, {
      method: "POST",
      body: blob,
      keepalive: true,
      headers: { "Content-Type": "application/json" },
    }).catch(() => {
      /* swallow — never surface analytics errors to the user */
    });
  } catch {
    /* never throw from analytics */
  }
}
