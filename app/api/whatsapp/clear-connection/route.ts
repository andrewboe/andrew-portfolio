import { NextResponse } from 'next/server';
import { clearAllAuthData } from '../../../lib/redis-auth-state';

export const runtime = 'nodejs';

export async function POST() {
  try {
    console.log('🧹 Clearing all WhatsApp connections and cached state...');
    
    // Clear Redis auth data
    await clearAllAuthData();
    
    // Import and clear global state from whatsapp-manager
    const { clearGlobalConnection } = await import('../../../lib/whatsapp-manager');
    await clearGlobalConnection();
    
    console.log('✅ All connections and state cleared successfully');
    
    return NextResponse.json({
      success: true,
      message: 'All WhatsApp connections and cached state cleared successfully'
    });
  } catch (error) {
    console.error('❌ Error clearing connections:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to clear connections',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 