import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Test message
    const testMessage = "🧪 Test message from your softball RSVP app! This is working correctly.";
    
    const response = await fetch('https://gate.whapi.cloud/messages/text', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: process.env.WHATSAPP_GROUP_ID,
        body: testMessage
      })
    });

    const responseData = await response.json();
    console.log('Whapi.cloud test response:', responseData);

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Whapi.cloud API Error (${response.status})`,
          details: responseData
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Test message sent successfully',
      response: responseData
    });
  } catch (error) {
    console.error('Error testing Whapi.cloud integration:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send test message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 