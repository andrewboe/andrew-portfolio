import { NextRequest, NextResponse } from 'next/server';
import makeWASocket, { Browsers } from '@whiskeysockets/baileys';
import { useRedisAuthState, storeQRCode, getStoredQRCode } from '../../lib/redis-auth-state';

export async function GET(request: NextRequest) {
  const logs: string[] = [];
  const addLog = (message: string) => {
    console.log(message);
    logs.push(`${new Date().toISOString()}: ${message}`);
  };

  try {
    addLog('🔍 Starting WhatsApp socket debug...');
    
    // Clear any existing QR
    await storeQRCode('');
    addLog('🧹 Cleared existing QR');
    
    // Get auth state
    const { state, saveCreds } = await useRedisAuthState();
    addLog('✅ Redis auth state created');
    
    // Create socket with minimal config for testing
    addLog('🔄 Creating WhatsApp socket...');
    const socket = makeWASocket({
      auth: state,
      browser: Browsers.ubuntu('Debug Bot'),
      connectTimeoutMs: 30000,
      defaultQueryTimeoutMs: 15000,
      printQRInTerminal: true, // Enable console QR for debugging
      syncFullHistory: false,
      markOnlineOnConnect: false,
    });
    
    addLog('✅ WhatsApp socket created successfully');
    
    // Track events
    let qrReceived = false;
    let connectionStatus = 'unknown';
    
    // Set up event listeners with detailed logging
    socket.ev.on('creds.update', () => {
      addLog('🔐 Credentials updated');
      saveCreds();
    });
    
    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      addLog(`📡 Connection update: ${JSON.stringify({ connection, hasQr: !!qr, hasDisconnect: !!lastDisconnect })}`);
      
      connectionStatus = connection || 'unknown';
      
      if (qr) {
        addLog('📱 QR Code received! Storing in Redis...');
        qrReceived = true;
        try {
          await storeQRCode(qr);
          addLog('✅ QR stored successfully in Redis');
          
          // Verify storage
          const storedQr = await getStoredQRCode();
          addLog(`🔍 QR verification: ${storedQr ? 'Found in Redis' : 'NOT found in Redis'}`);
        } catch (error) {
          addLog(`❌ Failed to store QR: ${(error as Error).message}`);
        }
      }
      
      if (connection === 'open') {
        addLog('✅ WhatsApp connected successfully');
      } else if (connection === 'close') {
        addLog('❌ WhatsApp connection closed');
        if (lastDisconnect?.error) {
          addLog(`🔍 Disconnect reason: ${lastDisconnect.error.message}`);
        }
      }
    });
    
    // Wait for QR or connection with timeout
    addLog('⏳ Waiting for QR generation or connection...');
    const timeout = 45000; // 45 seconds
    const pollInterval = 2000; // 2 seconds
    const maxAttempts = timeout / pollInterval;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
      // Check if QR was generated
      const storedQr = await getStoredQRCode();
      if (storedQr) {
        addLog(`✅ QR found after ${(attempt + 1) * 2} seconds`);
        
        // Clean up
        socket.end(undefined);
        
        return NextResponse.json({
          success: true,
          message: 'QR generated successfully',
          qr: storedQr.substring(0, 50) + '...', // Show partial QR for verification
          logs,
          timing: `${(attempt + 1) * 2} seconds`,
          events: {
            qrReceived,
            connectionStatus
          }
        });
      }
      
      addLog(`⏳ Attempt ${attempt + 1}/${maxAttempts} - No QR yet, connection: ${connectionStatus}`);
    }
    
    // Cleanup
    socket.end(undefined);
    
    return NextResponse.json({
      success: false,
      error: 'QR generation timed out during debug',
      logs,
      events: {
        qrReceived,
        connectionStatus
      }
    }, { status: 408 });
    
  } catch (error) {
    addLog(`❌ Debug error: ${(error as Error).message}`);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      stack: (error as Error).stack,
      logs
    }, { status: 500 });
  }
} 