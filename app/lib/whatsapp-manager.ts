import makeWASocket, { 
  Browsers, 
  DisconnectReason,
  WASocket,
  ConnectionState as WAConnectionState
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { 
  useRedisAuthState, 
  storeQRCode, 
  clearQRCode, 
  getStoredQRCode,
  storeConnectionState,
  getConnectionState,
  clearAllAuthData
} from './redis-auth-state';
import { Redis } from '@upstash/redis';

// Global state for caching (in memory, resets with each function call)
let globalSocket: WASocket | null = null;
let globalConnectionPromise: Promise<WASocket> | null = null;
let lastConnectionTime = 0;
const CONNECTION_TIMEOUT = 30000; // 30 seconds

// Add connection logging
async function logConnectionEvent(event: string, data?: any): Promise<void> {
  try {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || process.env.KV_KV_REST_API_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || process.env.KV_KV_REST_API_TOKEN;
    
    if (redisUrl && redisToken) {
      const redis = new Redis({ url: redisUrl, token: redisToken });
      const logs = (await redis.get('whatsapp:connection_logs') as any[]) || [];
      
      logs.push({
        timestamp: Date.now(),
        event,
        data,
        iso: new Date().toISOString()
      });
      
      // Keep only last 20 log entries
      if (logs.length > 20) {
        logs.splice(0, logs.length - 20);
      }
      
      await redis.set('whatsapp:connection_logs', logs, { ex: 3600 }); // 1 hour expiry
    }
  } catch (error) {
    console.error('❌ Error logging connection event:', error);
  }
}

// Create WhatsApp socket connection with enhanced logging
async function createWhatsAppConnection(): Promise<{ success: boolean; socket?: WASocket; error?: string }> {
  try {
    console.log('🔄 Creating new WhatsApp connection...');
    await logConnectionEvent('connection_attempt_start');
    
    const { state, saveCreds } = await useRedisAuthState();
    
    const socket = makeWASocket({
      auth: state,
      browser: Browsers.ubuntu('WhatsApp Bot'),
      connectTimeoutMs: 60000, // 1 minute timeout
      defaultQueryTimeoutMs: 60000,
      printQRInTerminal: false,
      syncFullHistory: false,
      markOnlineOnConnect: false,
      version: [2, 2413, 1], // Specific version for stability
    });
    
    // Enhanced connection event handler with detailed logging
    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      console.log(`📡 Connection update: ${connection}`);
      await logConnectionEvent('connection_update', { 
        connection, 
        hasQR: !!qr,
        disconnectReason: lastDisconnect?.error?.message,
        disconnectCode: (lastDisconnect?.error as Boom)?.output?.statusCode
      });

      if (qr) {
        console.log('📱 QR Code generated');
        await logConnectionEvent('qr_generated');
        try {
          await storeQRCode(qr);
          console.log('✅ QR stored successfully');
          await logConnectionEvent('qr_stored');
        } catch (error) {
          console.error('❌ Failed to store QR:', error);
          await logConnectionEvent('qr_store_failed', { error: (error as Error).message });
        }
      }

      if (connection === 'open') {
        console.log('✅ WhatsApp connected successfully');
        await logConnectionEvent('connection_open', { 
          socketUser: socket.user?.id,
          socketName: socket.user?.name 
        });
        
        try {
          await storeConnectionState({ 
            isConnected: true, 
            connectedAt: Date.now(),
            socketId: socket.user?.id || 'unknown'
          });
          console.log('✅ Connection state saved to Redis');
          await logConnectionEvent('connection_state_saved');
        } catch (error) {
          console.error('❌ Failed to save connection state:', error);
          await logConnectionEvent('connection_state_save_failed', { error: (error as Error).message });
        }
        
        // Clear QR code since we're connected
        try {
          await clearQRCode();
          console.log('✅ QR code cleared');
          await logConnectionEvent('qr_cleared');
        } catch (error) {
          console.error('❌ Failed to clear QR:', error);
          await logConnectionEvent('qr_clear_failed', { error: (error as Error).message });
        }
        
      } else if (connection === 'close') {
        console.log('❌ WhatsApp connection closed');
        
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        const disconnectReason = lastDisconnect?.error?.message || 'unknown';
        
        await logConnectionEvent('connection_close', { 
          shouldReconnect,
          disconnectReason,
          disconnectCode: (lastDisconnect?.error as Boom)?.output?.statusCode
        });
        
        await storeConnectionState({ 
          isConnected: false, 
          disconnectedAt: Date.now(),
          disconnectReason
        });
        
        console.log('🔍 Should reconnect:', shouldReconnect);
        console.log('🔍 Disconnect reason:', disconnectReason);
        
        // Reset global state
        globalSocket = null;
        globalConnectionPromise = null;
      } else if (connection === 'connecting') {
        console.log('🔄 WhatsApp connecting...');
        await logConnectionEvent('connection_connecting');
      }
    });

    // Enhanced credential update handler
    socket.ev.on('creds.update', async () => {
      console.log('🔐 Credentials updated, saving to Redis...');
      await logConnectionEvent('creds_update_start');
      
      try {
        await saveCreds();
        console.log('✅ Credentials saved successfully');
        await logConnectionEvent('creds_saved');
      } catch (error) {
        console.error('❌ Failed to save credentials:', error);
        await logConnectionEvent('creds_save_failed', { error: (error as Error).message });
      }
    });

    await logConnectionEvent('socket_created');
    return { success: true, socket };
  } catch (error) {
    console.error('❌ Error creating WhatsApp connection:', error);
    await logConnectionEvent('connection_error', { error: (error as Error).message });
    return { success: false, error: (error as Error).message };
  }
}

