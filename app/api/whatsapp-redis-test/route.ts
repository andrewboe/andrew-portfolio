import { NextRequest, NextResponse } from 'next/server';
import { useRedisAuthState } from '../../lib/redis-auth-state';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing WhatsApp Redis integration...');
    
    // Test Redis auth state creation
    const authResult = await useRedisAuthState();
    console.log('✅ Redis auth state created successfully');
    
    // Test basic auth state functionality
    const hasCredentials = !!authResult.state.creds;
    const hasKeys = !!authResult.state.keys;
    
    console.log('Auth state details:', {
      hasCredentials,
      hasKeys,
      credsType: typeof authResult.state.creds,
      saveCreds: typeof authResult.saveCreds
    });
    
    // Test save function
    await authResult.saveCreds();
    console.log('✅ Save credentials function works');
    
    return NextResponse.json({
      success: true,
      message: 'WhatsApp Redis integration working correctly',
      authState: {
        hasCredentials,
        hasKeys,
        credsType: typeof authResult.state.creds,
        saveFunctionAvailable: typeof authResult.saveCreds === 'function'
      },
      redis: {
        connectionWorking: true,
        authStateCreated: true,
        saveFunction: 'working'
      }
    });
    
  } catch (error) {
    console.error('❌ WhatsApp Redis integration error:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      stack: (error as Error).stack,
      step: 'WhatsApp Redis integration test'
    }, { status: 500 });
  }
} 