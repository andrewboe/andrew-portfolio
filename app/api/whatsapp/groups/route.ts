import { NextResponse } from 'next/server';
import { getWhatsAppGroups } from '../../../lib/mongodb';

export async function GET() {
  try {
    console.log('Fetching WhatsApp groups via Baileys...');
    
    const result = await getWhatsAppGroups();
    
    return NextResponse.json({
      success: true,
      groups: result.groups,
      message: 'Groups fetched successfully via Baileys'
    });
  } catch (error) {
    console.error('Error fetching groups from Baileys:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch groups via Baileys',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 