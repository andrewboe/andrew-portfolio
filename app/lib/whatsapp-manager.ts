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
const CONNECTION_TIMEOUT = 60000; // 60 seconds - allow time for full handshake

// Add connection logging (non-blocking, with proper error handling)
async function logConnectionEvent(event: string, data?: any): Promise<void> {
  try {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || process.env.KV_KV_REST_API_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || process.env.KV_KV_REST_API_TOKEN;
    
    if (!redisUrl || !redisToken) {
      // Silently skip logging if Redis not configured
      return;
    }

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
  } catch (error) {
    // Silent failure - don't break the connection process if logging fails
    console.warn('⚠️ Logging failed (non-critical):', error instanceof Error ? error.message : String(error));
  }
}

// Create WhatsApp socket connection with enhanced logging
async function createWhatsAppConnection(): Promise<{ success: boolean; socket?: WASocket; error?: string }> {
  try {
    const startTime = Date.now();
    console.log('🔄 Creating new WhatsApp connection...');
    await logConnectionEvent('connection_attempt_start');
    
    console.log(`⏱️  [${Date.now() - startTime}ms] Step 1: Getting auth state...`);
    const { state, saveCreds } = await useRedisAuthState();
    console.log(`⏱️  [${Date.now() - startTime}ms] Step 2: Auth state loaded, creating socket...`);
    
    const socket = makeWASocket({
      auth: state,
      browser: Browsers.ubuntu('WhatsApp Bot'),
      connectTimeoutMs: 60000, // 60 seconds - extended for full handshake
      defaultQueryTimeoutMs: 45000, // 45 seconds for queries
      keepAliveIntervalMs: 30000, // 30 seconds
      qrTimeout: 300000, // 5 minutes for QR timeout
      retryRequestDelayMs: 5000, // 5 seconds between retries
      maxMsgRetryCount: 3, // Limit retry attempts
      printQRInTerminal: false,
      syncFullHistory: false,
      markOnlineOnConnect: false,
      emitOwnEvents: false, // Don't emit events for our own actions
      // Additional settings for serverless stability
      fireInitQueries: true, // Ensure initialization queries are sent
      generateHighQualityLinkPreview: false, // Disable to reduce processing
    });
    
    console.log(`⏱️  [${Date.now() - startTime}ms] Step 3: Socket created, setting up event handlers...`);
    
    // Enhanced connection event handler with detailed logging
    socket.ev.on('connection.update', async (update) => {
      try {
        console.log(`⏱️  [${Date.now() - startTime}ms] Connection update event: ${JSON.stringify(update.connection)}`);
        await logConnectionEvent('connection_update', update);
        
        const { connection, lastDisconnect, qr, receivedPendingNotifications } = update;
        
        if (qr) {
          console.log(`⏱️  [${Date.now() - startTime}ms] QR Code received - storing...`);
          await logConnectionEvent('qr_generated');
          await storeQRCode(qr);
          await logConnectionEvent('qr_stored');
          console.log(`⏱️  [${Date.now() - startTime}ms] QR Code stored successfully`);
        }
        
        if (connection === 'connecting') {
          console.log(`⏱️  [${Date.now() - startTime}ms] Status: Connecting to WhatsApp...`);
          await logConnectionEvent('connection_connecting');
        }
        
        if (connection === 'open') {
          console.log(`⏱️  [${Date.now() - startTime}ms] SUCCESS: WhatsApp connected!`);
          await logConnectionEvent('connection_open');
          
          // Clear any existing QR code
          await clearQRCode();
          
          // Store successful connection state
          await storeConnectionState({
            isConnected: true,
            connectedAt: Date.now(),
            timestamp: Date.now()
          });
          
          globalSocket = socket;
          lastConnectionTime = Date.now();
        }
        
        if (connection === 'close') {
          const reason = lastDisconnect?.error;
          const statusCode = (reason as any)?.output?.statusCode;
          
          console.log(`❌ Connection closed. Status code: ${statusCode}`);
          
          // Handle different disconnect reasons
          let shouldReconnect = false;
          let disconnectReason = 'Unknown';
          
          if (statusCode === 405) {
            // Disconnect code 405 - Connection Failure (common in serverless)
            disconnectReason = 'Connection Failure (405) - Serverless timeout or network issue';
            shouldReconnect = true; // We can try to reconnect for 405 errors
            console.log('🔄 Code 405 detected - will retry with longer timeout');
          } else if (statusCode === DisconnectReason.loggedOut) {
            disconnectReason = 'Logged Out';
            shouldReconnect = false;
            console.log('🚪 Logged out - clearing auth data');
            await clearAllAuthData();
          } else if (statusCode === DisconnectReason.restartRequired) {
            disconnectReason = 'Restart Required';
            shouldReconnect = true;
            console.log('🔄 Restart required');
          } else if (statusCode === DisconnectReason.timedOut) {
            disconnectReason = 'Timed Out';
            shouldReconnect = true;
            console.log('⏰ Connection timed out');
          } else {
            disconnectReason = `Unknown (${statusCode})`;
            shouldReconnect = true; // Default to reconnect for unknown errors
          }
          
          await logConnectionEvent('connection_close', {
            shouldReconnect,
            disconnectReason,
            disconnectCode: statusCode
          });
          
          // Store disconnection state
          await storeConnectionState({
            isConnected: false,
            disconnectedAt: Date.now(),
            disconnectReason,
            timestamp: Date.now()
          });
          
          // Clear global socket
          globalSocket = null;
          globalConnectionPromise = null;
          
          if (shouldReconnect) {
            console.log(`🔄 Will attempt to reconnect after disconnect: ${disconnectReason}`);
            // For serverless, we don't auto-reconnect here as the function will end
            // Reconnection will happen on the next QR request
          }
        }
      } catch (error) {
        console.error('❌ Error in connection.update handler:', error);
        await logConnectionEvent('connection_update_error', { 
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });

    // Enhanced credential update handler with retry logic
    socket.ev.on('creds.update', async () => {
      console.log(`⏱️  [${Date.now() - startTime}ms] Credentials updated - saving to Redis...`);
      await logConnectionEvent('creds_update_start');
      
      // Retry logic for credential saving (critical for handshake success)
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          await saveCreds();
          console.log(`⏱️  [${Date.now() - startTime}ms] Credentials saved successfully (attempt ${retryCount + 1})`);
          await logConnectionEvent('creds_saved', { attempt: retryCount + 1 });
          break; // Success - exit retry loop
        } catch (error) {
          retryCount++;
          console.error(`⏱️  [${Date.now() - startTime}ms] Failed to save credentials (attempt ${retryCount}/${maxRetries}):`, error);
          
          if (retryCount >= maxRetries) {
            console.error(`⏱️  [${Date.now() - startTime}ms] CRITICAL: All credential save attempts failed!`);
            await logConnectionEvent('creds_save_failed_final', { error: (error as Error).message });
            // This could cause "Couldn't link Device" error
          } else {
            // Wait briefly before retry
            await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
          }
        }
      }
    });

    console.log(`⏱️  [${Date.now() - startTime}ms] Step 4: Event handlers set up, socket creation complete`);
    await logConnectionEvent('socket_created');
    console.log(`⏱️  [${Date.now() - startTime}ms] FINAL: Returning socket to caller`);
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

  // Create new connection with detailed timing and timeout protection  
  const mainStartTime = Date.now();
  console.log('🚨 [MAIN] Starting connection with detailed timing...');
  
  globalConnectionPromise = Promise.race([
    (async () => {
      console.log(`⏱️  [MAIN: ${Date.now() - mainStartTime}ms] Calling createWhatsAppConnection...`);
      const result = await createWhatsAppConnection();
      console.log(`⏱️  [MAIN: ${Date.now() - mainStartTime}ms] createWhatsAppConnection returned:`, result.success ? 'SUCCESS' : 'FAILED');
      
      if (result.success && result.socket) {
        globalSocket = result.socket;
        lastConnectionTime = Date.now();
        console.log(`⏱️  [MAIN: ${Date.now() - mainStartTime}ms] Socket stored globally - MAIN CONNECTION COMPLETE!`);
        return result.socket;
      } else {
        throw new Error(result.error || 'Failed to create connection');
      }
    })(),
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        console.log(`🚨 [MAIN: ${Date.now() - mainStartTime}ms] TIMEOUT TRIGGERED - 50 seconds reached`);
        reject(new Error('TIMEOUT: Main connection timeout after 50 seconds'));
      }, 50000); // Allow proper time for WhatsApp handshake
    })
  ]);

  try {
    console.log(`⏱️  [MAIN: ${Date.now() - mainStartTime}ms] Waiting for connection promise...`);
    const socket = await globalConnectionPromise;
    console.log(`⏱️  [MAIN: ${Date.now() - mainStartTime}ms] 🎉 FINAL SUCCESS - Socket ready for use!`);
    return socket;
  } catch (error) {
    console.log(`⏱️  [MAIN: ${Date.now() - mainStartTime}ms] ❌ FINAL ERROR:`, error);
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

// Clear global connection state (for debugging/reset)
export async function clearGlobalConnection(): Promise<void> {
  console.log('🧹 Clearing global connection state...');
  globalSocket = null;
  globalConnectionPromise = null;
  lastConnectionTime = 0;
  console.log('✅ Global connection state cleared');
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