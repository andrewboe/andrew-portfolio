import { NextResponse } from 'next/server';
import { initAuthCreds } from '@whiskeysockets/baileys';
import { Redis } from '@upstash/redis';

export const runtime = 'nodejs';

function getRedisClient(): Redis {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || process.env.KV_KV_REST_API_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || process.env.KV_KV_REST_API_TOKEN;
  
  return new Redis({
    url: redisUrl,
    token: redisToken,
  });
}

// Enhanced serialization that ensures proper Uint8Array handling
function fixCredentialSerialization(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  // Handle Uint8Array - ensure it's properly formatted
  if (obj instanceof Uint8Array || (obj && obj.constructor && obj.constructor.name === 'Uint8Array')) {
    return {
      __type: 'Uint8Array',
      data: Buffer.from(obj).toString('base64')
    };
  }
  
  // Handle Buffer
  if (Buffer.isBuffer(obj)) {
    return {
      __type: 'Buffer', 
      data: obj.toString('base64')
    };
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => fixCredentialSerialization(item));
  }
  
  // Handle objects
  if (typeof obj === 'object') {
    const fixed: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        fixed[key] = fixCredentialSerialization(obj[key]);
      }
    }
    return fixed;
  }
  
  return obj;
}

function repairCredentialDeserialization(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  // Handle serialized Uint8Array
  if (typeof obj === 'object' && obj.__type === 'Uint8Array') {
    const buffer = Buffer.from(obj.data, 'base64');
    return new Uint8Array(buffer);
  }
  
  // Handle serialized Buffer
  if (typeof obj === 'object' && obj.__type === 'Buffer') {
    return Buffer.from(obj.data, 'base64');
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => repairCredentialDeserialization(item));
  }
  
  // Handle objects
  if (typeof obj === 'object') {
    const repaired: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        repaired[key] = repairCredentialDeserialization(obj[key]);
      }
    }
    return repaired;
  }
  
  return obj;
}

export async function POST() {
  try {
    console.log('🔧 Repairing WhatsApp credentials...');
    
    const redis = getRedisClient();
    
    // Get current credentials
    const [storedCreds, storedKeys] = await Promise.all([
      redis.get('whatsapp:creds'),
      redis.get('whatsapp:keys')
    ]);
    
    if (!storedCreds) {
      return NextResponse.json({
        success: false,
        error: 'No credentials found to repair'
      }, { status: 404 });
    }
    
    console.log('📋 Found existing credentials, analyzing...');
    
    // Analyze current credential structure
    let currentCreds = storedCreds;
    if (typeof storedCreds === 'string') {
      currentCreds = JSON.parse(storedCreds);
    }
    
    console.log('🔍 Current credential keys:', Object.keys(currentCreds));
    
    // Check if credentials need repair
    let needsRepair = false;
    const cryptoKeys = ['noiseKey', 'signedIdentityKey', 'signedPreKey'];
    
    for (const key of cryptoKeys) {
      if (currentCreds[key]) {
        // Check if it's already properly serialized
        if (currentCreds[key].__type !== 'Uint8Array') {
          needsRepair = true;
          console.log(`❌ ${key} needs repair - not properly serialized`);
        } else {
          console.log(`✅ ${key} appears properly serialized`);
        }
      }
    }
    
    if (!needsRepair) {
      // Try deserializing to see if it works
      try {
        const testDeserialized = repairCredentialDeserialization(currentCreds);
        console.log('✅ Credentials appear to be in correct format');
        
        return NextResponse.json({
          success: true,
          message: 'Credentials are already in correct format',
          repaired: false,
          analysis: {
            hasNoiseKey: !!(testDeserialized.noiseKey),
            hasSignedIdentityKey: !!(testDeserialized.signedIdentityKey),
            hasSignedPreKey: !!(testDeserialized.signedPreKey),
            keysAreUint8Array: {
              noiseKey: testDeserialized.noiseKey instanceof Uint8Array,
              signedIdentityKey: testDeserialized.signedIdentityKey instanceof Uint8Array,
              signedPreKey: testDeserialized.signedPreKey instanceof Uint8Array
            }
          }
        });
      } catch (error) {
        console.log('❌ Deserialization test failed, proceeding with repair');
        needsRepair = true;
      }
    }
    
    // Perform repair
    console.log('🔧 Starting credential repair...');
    
    // Re-serialize with proper handling
    const repairedCreds = fixCredentialSerialization(currentCreds);
    
    // Store repaired credentials
    await redis.set('whatsapp:creds', repairedCreds);
    
    // Also repair keys if they exist
    if (storedKeys) {
      let currentKeys = storedKeys;
      if (typeof storedKeys === 'string') {
        currentKeys = JSON.parse(storedKeys);
      }
      const repairedKeys = fixCredentialSerialization(currentKeys);
      await redis.set('whatsapp:keys', repairedKeys);
    }
    
    console.log('✅ Credentials repaired and saved');
    
    // Test the repaired credentials
    const testDeserialized = repairCredentialDeserialization(repairedCreds);
    
    return NextResponse.json({
      success: true,
      message: 'Credentials successfully repaired',
      repaired: true,
      analysis: {
        hasNoiseKey: !!(testDeserialized.noiseKey),
        hasSignedIdentityKey: !!(testDeserialized.signedIdentityKey), 
        hasSignedPreKey: !!(testDeserialized.signedPreKey),
        keysAreUint8Array: {
          noiseKey: testDeserialized.noiseKey instanceof Uint8Array,
          signedIdentityKey: testDeserialized.signedIdentityKey instanceof Uint8Array,
          signedPreKey: testDeserialized.signedPreKey instanceof Uint8Array
        },
        accountId: testDeserialized.me?.id,
        platform: testDeserialized.platform
      }
    });
    
  } catch (error) {
    console.error('❌ Credential repair failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Credential repair failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 