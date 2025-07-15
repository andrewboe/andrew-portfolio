import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://gate.whapi.cloud/groups', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.WHAPI_TOKEN}`,
        'Content-Type': 'application/json',
      }
    });

    const responseData = await response.json();
    console.log('Whapi.cloud groups response:', responseData);

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

    // Format the response to be more readable
    const groups = responseData.groups || responseData;
    const formattedGroups = Array.isArray(groups) ? groups.map((group: any) => ({
      id: group.id,
      name: group.name || group.subject,
      description: group.description || group.desc,
      participantCount: group.size || group.participants?.length || 0,
      isOwner: group.owner || false
    })) : [];

    return NextResponse.json({
      success: true,
      groups: formattedGroups,
      raw: responseData // Include raw response for debugging
    });
  } catch (error) {
    console.error('Error fetching groups from Whapi.cloud:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch groups',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 