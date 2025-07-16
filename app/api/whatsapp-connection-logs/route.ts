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
    console.log('📋 Getting WhatsApp connection logs and timeline...');
    
    const redis = getRedisClient();
    
    // Get all WhatsApp-related keys
    const connectionState = await getConnectionState();
    const qrCode = await getStoredQRCode();
    
    // Get connection logs if they exist
    const connectionLogs = await redis.get('whatsapp:connection_logs') || [];
    
    // Calculate timeline
    const now = Date.now();
    const timeSinceDisconnect = connectionState.disconnectedAt ? 
      now - connectionState.disconnectedAt : null;
    const timeSinceConnect = connectionState.connectedAt ? 
      now - connectionState.connectedAt : null;
    
    return NextResponse.json({
      success: true,
      connectionState,
      timeline: {
        currentTime: now,
        timeSinceDisconnect: timeSinceDisconnect ? `${Math.floor(timeSinceDisconnect / 1000)}s ago` : null,
        timeSinceConnect: timeSinceConnect ? `${Math.floor(timeSinceConnect / 1000)}s ago` : null,
        hasQR: !!qrCode,
        qrAge: qrCode ? 'Active QR available' : 'No QR available'
      },
      logs: connectionLogs,
      rawState: {
        connectionState: await redis.get('whatsapp:connection_state'),
        qrExists: !!qrCode,
        credsExists: !!(await redis.get('whatsapp:creds')),
        keysExists: !!(await redis.get('whatsapp:keys'))
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting connection logs:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      timestamp: Date.now()
    }, { status: 500 });
  }
} 