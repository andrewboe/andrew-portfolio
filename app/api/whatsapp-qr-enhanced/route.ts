import { NextResponse } from 'next/server';
import makeWASocket, { Browsers, DisconnectReason } from '@whiskeysockets/baileys';
import { useRedisAuthState, storeQRCode, getStoredQRCode, clearQRCode, storeConnectionState } from '../../lib/redis-auth-state';

export const runtime = 'nodejs';

interface ConnectionAttemptResult {
  success: boolean;
  qr?: string;
  error?: string;
  disconnectCode?: number;
  attempt: number;
}

async function attemptConnection(attemptNumber: number): Promise<ConnectionAttemptResult> {
  return new Promise(async (resolve) => {
    console.log(`🔄 Connection attempt ${attemptNumber}/3`);
    
    try {
      const { state } = await useRedisAuthState();
      
      // Progressive timeout increase for each attempt
      const timeouts = {
        1: { connect: 60000, query: 60000 },   // 1 minute
        2: { connect: 120000, query: 120000 }, // 2 minutes  
        3: { connect: 180000, query: 180000 }  // 3 minutes
      };
      
      const timeout = timeouts[attemptNumber as keyof typeof timeouts] || timeouts[3];
      
      const socket = makeWASocket({
        auth: state,
        browser: Browsers.ubuntu('WhatsApp Bot Enhanced'),
        connectTimeoutMs: timeout.connect,
        defaultQueryTimeoutMs: timeout.query,
        keepAliveIntervalMs: 30000,
        qrTimeout: 300000, // 5 minutes
        retryRequestDelayMs: 10000, // 10 seconds between retries
        maxMsgRetryCount: 5,
        printQRInTerminal: false,
        syncFullHistory: false,
        markOnlineOnConnect: false,
        emitOwnEvents: false,
        fireInitQueries: true,
        generateHighQualityLinkPreview: false,
      });

      let connectionResolved = false;
      let qrReceived = false;
      
      // Set timeout for the entire attempt
      const attemptTimeout = setTimeout(() => {
        if (!connectionResolved) {
          connectionResolved = true;
          socket.end();
          resolve({
            success: false,
            error: `Attempt ${attemptNumber} timed out after ${timeout.connect / 1000}s`,
            attempt: attemptNumber
          });
        }
      }, timeout.connect + 30000); // Extra 30s buffer
      
      socket.ev.on('connection.update', async (update) => {
        try {
          const { connection, lastDisconnect, qr } = update;
          
          if (qr && !qrReceived) {
            qrReceived = true;
            console.log(`✅ QR received on attempt ${attemptNumber}`);
            
            // Store QR immediately
            await storeQRCode(qr);
            
            clearTimeout(attemptTimeout);
            if (!connectionResolved) {
              connectionResolved = true;
              socket.end();
              resolve({
                success: true,
                qr,
                attempt: attemptNumber
              });
            }
          }
          
          if (connection === 'close') {
            const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
            console.log(`❌ Attempt ${attemptNumber} failed with code: ${statusCode}`);
            
            clearTimeout(attemptTimeout);
            if (!connectionResolved) {
              connectionResolved = true;
              socket.end();
              
              if (statusCode === 405) {
                resolve({
                  success: false,
                  error: `Connection Failure (405) on attempt ${attemptNumber}`,
                  disconnectCode: 405,
                  attempt: attemptNumber
                });
              } else {
                resolve({
                  success: false,
                  error: `Disconnect code ${statusCode} on attempt ${attemptNumber}`,
                  disconnectCode: statusCode,
                  attempt: attemptNumber
                });
              }
            }
          }
        } catch (error) {
          console.error(`❌ Error in connection handler (attempt ${attemptNumber}):`, error);
          clearTimeout(attemptTimeout);
          if (!connectionResolved) {
            connectionResolved = true;
            socket.end();
            resolve({
              success: false,
              error: `Handler error: ${error instanceof Error ? error.message : String(error)}`,
              attempt: attemptNumber
            });
          }
        }
      });
      
    } catch (error) {
      console.error(`❌ Failed to create socket (attempt ${attemptNumber}):`, error);
      resolve({
        success: false,
        error: `Setup error: ${error instanceof Error ? error.message : String(error)}`,
        attempt: attemptNumber
      });
    }
  });
}

export async function GET() {
  try {
    console.log('🚀 Enhanced QR generation with 405 retry logic...');
    
    // Check for existing QR first
    const existingQR = await getStoredQRCode();
    if (existingQR) {
      console.log('✅ Found existing valid QR');
      return NextResponse.json({
        success: true,
        qr: existingQR,
        message: 'Existing QR code retrieved',
        cached: true
      });
    }
    
    const attempts: ConnectionAttemptResult[] = [];
    let finalResult: ConnectionAttemptResult | null = null;
    
    // Try up to 3 times with increasing timeouts
    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`\n🔄 Starting attempt ${attempt}/3...`);
      
      const result = await attemptConnection(attempt);
      attempts.push(result);
      
      if (result.success) {
        finalResult = result;
        console.log(`✅ Success on attempt ${attempt}!`);
        break;
      } else {
        console.log(`❌ Attempt ${attempt} failed: ${result.error}`);
        
        // If it's a 405 error, wait before next attempt
        if (result.disconnectCode === 405 && attempt < 3) {
          const waitTime = attempt * 5000; // 5s, 10s wait times
          console.log(`⏳ Waiting ${waitTime/1000}s before next attempt...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    if (finalResult?.success) {
      // Store successful connection attempt info
      await storeConnectionState({
        isConnected: false, // QR generated but not scanned yet
        qrGeneratedAt: Date.now(),
        successfulAttempt: finalResult.attempt,
        timestamp: Date.now()
      });
      
      return NextResponse.json({
        success: true,
        qr: finalResult.qr,
        message: `QR generated successfully on attempt ${finalResult.attempt}`,
        attempts: attempts.length,
        details: attempts
      });
    } else {
      // All attempts failed
      console.log('❌ All attempts failed');
      
      const lastError = attempts[attempts.length - 1];
      const has405Error = attempts.some(a => a.disconnectCode === 405);
      
      return NextResponse.json({
        success: false,
        message: 'QR generation failed after all attempts',
        error: lastError?.error || 'Unknown error',
        attempts: attempts.length,
        has405Error,
        details: attempts,
        recommendation: has405Error 
          ? 'Code 405 detected - this is a known issue with serverless environments. Try again in a few minutes.'
          : 'Connection issues detected. Check network connectivity and try again.'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ Enhanced QR generation failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Enhanced QR generation failed',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 