import { NextResponse } from 'next/server';
import { getConnectionState } from '../../lib/redis-auth-state';

export const runtime = 'nodejs';

// Import the function pieces we need to debug
let globalSocket: any = null; // Mock the global socket check

async function isConnectionReady(): Promise<boolean> {
  const state = await getConnectionState();
  if (!state.isConnected) {
    return false;
  }
  const timeSinceConnection = Date.now() - (state.connectedAt || 0);
  if (timeSinceConnection > 3600000) {
    return false;
  }
  return true;
}

export async function GET() {
  const startTime = Date.now();
  const timingLogs: string[] = [];
  
  function logTiming(message: string) {
    const timestamp = Date.now() - startTime;
    const logMessage = `⏱️  [${timestamp}ms] ${message}`;
    timingLogs.push(logMessage);
    console.log(logMessage);
  }
  
  try {
    logTiming('🚀 Starting getConnectionStatus debug...');
    
    logTiming('📊 Step 1: Getting Redis connection state...');
    const redisState = await getConnectionState();
    logTiming(`📊 Step 1 complete: ${JSON.stringify(redisState)}`);
    
    logTiming('📊 Step 2: Checking global socket...');
    const hasSocket = !!globalSocket;
    logTiming(`📊 Step 2 complete: hasSocket=${hasSocket}`);
    
    logTiming('📊 Step 3: Calling isConnectionReady...');
    const isConnected = await isConnectionReady();
    logTiming(`📊 Step 3 complete: isConnected=${isConnected}`);
    
    logTiming('📊 Step 4: Building final response...');
    const result = {
      isConnected,
      hasSocket,
      connected: isConnected,
      lastConnected: redisState.connectedAt,
      socketUser: redisState.socketId,
    };
    logTiming('📊 Step 4 complete: Ready to return');
    
    return NextResponse.json({
      success: true,
      totalTime: Date.now() - startTime,
      timingLogs,
      result,
      message: 'Status debug completed successfully'
    });
    
  } catch (error) {
    const errorTime = Date.now() - startTime;
    logTiming(`❌ ERROR after ${errorTime}ms: ${error instanceof Error ? error.message : String(error)}`);
    
    return NextResponse.json({
      success: false,
      totalTime: errorTime,
      timingLogs,
      error: error instanceof Error ? error.message : String(error),
      message: 'Status debug failed'
    }, { status: 500 });
  }
} 