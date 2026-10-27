// Storage for the fantasy league: one JSON document per league, written by compare-and-swap.
// Production: the Redis database connected to this Vercel project (REDIS_URL, a TCP connection via node-redis).
// Also understood: Upstash's REST variables (KV_REST_API_URL + KV_REST_API_TOKEN, or UPSTASH_REDIS_REST_*).
// Local development only: FANTASY_DEV_MEMORY=1 keeps leagues in memory. Nothing here logs or returns credentials.
import { createClient } from "redis";

export interface Store {
  kind: "redis" | "upstash" | "memory";
  get(key: string): Promise<string | null>;
  /** Write next only if the key still holds expected (null: only if the key is absent). */
  cas(key: string, expected: string | null, next: string): Promise<boolean>;
  incr(key: string): Promise<number>;
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
    c.on("error", () => {
      // connection errors surface on the next command; never log the URL
    });
    c.on("end", () => {
      redisPromise = null; // closed for good: the next request opens a fresh connection
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
    redisPromise = null; // a broken connection is not reused by the next request
    throw e;
  }
}

function redisStore(url: string): Store {
  return {
    kind: "redis",
    async get(key) {
      const v = await send<string | null>(url, ["GET", key]);
      return v ?? null;
    },
    async cas(key, expected, next) {
      const r = await send<number>(url, [
        "EVAL", CAS_LUA, "1", key, expected ?? "", next, expected === null ? "absent" : "present",
      ]);
      return Number(r) === 1;
    },
    incr: async (key) => Number(await send<number>(url, ["INCR", key])),
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
    incr: async (key) => Number(await call<number>(["INCR", key])),
  };
}

const memory = new Map<string, string>();
const memoryStore: Store = {
  kind: "memory",
  get: async (key) => memory.get(key) ?? null,
  async cas(key, expected, next) {
    const cur = memory.get(key) ?? null;
    if (expected === null ? cur !== null : cur !== expected) return false;
    memory.set(key, next);
    return true;
  },
  async incr(key) {
    const n = Number(memory.get(key) ?? "0") + 1;
    memory.set(key, String(n));
    return n;
  },
};

/** The configured store, or null when this deployment has no database connected yet. */
export function getStore(): Store | null {
  const url = process.env.REDIS_URL;
  if (url) return redisStore(url);
  const rest = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (rest && token) return upstashStore(rest, token);
  if (process.env.FANTASY_DEV_MEMORY === "1" && process.env.NODE_ENV !== "production") return memoryStore;
  if (process.env.FANTASY_DEV_MEMORY === "1" && process.env.FANTASY_ALLOW_MEMORY_IN_PROD === "1") return memoryStore;
  return null;
}
