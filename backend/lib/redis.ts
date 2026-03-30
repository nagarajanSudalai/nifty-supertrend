import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const KEYS = {
  TOKENS: "push:tokens",
  STATE: "supertrend:state",
  HISTORY: "supertrend:history",
} as const;

export interface SupertrendState {
  direction: "BULLISH" | "BEARISH";
  band: number;
  close: number;
  timestamp: string; // ISO string
}

export interface SignalEvent {
  direction: "BULLISH" | "BEARISH";
  band: number;
  close: number;
  timestamp: string; // ISO string
}

// ── Token management ─────────────────────────────────────────────────────────

export async function registerToken(token: string): Promise<void> {
  await redis.sadd(KEYS.TOKENS, token);
}

export async function unregisterToken(token: string): Promise<void> {
  await redis.srem(KEYS.TOKENS, token);
}

export async function removeTokens(tokens: string[]): Promise<void> {
  if (tokens.length === 0) return;
  await redis.srem(KEYS.TOKENS, ...tokens);
}

export async function getAllTokens(): Promise<string[]> {
  const members = await redis.smembers(KEYS.TOKENS);
  return members as string[];
}

// ── State management ──────────────────────────────────────────────────────────

export async function getSupertrendState(): Promise<SupertrendState | null> {
  const raw = await redis.get<SupertrendState>(KEYS.STATE);
  return raw ?? null;
}

export async function setSupertrendState(state: SupertrendState): Promise<void> {
  await redis.set(KEYS.STATE, state);
}

// ── Signal history ────────────────────────────────────────────────────────────

export async function pushSignalHistory(signal: SignalEvent): Promise<void> {
  await redis.lpush(KEYS.HISTORY, JSON.stringify(signal));
  await redis.ltrim(KEYS.HISTORY, 0, 49); // keep last 50 signals
}

export async function getSignalHistory(count = 20): Promise<SignalEvent[]> {
  const items = await redis.lrange(KEYS.HISTORY, 0, count - 1);
  return (items as string[]).map((item) => {
    try {
      return typeof item === "string" ? JSON.parse(item) : item;
    } catch {
      return item as unknown as SignalEvent;
    }
  });
}

export async function getDeviceCount(): Promise<number> {
  return await redis.scard(KEYS.TOKENS);
}
