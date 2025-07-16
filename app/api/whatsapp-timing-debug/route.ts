import { NextResponse } from 'next/server';
import { getWhatsAppConnection } from '../../lib/whatsapp-manager';

export const runtime = 'nodejs';

// Array to capture timing logs
let timingLogs: string[] = [];
let startTime = 0;

// Custom logger that captures to array AND console
function logTiming(message: string) {
  const timestamp = Date.now() - startTime;
  const logMessage = `⏱️  [${timestamp}ms] ${message}`;
  
  timingLogs.push(logMessage);
  console.log(logMessage);
  
  return logMessage;
}

export async function GET() {
  // Reset logs for fresh test
  timingLogs = [];
  startTime = Date.now();
  
  try {
    logTiming('🚀 Starting WhatsApp timing debug test...');
    
    logTiming('📞 Calling getWhatsAppConnection()...');
    const socket = await getWhatsAppConnection();
    
    logTiming('✅ getWhatsAppConnection() completed successfully');
    logTiming(`🔍 Socket state: ${socket ? 'exists' : 'null'}`);
    
    return NextResponse.json({
      success: true,
      totalTime: Date.now() - startTime,
      timingLogs,
      socketExists: !!socket,
      message: 'Connection test completed successfully'
    });
    
  } catch (error) {
    const errorTime = Date.now() - startTime;
    logTiming(`❌ ERROR after ${errorTime}ms: ${error instanceof Error ? error.message : String(error)}`);
    
    return NextResponse.json({
      success: false,
      totalTime: errorTime,
      timingLogs,
      error: error instanceof Error ? error.message : String(error),
      message: 'Connection test failed'
    }, { status: 500 });
  }
} 