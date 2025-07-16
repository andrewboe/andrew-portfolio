import { NextResponse } from 'next/server';
import { getConnectionState, storeQRCode, clearQRCode } from '../../../lib/redis-auth-state';

export const runtime = 'nodejs';

export async function GET() {
  const startTime = Date.now();
  const logs: string[] = [];
  let finalResult: any = { status: 'unknown' };
  
  function log(message: string) {
    const timestamp = Date.now() - startTime;
    const logMessage = `[${timestamp}ms] ${message}`;
    logs.push(logMessage);
    console.log(logMessage);
  }
  
  try {
    log('🚀 COMPREHENSIVE CONNECTION DEBUG START');
    
    // Step 1: Check initial state
    log('📊 Step 1: Checking initial Redis state...');
    const initialState = await getConnectionState();
    log(`Step 1 Result: ${JSON.stringify(initialState)}`);
    
    // Step 2: Import and check manager state
    log('📊 Step 2: Importing WhatsApp manager...');
    const manager = await import('../../../lib/whatsapp-manager');
    log('Step 2 Complete: Manager imported');
    
    // Step 3: Check connection readiness
    log('📊 Step 3: Checking connection readiness...');
    const isReady = await manager.isConnectionReady();
    log(`Step 3 Result: isReady=${isReady}`);
    
    // Step 4: Clear any existing QR
    log('📊 Step 4: Clearing any existing QR code...');
    await clearQRCode();
    log('Step 4 Complete: QR cleared');
    
    // Step 5: Create detailed connection with promise monitoring
    log('📊 Step 5: Starting detailed connection creation...');
    
    const connectionPromise = manager.getWhatsAppConnection();
    
    // Monitor the promise with detailed logging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        log('⚠️ DEBUG TIMEOUT: 60 seconds reached - this is our debug timeout');
        reject(new Error('Debug timeout after 60 seconds'));
      }, 60000);
    });
    
    let connectionResult;
    try {
      log('📞 Calling getWhatsAppConnection with 60s debug timeout...');
      connectionResult = await Promise.race([connectionPromise, timeoutPromise]);
      log(`✅ Connection attempt completed successfully`);
      finalResult = { status: 'connection_success', hasSocket: !!connectionResult };
    } catch (connectionError) {
      log(`❌ Connection attempt failed: ${connectionError instanceof Error ? connectionError.message : String(connectionError)}`);
      finalResult = { 
        status: 'connection_failed', 
        error: connectionError instanceof Error ? connectionError.message : String(connectionError)
      };
    }
    
    // Step 6: Check final state
    log('📊 Step 6: Checking final state...');
    const finalState = await getConnectionState();
    log(`Step 6 Result: ${JSON.stringify(finalState)}`);
    
    // Step 7: Check if QR was generated
    log('📊 Step 7: Checking if QR was generated...');
    const { getStoredQRCode } = await import('../../../lib/redis-auth-state');
    const qrCode = await getStoredQRCode();
    log(`Step 7 Result: QR exists=${!!qrCode}, length=${qrCode?.length || 0}`);
    
    finalResult.finalState = finalState;
    finalResult.qrGenerated = !!qrCode;
    
    log('🏁 COMPREHENSIVE DEBUG COMPLETE');
    
    return NextResponse.json({
      success: true,
      totalTime: Date.now() - startTime,
      logs,
      result: finalResult,
      message: 'Comprehensive connection debug completed'
    });
    
  } catch (error) {
    log(`💥 FATAL ERROR: ${error instanceof Error ? error.message : String(error)}`);
    finalResult = { 
      status: 'fatal_error', 
      error: error instanceof Error ? error.message : String(error)
    };
    
    return NextResponse.json({
      success: false,
      totalTime: Date.now() - startTime,
      logs,
      result: finalResult,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 