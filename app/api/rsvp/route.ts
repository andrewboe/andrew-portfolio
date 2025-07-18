import { NextResponse } from 'next/server';
import { getAllRSVPs, addOrUpdateRSVP } from '@/app/lib/database-service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { playerName, status, comment } = body;

    // Validate required fields
    if (!playerName || !status) {
      return NextResponse.json(
        { error: 'Player name and status are required' },
        { status: 400 }
      );
    }

    // Map form data to database format
    const rsvpData = {
      name: playerName.trim(),
      status: status,
      comments: comment?.trim() || ''
    };

    const rsvp = await addOrUpdateRSVP(rsvpData);
    return NextResponse.json(rsvp, { status: 201 });
  } catch (error) {
    console.error('RSVP API error:', error);
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