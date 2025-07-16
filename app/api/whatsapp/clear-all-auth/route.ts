import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  try {
    console.log('🧹 COMPLETE AUTH CLEAR: Clearing ALL WhatsApp authentication data...');
    
    // Import Redis functions
    const { clearAllAuthData } = await import('../../../lib/redis-auth-state');
    
    // Import manager functions
    const { clearGlobalConnection } = await import('../../../lib/whatsapp-manager');
    
    // Step 1: Clear ALL Redis auth data
    console.log('Step 1: Clearing Redis auth data...');
    await clearAllAuthData();
    
    // Step 2: Clear global connection state
    console.log('Step 2: Clearing global connection state...');
    await clearGlobalConnection();
    
    // Step 3: Clear connection logs for fresh start
    console.log('Step 3: Clearing connection logs...');
    const { Redis } = await import('@upstash/redis');
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || process.env.KV_KV_REST_API_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || process.env.KV_KV_REST_API_TOKEN;
    
    if (redisUrl && redisToken) {
      const redis = new Redis({ url: redisUrl, token: redisToken });
      await redis.del('whatsapp:connection_logs');
      console.log('✅ Connection logs cleared');
    }
    
    console.log('✅ COMPLETE AUTH CLEAR: All authentication data cleared successfully');
    
    return NextResponse.json({
      success: true,
      message: 'ALL WhatsApp authentication data cleared. Ready for fresh device linking.',
      instructions: [
        '1. Wait 10 seconds for full cleanup',
        '2. Generate fresh QR with GET /api/whatsapp/qr',
        '3. This will be a completely new WhatsApp session',
        '4. Scan QR to link fresh device'
      ]
    });
    
  } catch (error) {
    console.error('❌ Error clearing all auth data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to clear all authentication data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 