import makeWASocket, { 
  Browsers, 
  DisconnectReason,
  WASocket,
  useMultiFileAuthState
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as fs from 'fs';
import * as path from 'path';

// Simple local auth directory
const AUTH_DIR = './baileys_auth_info';

// Ensure auth directory exists
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

let globalSocket: WASocket | null = null;
let currentQR: string | null = null;

async function createConnection(): Promise<WASocket> {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  
  const socket = makeWASocket({
    auth: state,
    browser: ["Windows", "Chrome", "Chrome 114.0.5735.198"],
    // Use the exact working settings from the commit
    connectTimeoutMs: 120000, // 2 minutes (from working commit)
    defaultQueryTimeoutMs: 120000, // 2 minutes for queries
    keepAliveIntervalMs: 30000, // 30 seconds
    qrTimeout: 300000, // 5 minutes for QR timeout
    retryRequestDelayMs: 5000, // 5 seconds between retries
    maxMsgRetryCount: 3, // Limit retry attempts
    printQRInTerminal: false,
    syncFullHistory: false,
    markOnlineOnConnect: false,
    emitOwnEvents: false, // Don't emit events for our own actions
    // Additional settings for stability
    fireInitQueries: true, // Ensure initialization queries are sent
    generateHighQualityLinkPreview: false, // Disable to reduce processing
  });

  socket.ev.on('creds.update', saveCreds);
  
  return socket;
}

export async function getQRCode(): Promise<{success: boolean; qr?: string; error?: string}> {
  try {
    console.log('🔄 Starting local Baileys QR generation...');
    
    return new Promise(async (resolve) => {
      let connectionAttempts = 0;
      const maxAttempts = 3;
      
      const createConnectionWithRetry = async (): Promise<void> => {
        connectionAttempts++;
        console.log(`📱 Connection attempt ${connectionAttempts}/${maxAttempts}`);
        
        const socket = await createConnection();

        socket.ev.on('connection.update', async (update) => {
          const { connection, lastDisconnect, qr } = update;
          
          console.log('📡 Connection update:', { connection, qr: !!qr });
          
          if (qr) {
            console.log('✅ QR Code generated!');
            console.log('📱 Please scan this QR code with WhatsApp:');
            console.log(qr);
            currentQR = qr;
            resolve({
              success: true,
              qr: qr
            });
          }
          
          if (connection === 'connecting') {
            console.log('⏳ Connecting to WhatsApp...');
          }
          
          if (connection === 'open') {
            console.log('✅ WhatsApp connected successfully!');
            globalSocket = socket;
          }
          
          if (connection === 'close') {
            const reason = lastDisconnect?.error;
            const statusCode = (reason as any)?.output?.statusCode;
            
            // 🎯 FORUM SOLUTION: Check if we should reconnect
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            
            console.log(`❌ Connection closed. Status code: ${statusCode}`);
            console.log(`🔍 Should reconnect: ${shouldReconnect}`);
            
            if (shouldReconnect && connectionAttempts < maxAttempts) {
              console.log(`🔄 Attempting reconnection (${connectionAttempts + 1}/${maxAttempts})...`);
              // Wait 2 seconds before retry
              setTimeout(() => {
                createConnectionWithRetry();
              }, 2000);
            } else if (statusCode === DisconnectReason.loggedOut) {
              console.log('🚪 User logged out. Please scan QR code again.');
              if (!currentQR) {
                resolve({
                  success: false,
                  error: 'User logged out. Please clear auth and try again.'
                });
              }
            } else {
              console.log('❌ Max reconnection attempts reached');
              if (!currentQR) {
                resolve({
                  success: false,
                  error: `Connection failed after ${maxAttempts} attempts. Status: ${statusCode}`
                });
              }
            }
          }
        });
      };

      // Start the initial connection
      await createConnectionWithRetry();

      // Timeout after 5 minutes (matching qrTimeout)
      setTimeout(() => {
        if (!currentQR) {
          resolve({
            success: false,
            error: 'QR generation timeout after 5 minutes'
          });
        }
      }, 300000); // 5 minutes to match qrTimeout
    });
    
  } catch (error) {
    console.error('❌ Error generating QR:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function sendMessage(to: string, message: string): Promise<{success: boolean; message?: string; error?: string}> {
  try {
    if (!globalSocket) {
      return {
        success: false,
        error: 'WhatsApp not connected'
      };
    }

    await globalSocket.sendMessage(to, { text: message });
    return {
      success: true,
      message: 'Message sent successfully'
    };
  } catch (error) {
    console.error('❌ Error sending message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getConnectionStatus(): Promise<{isConnected: boolean; message: string}> {
  return {
    isConnected: !!globalSocket,
    message: globalSocket ? 'WhatsApp is connected' : 'WhatsApp is not connected'
  };
}

export async function clearAuthState(): Promise<{success: boolean; message?: string; error?: string}> {
  try {
    // Close existing connection
    if (globalSocket) {
      globalSocket.end(undefined);
      globalSocket = null;
    }
    
    // Clear QR
    currentQR = null;
    
    // Remove auth files
    if (fs.existsSync(AUTH_DIR)) {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    }
    
    console.log('✅ Auth state cleared successfully');
    return {
      success: true,
      message: 'Auth state cleared successfully'
    };
  } catch (error) {
    console.error('❌ Error clearing auth state:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 