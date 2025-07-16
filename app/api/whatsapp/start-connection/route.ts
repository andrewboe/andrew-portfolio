import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  try {
    console.log('🚀 Starting WhatsApp connection process...');
    
    // Import the manager
    const { getWhatsAppConnection } = await import('../../../lib/whatsapp-manager');
    
    // Start the connection process (this runs in background)
    // Don't await it - let it run async
    getWhatsAppConnection().then(() => {
      console.log('✅ Background connection process completed');
    }).catch((error) => {
      console.error('❌ Background connection process failed:', error);
    });
    
    console.log('📡 Connection process started in background');
    
    return NextResponse.json({
      success: true,
      message: 'WhatsApp connection process started. QR code should be available in a few seconds.',
      instructions: [
        '1. Wait 3-5 seconds',
        '2. GET /api/whatsapp/qr-image to get scannable QR',
        '3. Scan QR with your phone',
        '4. Check status with GET /api/whatsapp/status'
      ]
    });
    
  } catch (error) {
    console.error('❌ Error starting connection:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to start connection process',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 