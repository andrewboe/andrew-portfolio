import { 
  sendMessage, 
  getQRCode, 
  clearAuthState, 
  getConnectionStatus as getWhatsAppConnectionStatus 
} from './local-baileys';

// Pure WhatsApp functionality using clean local Baileys approach

export async function sendTestMessage(): Promise<{success: boolean; message?: string; error?: string}> {
  try {
    const groupId = process.env.WHATSAPP_GROUP_ID;
    if (!groupId) {
      throw new Error('WHATSAPP_GROUP_ID not configured');
    }

    const result = await sendMessage(groupId, '🤖 Test message from WhatsApp Bot');
    
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

    const result = await sendMessage(groupId, message);
    
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
    // In local development, we don't maintain persistent group lists
    // This is a placeholder for compatibility
    return { groups: [] };
  } catch (error) {
    throw error;
  }
}

// WhatsApp functions using the clean local Baileys
export async function getQRCodeForAuth(): Promise<{success: boolean; qr?: string; error?: string}> {
  return await getQRCode();
}

export async function clearAuthStateForApp(): Promise<{success: boolean; message?: string; error?: string}> {
  return await clearAuthState();
}

export async function getConnectionStatus() {
  return await getWhatsAppConnectionStatus();
} 