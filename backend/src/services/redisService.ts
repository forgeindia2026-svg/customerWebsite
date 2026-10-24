import { createClient } from 'redis';

let redisClient: ReturnType<typeof createClient> | null = null;
let isConnected = false;

export const initRedis = async () => {
  try {
    const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    redisClient = createClient({ url });

    redisClient.on('error', (err) => {
      console.warn('⚠️ [Redis] Error:', err.message);
      isConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('⚡ [Redis] Connected successfully to in-memory cache');
      isConnected = true;
    });

    await redisClient.connect();
    return redisClient;
  } catch (err: any) {
    console.warn('⚠️ [Redis] Could not connect, caching will be bypassed:', err.message);
    isConnected = false;
    return null;
  }
};

export const getCache = async <T = any>(key: string): Promise<T | null> => {
  if (!isConnected || !redisClient) return null;
  try {
    const data = await redisClient.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
};

export const setCache = async (key: string, value: any, ttlSeconds: number = 60): Promise<void> => {
  if (!isConnected || !redisClient) return;
  try {
    await redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch {
    // Fail silently without breaking the API
  }
};

export const invalidateCache = async (patternOrKey: string): Promise<void> => {
  if (!isConnected || !redisClient) return;
  try {
    if (patternOrKey.includes('*')) {
      const keys = await redisClient.keys(patternOrKey);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } else {
      await redisClient.del(patternOrKey);
    }
  } catch {
    // Fail silently
  }
};
