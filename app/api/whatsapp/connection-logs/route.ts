import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('📊 Getting recent connection logs...');
    
    // Import Redis functions
    const { getRedisClient } = await import('../../../lib/redis-auth-state');
    const redis = getRedisClient();
    
    // Get recent connection events from Redis logs
    const logs = await redis.lrange('whatsapp:connection:logs', 0, 49); // Last 50 events
    
    // Parse and format logs
    const parsedLogs = logs.map(log => {
      try {
        return JSON.parse(log);
      } catch {
        return { event: 'parse_error', data: log };
      }
    }).reverse(); // Show newest first
    
    // Get current connection state
    const { getConnectionState } = await import('../../../lib/redis-auth-state');
    const currentState = await getConnectionState();
    
    return NextResponse.json({
      success: true,
      currentState,
      recentLogs: parsedLogs,
      logCount: parsedLogs.length,
      message: `Retrieved ${parsedLogs.length} recent connection events`
    });
    
  } catch (error) {
    console.error('❌ Error getting connection logs:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get connection logs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 