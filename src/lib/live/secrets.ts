// Server-made secrets, kept in the same Redis as the data so nothing has to be typed into Vercel:
// the engine token (what the PC app sends as Bearer) and the VAPID key pair for push.
// ENGINE_TOKEN / VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY in env override the stored values. Nothing is logged.
import { randomBytes, timingSafeEqual } from "node:crypto";
import webpush from "web-push";
import type { Store } from "./store";
import { update } from "./store";

const KEY = "live:secrets";
type Secrets = { engineToken: string; vapid: { publicKey: string; privateKey: string }; createdAt: number };

function make(): Secrets {
  return { engineToken: randomBytes(24).toString("base64url"), vapid: webpush.generateVAPIDKeys(), createdAt: Date.now() };
}

async function secrets(store: Store): Promise<Secrets> {
  const raw = await store.get(KEY);
  if (raw) return JSON.parse(raw) as Secrets;
  return update<Secrets>(store, KEY, make, (cur) => cur);
}

export async function engineToken(store: Store): Promise<string> {
  return process.env.ENGINE_TOKEN || (await secrets(store)).engineToken;
}

export async function rotateEngineToken(store: Store): Promise<string> {
  if (process.env.ENGINE_TOKEN) return process.env.ENGINE_TOKEN;
  const s = await update<Secrets>(store, KEY, make, (cur) => ({ ...cur, engineToken: randomBytes(24).toString("base64url") }));
  return s.engineToken;
}

export async function vapid(store: Store): Promise<{ publicKey: string; privateKey: string }> {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
    return { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY };
  return (await secrets(store)).vapid;
}

export async function engineAuthorized(store: Store, header: string | null): Promise<boolean> {
  const got = (header || "").replace(/^Bearer\s+/i, "");
  if (!got) return false;
  const want = await engineToken(store);
  return want.length === got.length && timingSafeEqual(Buffer.from(want), Buffer.from(got));
}
