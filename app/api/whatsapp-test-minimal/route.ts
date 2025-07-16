import { NextRequest, NextResponse } from 'next/server';
import makeWASocket, { Browsers, initAuthCreds } from '@whiskeysockets/baileys';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const logs: string[] = [];
  const addLog = (message: string) => {
    console.log(message);
    logs.push(`${new Date().toISOString()}: ${message}`);
  };

  try {
    addLog('🔍 Testing minimal Baileys setup (NO REDIS)...');
    
    // Test 1: Can we create auth credentials?
    addLog('📋 Testing initAuthCreds()...');
    const creds = initAuthCreds();
    addLog(`✅ initAuthCreds() created: ${typeof creds}`);
    
    // Test 2: Inspect the credentials
    const credsInfo = {
      hasNoiseKey: !!creds.noiseKey,
      hasSignedIdentityKey: !!creds.signedIdentityKey,
      hasSignedPreKey: !!creds.signedPreKey,
      registrationId: creds.registrationId,
      platform: creds.platform
    };
    addLog(`🔍 Credentials info: ${JSON.stringify(credsInfo)}`);
    
    // Test 3: Can we create a basic auth state?
    addLog('📋 Testing auth state creation...');
    const authState = {
      creds,
      keys: {
        get: () => ({}),
        set: () => {}
      }
    };
    addLog('✅ Auth state created successfully');
    
    // Test 4: Can we create a socket?
    addLog('🔄 Testing socket creation...');
    const socket = makeWASocket({
      auth: authState,
      browser: Browsers.ubuntu('Minimal Test'),
      connectTimeoutMs: 10000, // Short timeout
      defaultQueryTimeoutMs: 5000,
      printQRInTerminal: false, // Don't print to avoid noise
      syncFullHistory: false,
      markOnlineOnConnect: false,
    });
    
    addLog('✅ Socket created successfully');
    
    // Test 5: Set up basic event listener
    let connectionError = '';
    let connectionStatus = 'unknown';
    
    socket.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect } = update;
      connectionStatus = connection || 'unknown';
      addLog(`📡 Connection update: ${connection}`);
      
      if (connection === 'close' && lastDisconnect?.error) {
        connectionError = lastDisconnect.error.message;
        addLog(`❌ Connection error: ${connectionError}`);
      }
    });
    
    // Test 6: Wait briefly to see what happens
    addLog('⏳ Waiting 5 seconds to observe connection...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Cleanup
    socket.end(undefined);
    addLog('🧹 Socket closed');
    
    return NextResponse.json({
      success: connectionError === '',
      message: connectionError === '' ? 'Minimal Baileys test successful' : 'Connection failed',
      connectionError,
      connectionStatus,
      credsInfo,
      logs,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    });
    
  } catch (error) {
    addLog(`❌ Test error: ${(error as Error).message}`);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      stack: (error as Error).stack,
      logs,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    }, { status: 500 });
  }
} 