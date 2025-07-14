import { NextResponse } from 'next/server';
import { connectDB, RSVP } from '@/app/lib/mongodb';

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const rsvp = await RSVP.create(body);
    return NextResponse.json(rsvp, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create RSVP' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    const rsvps = await RSVP.find().sort({ createdAt: -1 });
    return NextResponse.json(rsvps);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch RSVPs' },
      { status: 500 }
    );
  }
} 