import { NextRequest, NextResponse } from 'next/server';
import { clearAllAuthData } from '../../lib/redis-auth-state';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Clearing all WhatsApp auth data...');
    
    await clearAllAuthData();
    
    return NextResponse.json({
      success: true,
      message: 'All WhatsApp authentication data cleared successfully'
    });
    
  } catch (error) {
    console.error('❌ Error clearing auth data:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
} 