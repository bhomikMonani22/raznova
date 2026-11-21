// Storage: one Redis key per document, written by compare-and-swap (the Raznova site's tested pattern).
// Production: REDIS_URL (node-redis over TCP), or Upstash REST (KV_REST_API_URL + KV_REST_API_TOKEN, or
// UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN). Local development: LIVE_DEV_MEMORY=1 keeps state in memory.
// Nothing here logs or returns credentials.
import { createClient } from "redis";

export interface Store {
  kind: "redis" | "upstash" | "memory";
  get(key: string): Promise<string | null>;
  /** Write next only if the key still holds expected (null: only if the key is absent). */
  cas(key: string, expected: string | null, next: string): Promise<boolean>;
}

const CAS_LUA = `local cur = redis.call('GET', KEYS[1])
if ARGV[3] == 'absent' then
  if cur then return 0 end
elseif cur ~= ARGV[1] then
  return 0
end
redis.call('SET', KEYS[1], ARGV[2])
return 1`;

type RedisClient = ReturnType<typeof createClient>;
let redisPromise: Promise<RedisClient> | null = null;

function redisClient(url: string): Promise<RedisClient> {
  if (!redisPromise) {
    const c = createClient({
      url,
      socket: { connectTimeout: 5000, reconnectStrategy: (retries: number) => (retries > 2 ? false : 200) },
    });
    c.on("error", () => {});
    c.on("end", () => {
      redisPromise = null;
    });
    redisPromise = c
      .connect()
      .then(() => c)
      .catch((e: unknown) => {
        redisPromise = null;
        throw e;
      });
  }
  return redisPromise;
}

async function send<T>(url: string, args: string[]): Promise<T> {
  try {
    const c = await redisClient(url);
    return await c.sendCommand<T>(args);
  } catch (e) {
    redisPromise = null;
    throw e;
  }
}

function redisStore(url: string): Store {
  return {
    kind: "redis",
    get: async (key) => (await send<string | null>(url, ["GET", key])) ?? null,
    async cas(key, expected, next) {
      const r = await send<number>(url, ["EVAL", CAS_LUA, "1", key, expected ?? "", next, expected === null ? "absent" : "present"]);
      return Number(r) === 1;
    },
  };
}

function upstashStore(url: string, token: string): Store {
  async function call<T>(cmd: (string | number)[]): Promise<T> {
    const r = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(cmd),
      cache: "no-store",
    });
    const j = (await r.json()) as { result?: T; error?: string };
    if (!r.ok || j.error) throw new Error(j.error || `storage HTTP ${r.status}`);
    return j.result as T;
  }
  return {
    kind: "upstash",
    get: (key) => call<string | null>(["GET", key]),
    async cas(key, expected, next) {
      const r = await call<number>(["EVAL", CAS_LUA, 1, key, expected ?? "", next, expected === null ? "absent" : "present"]);
      return Number(r) === 1;
    },
  };
}

const memory = new Map<string, string>();
export const memoryStore: Store = {
  kind: "memory",
  get: async (key) => memory.get(key) ?? null,
  async cas(key, expected, next) {
    const cur = memory.get(key) ?? null;
    if (expected === null ? cur !== null : cur !== expected) return false;
    memory.set(key, next);
    return true;
  },
};

/** The configured store, or null when no database is connected yet. */
export function getStore(): Store | null {
  if (process.env.REDIS_URL) return redisStore(process.env.REDIS_URL);
  const u = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const t = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (u && t) return upstashStore(u, t);
  if (process.env.LIVE_DEV_MEMORY === "1") return memoryStore;
  return null;
}

/** Read-modify-write one JSON document with compare-and-swap, retrying when another writer got there first. */
export async function update<T>(store: Store, key: string, fresh: () => T, change: (cur: T) => T, tries = 6): Promise<T> {
  for (let i = 0; i < tries; i++) {
    const raw = await store.get(key);
    const cur = raw ? (JSON.parse(raw) as T) : fresh();
    const next = change(cur);
    if (await store.cas(key, raw, JSON.stringify(next))) return next;
  }
  throw new Error("storage busy");
}