// Get or create WhatsApp connection with smart caching
export async function getWhatsAppConnection(): Promise<WASocket> {
  console.log('🔍 Getting WhatsApp connection...');
  
  // Check if we have a recent global connection
  if (globalSocket && (Date.now() - lastConnectionTime) < CONNECTION_TIMEOUT) {
    console.log('✅ Using cached connection');
    return globalSocket;
  }

  // If there's already a connection promise in progress, wait for it
  if (globalConnectionPromise) {
    console.log('⏳ Waiting for existing connection promise...');
    try {
      return await globalConnectionPromise;
    } catch (error) {
      console.error('❌ Connection promise failed:', error);
      globalConnectionPromise = null;
    }
  }

  // Create new connection
  globalConnectionPromise = (async () => {
    const result = await createWhatsAppConnection();
    if (result.success && result.socket) {
      globalSocket = result.socket;
      lastConnectionTime = Date.now();
      return result.socket;
    } else {
      throw new Error(result.error || 'Failed to create connection');
    }
  })();

  try {
    return await globalConnectionPromise;
  } catch (error) {
    globalConnectionPromise = null;
    throw error;
  }
}

// Check if WhatsApp connection is ready (serverless-friendly)
export async function isConnectionReady(): Promise<boolean> {
  try {
    const state = await getConnectionState();
    
    // Check Redis state first
    if (!state.isConnected) {
      console.log('❌ Redis shows not connected');
      return false;
    }
    
    // Check if connection is recent (within last hour)
    const timeSinceConnection = Date.now() - (state.connectedAt || 0);
    if (timeSinceConnection > 3600000) { // 1 hour
      console.log('⚠️ Connection is stale (over 1 hour old)');
      await storeConnectionState({ 
        isConnected: false, 
        disconnectedAt: Date.now(),
        reason: 'stale_connection'
      });
      return false;
    }
    
    console.log(`✅ Redis shows connected (${Math.floor(timeSinceConnection / 1000)}s ago)`);
    return true;
    
    // Note: In serverless environment, we rely on Redis state rather than trying to verify active socket
    // The socket verification was causing false negatives because sockets don't persist between function calls
  } catch (error) {
    console.error('❌ Error checking connection readiness:', error);
    return false;
  }
}

// Send a message with automatic connection handling
export async function sendMessage(groupId: string, message: string): Promise<{success: boolean; messageId?: string; error?: string}> {
  try {
    console.log(`📤 Attempting to send message to ${groupId}`);
    
    // Check if connection is ready
    const isReady = await isConnectionReady();
    if (!isReady) {
      console.log('❌ Connection not ready, attempting to reconnect...');
      return { success: false, error: 'WhatsApp connection not ready' };
    }
    
    const socket = await getWhatsAppConnection();
    const result = await socket.sendMessage(groupId, { text: message });
    
    console.log('✅ Message sent successfully');
    return { 
      success: true, 
      messageId: result?.key?.id || 'unknown'
    };
    
  } catch (error) {
    console.error('❌ Error sending message:', error);
    return { 
      success: false, 
      error: (error as Error).message 
    };
  }
}

// Get QR code for authentication with enhanced timeout and logging
export async function getQRForAuth(): Promise<{success: boolean; qr?: string; error?: string}> {
  try {
    console.log('📱 Getting QR code for authentication...');
    await logConnectionEvent('qr_request_start');
    
    // Start connection process
    const socket = await getWhatsAppConnection();
    
    // Wait for QR code to be generated and stored
    const maxAttempts = 60; // 60 seconds max wait
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      const qr = await getStoredQRCode();
      if (qr) {
        console.log(`✅ QR generated after ${attempt + 1} seconds`);
        await logConnectionEvent('qr_retrieved', { attempt: attempt + 1 });
        return { success: true, qr };
      }
      
      // Log progress every 10 seconds
      if ((attempt + 1) % 10 === 0) {
        console.log(`⏳ Still waiting for QR... ${attempt + 1}/${maxAttempts} attempts`);
        await logConnectionEvent('qr_wait_progress', { attempt: attempt + 1 });
      }
    }
    
    await logConnectionEvent('qr_timeout');
    return { success: false, error: 'QR generation timed out' };
  } catch (error) {
    console.error('❌ Error getting QR code:', error);
    await logConnectionEvent('qr_error', { error: (error as Error).message });
    return { success: false, error: (error as Error).message };
  }
}

// Clear all authentication data
export async function clearAuthData(): Promise<{success: boolean; message?: string; error?: string}> {
  try {
    console.log('🧹 Clearing all authentication data...');
    await logConnectionEvent('clear_auth_start');
    
    // Clear Redis data
    await clearAllAuthData();
    
    // Reset global state
    globalSocket = null;
    globalConnectionPromise = null;
    lastConnectionTime = 0;
    
    console.log('✅ All authentication data cleared');
    await logConnectionEvent('clear_auth_complete');
    return { success: true, message: 'Authentication data cleared successfully' };
  } catch (error) {
    console.error('❌ Error clearing auth data:', error);
    await logConnectionEvent('clear_auth_error', { error: (error as Error).message });
    return { success: false, error: (error as Error).message };
  }
}

// Get current connection status
export async function getConnectionStatus(): Promise<{
  isConnected: boolean;
  hasSocket: boolean;
  connected: boolean; // For compatibility
  lastConnected?: number;
  socketUser?: string;
}> {
  try {
    const redisState = await getConnectionState();
    const hasSocket = !!globalSocket;
    const isConnected = await isConnectionReady();
    
    return {
      isConnected,
      hasSocket,
      connected: isConnected, // For compatibility with existing code
      lastConnected: redisState.connectedAt,
      socketUser: redisState.socketId,
    };
  } catch (error) {
    console.error('❌ Error getting connection status:', error);
    return {
      isConnected: false,
      hasSocket: false,
      connected: false,
    };
  }
} 