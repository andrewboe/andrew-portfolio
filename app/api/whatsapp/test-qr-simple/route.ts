import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('🧪 Testing simple QR generation...');
    
    // Test the original flow
    const { getQRCode } = await import('../../../lib/mongodb');
    const result = await getQRCode();
    
    console.log('QR result:', { success: result.success, hasQR: !!result.qr, error: result.error });
    
    return NextResponse.json({
      success: result.success,
      qr: result.qr,
      error: result.error,
      test: 'simple QR generation test'
    });
    
  } catch (error) {
    console.error('❌ QR test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'QR test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 