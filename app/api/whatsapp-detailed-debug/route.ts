import { NextResponse } from 'next/server';
import makeWASocket, { Browsers, DisconnectReason, WAConnectionState } from '@whiskeysockets/baileys';
import { useRedisAuthState, getConnectionState, storeConnectionState } from '../../lib/redis-auth-state';
import { Redis } from '@upstash/redis';

export const runtime = 'nodejs';

// Type definitions for debug events
interface ConnectionUpdateEvent {
  timestamp: number;
  connection: WAConnectionState | undefined;
  hasQR: boolean;
  disconnectCode: any;
  disconnectMessage: string | undefined;
}

interface CredentialUpdateEvent {
  timestamp: number;
  event: 'creds.update';
  credsUpdated: string[];
}

type ConnectionEvent = ConnectionUpdateEvent | CredentialUpdateEvent;

interface DebugResult {
  socketCreated: boolean;
  connectionEvents: ConnectionEvent[];
  finalState: 'pending' | 'success' | 'failed' | 'timeout';
  errorDetails: {
    code: any;
    message: string | undefined;
  } | null;
}

interface FailedConnectionResult {
  socketCreated: false;
  error: string;
}

function getRedisClient(): Redis {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || process.env.KV_KV_REST_API_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || process.env.KV_KV_REST_API_TOKEN;
  
  return new Redis({
    url: redisUrl,
    token: redisToken,
  });
}

