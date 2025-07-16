import { NextResponse } from 'next/server';
import { getConnectionStatus } from '../../../lib/mongodb';

export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('Checking WhatsApp connection status...');
    
    const status = await getConnectionStatus();
    
    return NextResponse.json({
      success: true,
      ...status,
      message: status.isConnected ? 'WhatsApp is connected' : 'WhatsApp is not connected'
    });
  } catch (error) {
    console.error('Error checking connection status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check connection status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 