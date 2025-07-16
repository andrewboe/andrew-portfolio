import { NextResponse } from 'next/server';
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
    console.log('📋 Fetching WhatsApp connection logs...');
    
    const redis = getRedisClient();
    const logs = await redis.get('whatsapp:connection_logs') as any[] || [];
    
    // Get the last 10 logs for analysis
    const recentLogs = logs.slice(-10);
    
    // Analyze the logs
    let analysis = {
      totalLogs: logs.length,
      recentEvents: [] as string[],
      lastConnectionAttempt: null as any,
      connectionIssues: [] as string[]
    };
    
    if (recentLogs.length > 0) {
      analysis.lastConnectionAttempt = recentLogs[recentLogs.length - 1];
      analysis.recentEvents = recentLogs.map(log => `${log.iso}: ${log.event}`);
      
      // Look for specific issues
      for (const log of recentLogs) {
        if (log.event === 'connection_close' && log.data?.disconnectCode === 405) {
          analysis.connectionIssues.push('Code 405 - Connection Failure (serverless/network issue)');
        }
        if (log.event === 'connection_close' && log.data?.disconnectReason?.includes('timeout')) {
          analysis.connectionIssues.push('Timeout during connection');
        }
        if (log.data?.error && log.data.error.includes('Uint8Array')) {
          analysis.connectionIssues.push('Uint8Array serialization error');
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      analysis,
      recentLogs,
      allLogs: logs,
      recommendations: analysis.connectionIssues.length > 0 ? [
        'Consider reducing connection timeout to match debug endpoint (30s)',
        'Check serverless function timeout limits',
        'Monitor for consistent 405 errors indicating network issues'
      ] : [
        'Connection logs look normal',
        'Issues may be timing-related rather than authentication'
      ]
    });
    
  } catch (error) {
    console.error('❌ Error fetching connection logs:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch connection logs',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 