import { NextResponse } from 'next/server';
import { getStoredQRCode } from '../../../lib/redis-auth-state';

export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('Getting QR code as image...');
    
    // Get the QR string from Redis
    const qrString = await getStoredQRCode();
    
    if (!qrString) {
      return NextResponse.json({
        success: false,
        error: 'No QR code available. Please start a connection first.'
      }, { status: 404 });
    }
    
    // Import QR code library
    const QRCode = require('qrcode');
    
    // Generate QR code as PNG buffer
    const qrBuffer = await QRCode.toBuffer(qrString, {
      type: 'png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    // Return as image
    return new NextResponse(qrBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache',
      },
    });
    
  } catch (error) {
    console.error('Error generating QR image:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate QR image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 