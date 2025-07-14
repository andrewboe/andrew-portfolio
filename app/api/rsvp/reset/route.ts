import { NextRequest, NextResponse } from 'next/server';
import { resetRSVPs } from '@/app/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    // Check for secret token to prevent unauthorized resets
    const authorization = req.headers.get('authorization');
    const expectedToken = process.env.RESET_SECRET;

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

    // Trigger the reset
    const result = await resetRSVPs();
    
    if (!result.success) {
      console.error('Reset failed:', result.error);
      return NextResponse.json(
        { error: 'Failed to reset RSVPs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Reset complete. Deleted ${result.deletedCount || 0} RSVPs.`
    });
  } catch (error: unknown) {
    console.error('Error in reset endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to reset RSVPs';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 