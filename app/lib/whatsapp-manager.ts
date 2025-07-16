import makeWASocket, { DisconnectReason, Browsers, WASocket } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { 
  useRedisAuthState, 
  storeQRCode, 
  getStoredQRCode, 
  clearQRCode, 
  storeConnectionState, 
  getConnectionState,
  clearAllAuthData 
} from './redis-auth-state';

// Global connection cache (will only exist for the duration of a single serverless function)
let globalSocket: WASocket | null = null;
let globalConnectionPromise: Promise<WASocket> | null = null;
let lastConnectionTime = 0;
const CONNECTION_TIMEOUT = 30000; // 30 seconds
const CONNECTION_RETRY_DELAY = 5000; // 5 seconds

interface ConnectionResult {
  success: boolean;
  socket?: WASocket;
  error?: string;
}

// Create a new WhatsApp connection
async function createWhatsAppConnection(): Promise<ConnectionResult> {
  try {
    console.log('🔄 Creating new WhatsApp connection...');
    
    // Get Redis-based auth state
    const { state, saveCreds } = await useRedisAuthState();
    
    // Create socket with serverless-optimized config
    const socket = makeWASocket({
      auth: state,
      browser: Browsers.ubuntu('WhatsApp Bot'),
      connectTimeoutMs: CONNECTION_TIMEOUT,
      defaultQueryTimeoutMs: 10000,
      printQRInTerminal: false, // Disable console QR
      syncFullHistory: false, // Optimize for serverless
      markOnlineOnConnect: false, // Don't mark as online to save resources
      generateHighQualityLinkPreview: false, // Reduce processing
      // Remove deprecated/incorrect options
    });

    console.log('✅ WhatsApp socket created');

    // Set up event handlers
    socket.ev.on('creds.update', saveCreds);

    // Handle connection updates
    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      console.log('📡 Connection update:', { connection, hasQr: !!qr });

      if (qr) {
        console.log('📱 QR Code generated for authentication');
        try {
          await storeQRCode(qr);
          console.log('✅ QR stored successfully');
        } catch (error) {
          console.error('❌ Failed to store QR:', error);
        }
      }

      if (connection === 'open') {
        console.log('✅ WhatsApp connected successfully');
        await storeConnectionState({ 
          isConnected: true, 
          connectedAt: Date.now(),
          socketId: socket.user?.id || 'unknown'
        });
        
        // Clear QR code since we're connected
        await clearQRCode();
        
      } else if (connection === 'close') {
        console.log('❌ WhatsApp connection closed');
        await storeConnectionState({ 
          isConnected: false, 
          disconnectedAt: Date.now() 
        });
        
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('🔍 Should reconnect:', shouldReconnect);
        
        if (lastDisconnect?.error) {
          console.log('🔍 Disconnect reason:', lastDisconnect.error.message);
        }
        
        // Reset global state
        globalSocket = null;
        globalConnectionPromise = null;
      }
    });

    return { success: true, socket };
  } catch (error) {
    console.error('❌ Error creating WhatsApp connection:', error);
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
      console.error('❌ Existing connection promise failed:', error);
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
    const socket = await globalConnectionPromise;
    console.log('✅ New connection established');
    return socket;
  } catch (error) {
    globalConnectionPromise = null;
    globalSocket = null;
    throw error;
  }
}

// Check if connection is ready for messaging
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
      console.log('⚠️ Connection is stale');
      return false;
    }
    
    // Try to get socket and verify it's functional
    try {
      const socket = await getWhatsAppConnection();
      const user = socket.user;
      console.log('✅ Connection is ready, user:', user?.id || 'unknown');
      return !!user;
    } catch (error) {
      console.error('❌ Socket verification failed:', error);
      return false;
    }
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
      return { success: false, error: 'WhatsApp not connected. Please scan QR code first.' };
    }
    
    // Get connection
    const socket = await getWhatsAppConnection();
    
    // Send message
    const result = await socket.sendMessage(groupId, { text: message });
    
    console.log('✅ Message sent successfully');
    return { 
      success: true, 
      messageId: result?.key?.id || undefined 
    };
  } catch (error) {
    console.error('❌ Error sending message:', error);
    return { 
      success: false, 
      error: (error as Error).message 
    };
  }
}

// Get QR code for authentication
export async function getQRForAuth(): Promise<{success: boolean; qr?: string; error?: string}> {
  try {
    console.log('🔍 Getting QR code for authentication...');
    
    // Check if we're already connected
    const isReady = await isConnectionReady();
    if (isReady) {
      return { success: false, error: 'Already connected to WhatsApp' };
    }
    
    // Check for existing QR
    const existingQR = await getStoredQRCode();
    if (existingQR) {
      console.log('✅ Found existing QR code');
      return { success: true, qr: existingQR };
    }
    
    console.log('🔄 No existing QR, creating new connection to generate one...');
    
    // Clear any stale connections
    globalSocket = null;
    globalConnectionPromise = null;
    
    // Start connection process which will generate QR
    const connectionPromise = getWhatsAppConnection();
    
    // Wait for QR generation with timeout
    const timeout = 60000; // 60 seconds
    const pollInterval = 1000; // 1 second
    const maxAttempts = timeout / pollInterval;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
      const qr = await getStoredQRCode();
      if (qr) {
        console.log(`✅ QR generated after ${attempt + 1} seconds`);
        return { success: true, qr };
      }
      
      // Log progress every 10 seconds
      if ((attempt + 1) % 10 === 0) {
        console.log(`⏳ Still waiting for QR... ${attempt + 1}/${maxAttempts} attempts`);
      }
    }
    
    return { success: false, error: 'QR generation timed out' };
  } catch (error) {
    console.error('❌ Error getting QR code:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Clear all authentication data
export async function clearAuthData(): Promise<{success: boolean; message?: string; error?: string}> {
  try {
    console.log('🧹 Clearing all authentication data...');
    
    // Clear Redis data
    await clearAllAuthData();
    
    // Reset global state
    globalSocket = null;
    globalConnectionPromise = null;
    lastConnectionTime = 0;
    
    console.log('✅ All authentication data cleared');
    return { success: true, message: 'Authentication data cleared successfully' };
  } catch (error) {
    console.error('❌ Error clearing auth data:', error);
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