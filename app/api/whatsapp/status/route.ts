import { NextResponse } from 'next/server';
import { getConnectionStatus } from '../../../lib/mongodb';
import { getConnectionState } from '../../../lib/redis-auth-state';

export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('Checking WhatsApp connection status...');
    
    // Get basic connection status
    const status = await getConnectionStatus();
    
    // Get detailed Redis state for error information
    const redisState = await getConnectionState();
    
    // Enhanced response with detailed information
    const response = {
      success: true,
      ...status,
      message: status.isConnected ? 'WhatsApp is connected' : 'WhatsApp is not connected',
      
      // Add detailed error information
      details: {
        isConnected: redisState.isConnected || false,
        connectedAt: redisState.connectedAt || null,
        disconnectedAt: redisState.disconnectedAt || null,
        disconnectReason: redisState.disconnectReason || null,
        lastUpdate: redisState.timestamp || null,
        
        // Calculate time since last event
        timeSinceLastEvent: redisState.timestamp ? 
          Math.floor((Date.now() - redisState.timestamp) / 1000) : null,
          
        // Human readable timestamps
        connectedAtFormatted: redisState.connectedAt ? 
          new Date(redisState.connectedAt).toLocaleString() : null,
        disconnectedAtFormatted: redisState.disconnectedAt ? 
          new Date(redisState.disconnectedAt).toLocaleString() : null
      }
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error checking connection status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check connection status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 