import { NextResponse } from 'next/server';
import { clearAuthState } from '../../../lib/mongodb';

export async function POST() {
  try {
    console.log('Clearing WhatsApp auth state...');
    
    const result = await clearAuthState();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Auth state cleared successfully. You can now generate a new QR code.'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error clearing auth state:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to clear auth state',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 