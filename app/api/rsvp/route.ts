import { NextResponse } from 'next/server';
import { getAllRSVPs, addOrUpdateRSVP } from '@/app/lib/database-service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rsvp = await addOrUpdateRSVP(body);
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
    const rsvps = await getAllRSVPs();
    return NextResponse.json(rsvps);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch RSVPs' },
      { status: 500 }
    );
  }
} 