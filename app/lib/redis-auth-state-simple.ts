import { Redis } from '@upstash/redis';
import { AuthenticationState, initAuthCreds } from '@whiskeysockets/baileys';

// Initialize Redis client
function getRedisClient(): Redis {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || process.env.KV_KV_REST_API_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || process.env.KV_KV_REST_API_TOKEN;
  
  if (!redisUrl || !redisToken) {
    throw new Error('Redis environment variables not found. Need one of: UPSTASH_REDIS_REST_URL/KV_REST_API_URL/KV_KV_REST_API_URL and corresponding TOKEN');
  }
  
  return new Redis({
    url: redisUrl,
    token: redisToken,
  });
}

// Redis keys
const REDIS_KEYS = {
  KEYS: 'whatsapp:keys',
  QR: 'whatsapp:qr',
  CONNECTION_STATE: 'whatsapp:connection_state'
};

// Simple approach: Don't serialize credentials, just let Baileys handle them
// Only store the keys and recreate credentials each time
export async function useRedisAuthStateSimple(): Promise<{
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
}> {
  const redis = getRedisClient();
  
  // Always start with fresh credentials from Baileys
  const creds = initAuthCreds();
  let keys: any = {};
  
  try {
    // Load existing keys if they exist
    const storedKeys = await redis.get(REDIS_KEYS.KEYS);
    if (storedKeys) {
      keys = storedKeys || {};
      console.log('✅ Loaded existing keys from Redis');
    } else {
      console.log('🔄 No existing keys found, starting fresh');
    }
  } catch (error) {
    console.error('❌ Error loading keys from Redis:', error);
  }
  
  const state: AuthenticationState = {
    creds,
    keys: {
      get: (type: string, ids: string[]) => {
        const key = `${type}:${ids.join(':')}`;
        return keys[key] || {};
      },
      set: (data: any) => {
        for (const category in data) {
          for (const id in data[category]) {
            const key = `${category}:${id}`;
            keys[key] = data[category][id];
          }
        }
      }
    }
  };
  
  const saveCreds = async () => {
    try {
      // Only save the keys, not the credentials
      // Let Baileys recreate credentials each time
      await redis.set(REDIS_KEYS.KEYS, keys);
      console.log('✅ Saved keys to Redis');
    } catch (error) {
      console.error('❌ Error saving keys to Redis:', error);
    }
  };
  
  return { state, saveCreds };
}

// QR Code management (unchanged)
export async function storeQRCodeSimple(qr: string): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.set(REDIS_KEYS.QR, qr, { ex: 300 }); // 5 minute expiry
    console.log('✅ QR code stored in Redis');
  } catch (error) {
    console.error('❌ Error storing QR code:', error);
    throw error;
  }
}

export async function getStoredQRCodeSimple(): Promise<string | null> {
  try {
    const redis = getRedisClient();
    const qr = await redis.get(REDIS_KEYS.QR) as string | null;
    return qr;
  } catch (error) {
    console.error('❌ Error retrieving QR code:', error);
    return null;
  }
}

export async function clearQRCodeSimple(): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.del(REDIS_KEYS.QR);
    console.log('✅ QR code cleared from Redis');
  } catch (error) {
    console.error('❌ Error clearing QR code:', error);
  }
}

// Connection state management (unchanged)
export async function storeConnectionStateSimple(state: any): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.set(REDIS_KEYS.CONNECTION_STATE, {
      ...state,
      timestamp: Date.now()
    }, { ex: 3600 }); // 1 hour expiry
    console.log('✅ Connection state stored in Redis');
  } catch (error) {
    console.error('❌ Error storing connection state:', error);
  }
}

export async function getConnectionStateSimple(): Promise<any> {
  try {
    const redis = getRedisClient();
    const state = await redis.get(REDIS_KEYS.CONNECTION_STATE);
    return state || { isConnected: false, timestamp: 0 };
  } catch (error) {
    console.error('❌ Error retrieving connection state:', error);
    return { isConnected: false, timestamp: 0 };
  }
}

// Clear all auth data
export async function clearAllAuthDataSimple(): Promise<void> {
  try {
    const redis = getRedisClient();
    await Promise.all([
      redis.del(REDIS_KEYS.KEYS),
      redis.del(REDIS_KEYS.QR),
      redis.del(REDIS_KEYS.CONNECTION_STATE)
    ]);
    console.log('✅ All auth data cleared from Redis');
  } catch (error) {
    console.error('❌ Error clearing auth data:', error);
    throw error;
  }
} 