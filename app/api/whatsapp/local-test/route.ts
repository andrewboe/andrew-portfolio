import { NextResponse } from 'next/server';
import { getQRCode, sendMessage, getConnectionStatus, clearAuthState } from '../../../lib/local-baileys';

export const runtime = 'nodejs';

// Simple admin token check (matching the existing RSVP reset pattern)
function checkAdminAuth(request: Request): boolean {
  const authorization = request.headers.get('authorization');
  const expectedToken = process.env.RESET_SECRET;
  
  if (!expectedToken || !authorization) {
    return false;
  }
  
  return authorization === `Bearer ${expectedToken}`;
}

export async function GET(request: Request) {
  // Check admin authentication
  if (!checkAdminAuth(request)) {
    return NextResponse.json({
      success: false,
      error: 'Unauthorized'
    }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'qr';

  try {
    switch (action) {
      case 'qr':
        console.log('🔄 Generating QR code with local Baileys...');
        const qrResult = await getQRCode();
        return NextResponse.json(qrResult);

      case 'status':
        console.log('🔍 Checking connection status...');
        const statusResult = await getConnectionStatus();
        return NextResponse.json({
          success: true,
          ...statusResult
        });

      case 'clear':
        console.log('🧹 Clearing auth state...');
        const clearResult = await clearAuthState();
        return NextResponse.json(clearResult);

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: qr, status, or clear'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ Local Baileys test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Local Baileys test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // Check admin authentication
  if (!checkAdminAuth(request)) {
    return NextResponse.json({
      success: false,
      error: 'Unauthorized'
    }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { to, message } = body;
    
    // If no 'to' is provided, use the default group ID from environment
    const targetId = to || process.env.WHATSAPP_GROUP_ID;
    const messageText = message || '🤖 Test message from WhatsApp Bot';
    
    if (!targetId) {
      return NextResponse.json({
        success: false,
        error: 'No recipient specified and WHATSAPP_GROUP_ID not configured'
      }, { status: 400 });
    }

    if (!messageText) {
      return NextResponse.json({
        success: false,
        error: 'No message text provided'
      }, { status: 400 });
    }

    console.log(`📤 Sending message to ${targetId}...`);
    const result = await sendMessage(targetId, messageText);
    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Error sending message:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 