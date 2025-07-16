import { sendSaturdayReminder } from '@/app/lib/mongodb';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const result = await sendSaturdayReminder();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Saturday reminder cron job failed:', error);
    return NextResponse.json({ error: 'Reminder failed' }, { status: 500 });
  }
} 