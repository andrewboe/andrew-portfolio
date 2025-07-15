import { sendWednesdayReminder } from '@/app/lib/mongodb';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await sendWednesdayReminder();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Wednesday reminder cron job failed:', error);
    return NextResponse.json({ error: 'Reminder failed' }, { status: 500 });
  }
} 