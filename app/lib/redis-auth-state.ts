import { Redis } from '@upstash/redis';
import { AuthenticationState, AuthenticationCreds, SignalDataTypeMap, initAuthCreds } from '@whiskeysockets/baileys';
import { proto } from '@whiskeysockets/baileys';

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

// Redis keys for auth state storage
const REDIS_KEYS = {
  CREDS: 'whatsapp:creds',
  KEYS: 'whatsapp:keys',
  QR: 'whatsapp:qr',
  CONNECTION_STATE: 'whatsapp:connection_state'
};

// Use Baileys' own AuthenticationCreds type instead of custom interface

// Utility functions for serialization that handles both Uint8Array and Buffer objects
function serializeWithUint8Arrays(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (obj instanceof Uint8Array) {
    return {
      __type: 'Uint8Array',
      data: Buffer.from(obj).toString('base64')
    };
  }
  
  if (Buffer.isBuffer(obj)) {
    return {
      __type: 'Buffer',
      data: obj.toString('base64')
    };
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => serializeWithUint8Arrays(item));
  }
  
  if (typeof obj === 'object') {
    const serialized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        serialized[key] = serializeWithUint8Arrays(obj[key]);
      }
    }
    return serialized;
  }
  
  return obj;
}

function deserializeWithUint8Arrays(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  // Handle string data that needs to be parsed first
  if (typeof obj === 'string') {
    try {
      obj = JSON.parse(obj);
    } catch (error) {
      return obj; // Return as-is if not valid JSON
    }
  }
  
  // Handle serialized Uint8Array objects
  if (typeof obj === 'object' && obj.__type === 'Uint8Array') {
    try {
      const buffer = Buffer.from(obj.data, 'base64');
      const uint8Array = new Uint8Array(buffer);
      console.log(`🔧 Deserialized Uint8Array of length ${uint8Array.length}`);
      return uint8Array;
    } catch (error) {
      console.error('❌ Failed to deserialize Uint8Array:', error);
      return obj;
    }
  }
  
  // Handle serialized Buffer objects
  if (typeof obj === 'object' && obj.__type === 'Buffer') {
    try {
      return Buffer.from(obj.data, 'base64');
    } catch (error) {
      console.error('❌ Failed to deserialize Buffer:', error);
      return obj;
    }
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => deserializeWithUint8Arrays(item));
  }
  
  // Handle objects
  if (typeof obj === 'object') {
    const deserialized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const deserializedValue = deserializeWithUint8Arrays(obj[key]);
        deserialized[key] = deserializedValue;
        
        // Debug logging for crypto keys
        if (['noiseKey', 'signedIdentityKey', 'signedPreKey'].includes(key)) {
          console.log(`🔍 Key ${key}: ${deserializedValue instanceof Uint8Array ? 'Uint8Array' : typeof deserializedValue} (length: ${deserializedValue?.length || 'N/A'})`);
        }
      }
    }
    return deserialized;
  }
  
  return obj;
}

// Convert Uint8Arrays to Buffers for Baileys compatibility
function convertUint8ArraysToBuffers(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  // Convert Uint8Array to Buffer
  if (obj instanceof Uint8Array) {
    const buffer = Buffer.from(obj);
    console.log(`🔄 Converted Uint8Array to Buffer (length: ${buffer.length})`);
    return buffer;
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => convertUint8ArraysToBuffers(item));
  }
  
  // Handle objects
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const convertedValue = convertUint8ArraysToBuffers(obj[key]);
        converted[key] = convertedValue;
        
        // Debug logging for crypto keys
        if (['noiseKey', 'signedIdentityKey', 'signedPreKey'].includes(key)) {
          console.log(`🔧 Key ${key}: ${convertedValue instanceof Buffer ? 'Buffer' : typeof convertedValue} (length: ${convertedValue?.length || 'N/A'})`);
        }
      }
    }
    return converted;
  }
  
  return obj;
}

export async function useRedisAuthState(): Promise<{
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
}> {
  const redis = getRedisClient();
  
  // Initialize with default credentials first (ensures creds is always assigned)
  let creds: AuthenticationCreds = initAuthCreds();
  let keys: any = {};
  
  try {
    // Try to load existing credentials from Redis
    const storedCreds = await redis.get(REDIS_KEYS.CREDS);
    if (storedCreds) {
      const deserializedCreds = deserializeWithUint8Arrays(storedCreds);
      
      // Convert Uint8Arrays to Buffers for Baileys compatibility
      const baileysCreds = convertUint8ArraysToBuffers(deserializedCreds);
      creds = baileysCreds as AuthenticationCreds;
      
      console.log('✅ Loaded existing auth credentials from Redis');
      console.log('🔧 Converted Uint8Arrays to Buffers for Baileys compatibility');
    } else {
      console.log('🔄 Using initial auth credentials for new session');
    }
    
    // Load keys
    const storedKeys = await redis.get(REDIS_KEYS.KEYS);
    if (storedKeys) {
      keys = deserializeWithUint8Arrays(storedKeys) || {};
      console.log('✅ Loaded existing keys from Redis');
    }
  } catch (error) {
    console.error('❌ Error loading auth state from Redis:', error);
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
      if (state.creds) {
        // Debug logging for credential types before saving
        const cryptoKeys = ['noiseKey', 'signedIdentityKey', 'signedPreKey'];
        console.log('🔍 Credential types before saving:');
        for (const key of cryptoKeys) {
          const value = (state.creds as any)[key];
          if (value) {
            console.log(`  ${key}: ${value instanceof Uint8Array ? 'Uint8Array' : typeof value} (length: ${value?.length || 'N/A'})`);
          }
        }
        
        const serializedCreds = serializeWithUint8Arrays(state.creds);
        await redis.set(REDIS_KEYS.CREDS, serializedCreds);
        console.log('✅ Saved auth credentials to Redis');
        
        // Ensure the state.creds object has proper format for immediate Baileys usage
        const reDeserialized = deserializeWithUint8Arrays(serializedCreds);
        state.creds = convertUint8ArraysToBuffers(reDeserialized) as any;
        console.log('🔧 Re-deserialized and converted credentials to Buffers for immediate Baileys usage');
      }
      
      const serializedKeys = serializeWithUint8Arrays(keys);
      await redis.set(REDIS_KEYS.KEYS, serializedKeys);
      console.log('✅ Saved keys to Redis');
    } catch (error) {
      console.error('❌ Error saving auth state to Redis:', error);
    }
  };
  
  return { state, saveCreds };
}

// QR Code management
export async function storeQRCode(qr: string): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.set(REDIS_KEYS.QR, qr, { ex: 300 }); // 5 minute expiry
    console.log('✅ QR code stored in Redis');
  } catch (error) {
    console.error('❌ Error storing QR code:', error);
    throw error;
  }
}

export async function getStoredQRCode(): Promise<string | null> {
  try {
    const redis = getRedisClient();
    const qr = await redis.get(REDIS_KEYS.QR) as string | null;
    return qr;
  } catch (error) {
    console.error('❌ Error retrieving QR code:', error);
    return null;
  }
}

export async function clearQRCode(): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.del(REDIS_KEYS.QR);
    console.log('✅ QR code cleared from Redis');
  } catch (error) {
    console.error('❌ Error clearing QR code:', error);
  }
}

// Connection state management
export async function storeConnectionState(state: any): Promise<void> {
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

export async function getConnectionState(): Promise<any> {
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
export async function clearAllAuthData(): Promise<void> {
  try {
    const redis = getRedisClient();
    await Promise.all([
      redis.del(REDIS_KEYS.CREDS),
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