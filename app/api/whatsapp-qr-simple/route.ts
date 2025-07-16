import { NextResponse } from 'next/server';
import makeWASocket, { Browsers } from '@whiskeysockets/baileys';
import { useRedisAuthState, storeQRCode, getStoredQRCode } from '../../lib/redis-auth-state';

export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('🔍 Simple QR generation test...');
    
    // Check for existing QR first
    const existingQR = await getStoredQRCode();
    if (existingQR) {
      console.log('✅ Found existing QR');
      return NextResponse.json({
        success: true,
        qr: existingQR,
        message: 'Existing QR code retrieved'
      });
    }
    
    // Get auth state
    const { state } = await useRedisAuthState();
    
    // Create minimal socket
    const socket = makeWASocket({
      auth: state,
      browser: Browsers.ubuntu('Simple Test'),
      printQRInTerminal: false,
      syncFullHistory: false,
      markOnlineOnConnect: false,
    });
    
    console.log('✅ Socket created');
    
    // Simple QR handler
    let qrReceived = false;
    socket.ev.on('connection.update', async (update) => {
      const { qr } = update;
      if (qr && !qrReceived) {
        qrReceived = true;
        console.log('📱 QR received, storing...');
        try {
          await storeQRCode(qr);
          console.log('✅ QR stored successfully');
        } catch (error) {
          console.error('❌ QR storage failed:', error);
        }
      }
    });
    
    // Wait for QR with shorter timeout
    for (let i = 0; i < 30; i++) { // 30 seconds max
      await new Promise(resolve => setTimeout(resolve, 1000));
      const qr = await getStoredQRCode();
      if (qr) {
        console.log(`✅ QR generated after ${i + 1} seconds`);
        // Close socket to prevent memory leaks
        socket.end(new Error('QR generation complete'));
        return NextResponse.json({
          success: true,
          qr,
          message: `QR generated successfully after ${i + 1} seconds`
        });
      }
    }
    
    console.log('❌ QR generation timeout');
    socket.end(new Error('QR generation timeout'));
    return NextResponse.json({
      success: false,
      error: 'QR generation timed out after 30 seconds'
    }, { status: 408 });
    
  } catch (error) {
    console.error('❌ Simple QR generation error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    }, { status: 500 });
  }
} 