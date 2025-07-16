import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  try {
    console.log('🔄 Resetting WhatsApp connection cache...');
    
    // Clear the module cache for whatsapp-manager to reset global variables
    const managerPath = require.resolve('../../lib/whatsapp-manager');
    delete require.cache[managerPath];
    
    console.log('✅ WhatsApp connection cache cleared');
    
    return NextResponse.json({
      success: true,
      message: 'WhatsApp connection cache reset successfully',
      action: 'Next connection will use fresh socket with updated credentials'
    });
    
  } catch (error) {
    console.error('❌ Error resetting connection cache:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to reset connection cache',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 