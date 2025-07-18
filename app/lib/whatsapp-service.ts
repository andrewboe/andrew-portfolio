// Pure WhatsApp functionality using Railway service

const RAILWAY_SERVICE_URL = process.env.RAILWAY_WHATSAPP_URL;

if (!RAILWAY_SERVICE_URL) {
  console.warn('⚠️ RAILWAY_WHATSAPP_URL not configured - WhatsApp features will not work');
}

async function callRailwayAPI(endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any) {
  if (!RAILWAY_SERVICE_URL) {
    throw new Error('Railway WhatsApp service URL not configured');
  }

  const url = `${RAILWAY_SERVICE_URL.replace(/\/$/, '')}${endpoint}`;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Railway API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

export async function sendTestMessage(): Promise<{success: boolean; message?: string; error?: string}> {
  try {
    const groupId = process.env.WHATSAPP_GROUP_ID;
    if (!groupId) {
      throw new Error('WHATSAPP_GROUP_ID not configured');
    }

    const result = await callRailwayAPI('/send-message', 'POST', {
      to: groupId,
      message: '🤖 Test message from WhatsApp Bot'
    });
    
    if (result.success) {
      return { success: true, message: 'Test message sent successfully' };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function sendNotification(message: string): Promise<{success: boolean; message?: string; error?: string}> {
  try {
    const groupId = process.env.WHATSAPP_GROUP_ID;
    if (!groupId) {
      throw new Error('WHATSAPP_GROUP_ID not configured');
    }

    const result = await callRailwayAPI('/send-message', 'POST', {
      to: groupId,
      message: message
    });
    
    if (result.success) {
      return { success: true, message: 'Notification sent successfully' };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getWhatsAppGroups() {
  try {
    // For Railway service, we use the configured group ID
    // This maintains compatibility with existing code
    const groupId = process.env.WHATSAPP_GROUP_ID;
    return { 
      groups: groupId ? [{ id: groupId, name: 'Configured Group' }] : []
    };
  } catch (error) {
    throw error;
  }
}

// WhatsApp functions for setup/management
export async function getQRCodeForAuth(): Promise<{success: boolean; qr?: string; error?: string}> {
  try {
    const result = await callRailwayAPI('/start', 'POST');
    return result;
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function clearAuthStateForApp(): Promise<{success: boolean; message?: string; error?: string}> {
  try {
    const result = await callRailwayAPI('/clear-auth', 'POST');
    return result;
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getConnectionStatus() {
  try {
    const result = await callRailwayAPI('/status');
    return {
      isConnected: result.connected || false,
      isConnecting: result.connecting || false,
      message: result.message || 'Unknown status'
    };
  } catch (error) {
    console.error('Error getting connection status:', error);
    return {
      isConnected: false,
      isConnecting: false,
      message: `Connection error: ${(error as Error).message}`
    };
  }
} 