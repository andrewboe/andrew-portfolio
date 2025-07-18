import { NextResponse } from 'next/server';
import { sendTestMessage, getConnectionStatus } from '../../lib/whatsapp-service';

export const runtime = 'nodejs';

// Simple test route to verify Railway WhatsApp integration
export async function GET() {
  try {
    console.log('🔍 Testing Railway WhatsApp integration...');
    
    // Test connection status first
    const status = await getConnectionStatus();
    console.log('📡 Railway connection status:', status);
    
    return NextResponse.json({
      success: true,
      message: 'Railway integration test completed',
      railwayStatus: status,
      railwayUrl: process.env.RAILWAY_WHATSAPP_URL ? 'configured' : 'missing'
    });
  } catch (error) {
    console.error('❌ Railway integration test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Railway integration test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        railwayUrl: process.env.RAILWAY_WHATSAPP_URL ? 'configured' : 'missing'
      },
      { status: 500 }
    );
  }
}

// Test sending a message through Railway
export async function POST() {
  try {
    console.log('📤 Testing Railway WhatsApp message sending...');
    
    const result = await sendTestMessage();
    
    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Test message sent via Railway!' : 'Failed to send test message',
      details: result
    });
  } catch (error) {
    console.error('❌ Railway message test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Railway message test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 