import { NextResponse } from 'next/server';
import { getQRCode } from '../../../lib/mongodb';

export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('Fetching WhatsApp QR code...');
    
    const result = await getQRCode();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        qr: result.qr,
        message: 'QR code retrieved successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching QR code:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch QR code',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 