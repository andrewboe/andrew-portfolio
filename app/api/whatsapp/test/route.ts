import { NextResponse } from 'next/server';
import { sendTestMessage } from '../../../lib/mongodb';

export async function POST() {
  try {
    console.log('Testing WhatsApp message via Baileys...');
    
    const result = await sendTestMessage();
    
    return NextResponse.json({
      success: true,
      message: 'Test message sent successfully via Baileys',
      response: result
    });
  } catch (error) {
    console.error('Error testing Baileys integration:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send test message via Baileys',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 