export async function GET() {
  try {
    console.log('🔍 Detailed WhatsApp connection debugging...');
    
    const redis = getRedisClient();
    
    // Get all WhatsApp-related data from Redis
    const [connectionState, storedCreds, storedKeys, qrCode, logs] = await Promise.all([
      redis.get('whatsapp:connection_state'),
      redis.get('whatsapp:creds'),
      redis.get('whatsapp:keys'), 
      redis.get('whatsapp:qr'),
      redis.get('whatsapp:connection_logs')
    ]);
    
    console.log('📋 Retrieved Redis data');
    
    // Try to create a connection to see what happens
    let connectionAttemptResult: DebugResult | FailedConnectionResult | null = null;
    let detectedIssues: string[] = [];
    
    try {
      console.log('🔄 Attempting connection with stored credentials...');
      
      const { state, saveCreds } = await useRedisAuthState();
      
      // Check credential completeness
      const hasNoiseKey = !!(state.creds as any)?.noiseKey;
      const hasSignedIdentityKey = !!(state.creds as any)?.signedIdentityKey;
      const hasSignedPreKey = !!(state.creds as any)?.signedPreKey;
      const hasRegistrationId = !!(state.creds as any)?.registrationId;
      
      console.log('🔍 Credential analysis:', {
        hasNoiseKey,
        hasSignedIdentityKey, 
        hasSignedPreKey,
        hasRegistrationId
      });
      
      if (!hasNoiseKey) detectedIssues.push('Missing noiseKey - core authentication credential');
      if (!hasSignedIdentityKey) detectedIssues.push('Missing signedIdentityKey - identity verification credential');
      if (!hasSignedPreKey) detectedIssues.push('Missing signedPreKey - encryption credential');
      if (!hasRegistrationId) detectedIssues.push('Missing registrationId - device identifier');
      
      // Try creating socket
      const socket = makeWASocket({
        auth: state,
        browser: Browsers.ubuntu('Debug Bot'),
        connectTimeoutMs: 30000, // Shorter timeout for debugging
        defaultQueryTimeoutMs: 30000,
        printQRInTerminal: false,
        syncFullHistory: false,
        markOnlineOnConnect: false,
      });
      
      let debugResult: DebugResult = {
        socketCreated: true,
        connectionEvents: [],
        finalState: 'pending',
        errorDetails: null
      };
      
      // Monitor connection for 20 seconds
      const connectionPromise = new Promise((resolve) => {
        const timeout = setTimeout(() => {
          socket.end(new Error('Debug timeout'));
          debugResult.finalState = 'timeout';
          resolve(debugResult);
        }, 20000);
        
        socket.ev.on('connection.update', async (update) => {
          const { connection, lastDisconnect, qr } = update;
          
          debugResult.connectionEvents.push({
            timestamp: Date.now(),
            connection,
            hasQR: !!qr,
            disconnectCode: (lastDisconnect?.error as any)?.output?.statusCode,
            disconnectMessage: lastDisconnect?.error?.message
          });
          
          if (connection === 'open') {
            clearTimeout(timeout);
            socket.end(new Error('Debug complete - connection successful'));
            debugResult.finalState = 'success';
            resolve(debugResult);
          } else if (connection === 'close') {
            clearTimeout(timeout);
            socket.end(new Error('Debug complete - connection failed'));
            debugResult.finalState = 'failed';
            debugResult.errorDetails = {
              code: (lastDisconnect?.error as any)?.output?.statusCode,
              message: lastDisconnect?.error?.message
            };
            resolve(debugResult);
          }
        });
        
        socket.ev.on('creds.update', (creds) => {
          debugResult.connectionEvents.push({
            timestamp: Date.now(),
            event: 'creds.update',
            credsUpdated: Object.keys(creds || {})
          } as CredentialUpdateEvent);
        });
      });
      
      connectionAttemptResult = await connectionPromise;
      
    } catch (error) {
      connectionAttemptResult = {
        socketCreated: false,
        error: error instanceof Error ? error.message : String(error)
      } as FailedConnectionResult;
      detectedIssues.push(`Socket creation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Analyze the stored credentials structure
    let credentialAnalysis: {
      hasNoiseKey: boolean;
      hasSignedIdentityKey: boolean;
      hasSignedPreKey: boolean;
      hasRegistrationId: boolean;
      accountId: string;
      platform: string;
      credentialKeys: string[];
    } | { error: string } | null = null;
    if (storedCreds) {
      try {
        const creds = typeof storedCreds === 'string' ? JSON.parse(storedCreds) : storedCreds;
        credentialAnalysis = {
          hasNoiseKey: !!(creds as any)?.noiseKey,
          hasSignedIdentityKey: !!(creds as any)?.signedIdentityKey,
          hasSignedPreKey: !!(creds as any)?.signedPreKey,
          hasRegistrationId: !!(creds as any)?.registrationId,
          accountId: (creds as any)?.me?.id || 'unknown',
          platform: (creds as any)?.platform || 'unknown',
          credentialKeys: Object.keys(creds || {}),
        };
      } catch (error) {
        credentialAnalysis = { error: 'Failed to parse credentials' };
        detectedIssues.push('Stored credentials are corrupted or invalid');
      }
    }
    
    // Check if we need QR vs should auto-connect
    let shouldNeedQR: boolean = !storedCreds || detectedIssues.length > 0;
    
    if (connectionAttemptResult && 'finalState' in connectionAttemptResult && connectionAttemptResult.finalState === 'failed' && connectionAttemptResult.errorDetails?.code === 515) {
      detectedIssues.push('Code 515 detected - Stream error during connection. This indicates network/serverless timeout issues.');
    }
    
    if (connectionAttemptResult && 'finalState' in connectionAttemptResult && connectionAttemptResult.finalState === 'failed' && connectionAttemptResult.errorDetails?.code === 405) {
      detectedIssues.push('Code 405 detected - Connection failure. Common in serverless environments with network restrictions.');
    }
    
    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      redisData: {
        hasConnectionState: !!connectionState,
        hasStoredCreds: !!storedCreds,
        hasStoredKeys: !!storedKeys,
        hasQRCode: !!qrCode,
        hasLogs: !!logs
      },
      credentialAnalysis,
      connectionAttemptResult,
      detectedIssues,
      shouldNeedQR,
      recommendations: detectedIssues.length > 0 ? [
        'Clear auth data and start fresh if credentials are corrupted',
        'Try generating new QR code if authentication is incomplete',
        'Check network connectivity and serverless timeouts for code 515/405'
      ] : [
        'Credentials appear valid - connection issues may be network/serverless related',
        'Try the connection again as serverless environments can have intermittent issues',
        'Consider implementing retry logic for failed connections'
      ]
    });
    
  } catch (error) {
    console.error('❌ Detailed debug failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Detailed debugging failed',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 