import { resetRSVPs } from '@/app/lib/database-service';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await resetRSVPs();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Reset cron job failed:', error);
    return NextResponse.json({ error: 'Reset failed' }, { status: 500 });
  }
} 