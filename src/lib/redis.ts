// FILE: src/lib/redis.ts
import { Redis } from '@upstash/redis';

// Upstash's REST client is stateless HTTP (no persistent TCP connection to
// manage), so unlike src/lib/db.ts there's no need for a globalThis
// dev-mode singleton guard -- this is cheap and safe to construct fresh.
export const redis = Redis.fromEnv();
