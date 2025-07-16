import { NextResponse } from 'next/server';
import { getConnectionState, getStoredQRCode } from '../../lib/redis-auth-state';
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

export async function GET() {
  try {
    console.log('🔍 Debugging Redis WhatsApp state...');
    
    // Get connection state
    const connectionState = await getConnectionState();
    console.log('📋 Connection state from Redis:', connectionState);
    
    // Get QR state
    const qrCode = await getStoredQRCode();
    console.log('📋 QR code exists:', !!qrCode);
    
    // Get raw Redis data
    const redis = getRedisClient();
    const rawConnectionState = await redis.get('whatsapp:connection_state');
    const rawCreds = await redis.get('whatsapp:creds');
    const rawKeys = await redis.get('whatsapp:keys');
    const rawQR = await redis.get('whatsapp:qr');
    
    return NextResponse.json({
      success: true,
      debug: {
        connectionState,
        hasQR: !!qrCode,
        qrLength: qrCode?.length || 0,
        raw: {
          connectionState: rawConnectionState,
          hasCreds: !!rawCreds,
          hasKeys: !!rawKeys,
          hasQR: !!rawQR,
        },
        timestamp: Date.now()
      }
    });
    
  } catch (error) {
    console.error('❌ Redis debug error:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      timestamp: Date.now()
    }, { status: 500 });
  }
} 