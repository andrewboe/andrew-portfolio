import { NextRequest, NextResponse } from 'next/server';
import { sendWednesdayReminder, sendSaturdayReminder } from '@/app/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    // Check for secret token to prevent unauthorized tests
    const authorization = req.headers.get('authorization');
    const expectedToken = process.env.RESET_SECRET; // We'll reuse the reset secret for simplicity

    if (!expectedToken) {
      return NextResponse.json(
        { error: 'Server configuration error: RESET_SECRET not set' },
        { status: 500 }
      );
    }

    if (!authorization) {
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      );
    }

    if (authorization !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Invalid authorization token' },
        { status: 401 }
      );
    }

    // Get the message type from the request body
    const { messageType } = await req.json();

    if (!messageType || !['wednesday', 'saturday'].includes(messageType)) {
      return NextResponse.json(
        { error: 'Invalid message type. Must be "wednesday" or "saturday"' },
        { status: 400 }
      );
    }

    // Send the appropriate message
    let result;
    if (messageType === 'wednesday') {
      result = await sendWednesdayReminder();
    } else {
      result = await sendSaturdayReminder();
    }

    return NextResponse.json({
      success: true,
      message: `${messageType === 'wednesday' ? 'Wednesday' : 'Saturday'} WhatsApp message sent successfully`,
      apiResponse: result.response
    });
  } catch (error: unknown) {
    console.error('Error in WhatsApp test endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send WhatsApp message';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 