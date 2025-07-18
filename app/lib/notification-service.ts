import { getAllRSVPs, getRSVPStats } from './database-service';
import { sendNotification } from './whatsapp-service';

// Business logic service that coordinates database operations with WhatsApp messaging

export async function sendWednesdayReminder(): Promise<{success: boolean; message?: string; error?: string}> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://andrewboe.dev';
    const rsvpUrl = `${appUrl}`;

    const messageText = `🥎 S.O.F.T.B.A.L.L. REMINDER 🥎

Hey team! This Sunday we have softball! 

⚾ Please RSVP at: ${rsvpUrl}

Let us know if you're coming so we can plan accordingly. Game details will be shared closer to Sunday.

Thanks! 🏆`;

    const result = await sendNotification(messageText);
    
    if (result.success) {
      console.log('✅ Wednesday reminder sent successfully');
      return { success: true, message: 'Wednesday reminder sent successfully' };
    } else {
      console.error('❌ Error sending Wednesday reminder:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ Error sending Wednesday reminder:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function sendSaturdayReminder(): Promise<{success: boolean; message?: string; error?: string}> {
  try {
    // Get current RSVP stats to include in reminder
    const stats = await getRSVPStats();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://andrewboe.dev';
    const rsvpUrl = `${appUrl}`;

    const messageText = `🥎 TOMORROW IS GAME DAY! 🥎

Sunday Softball Reminder! ⚾

🏟️ Current RSVPs: ${stats.yes} Yes, ${stats.no} No, ${stats.maybe} Maybe

If you haven't already, please confirm your attendance: ${rsvpUrl}

Let's have a great game everyone! See you on the field tomorrow! 🏆

⚾ Game Day Tomorrow! ⚾`;

    const result = await sendNotification(messageText);
    
    if (result.success) {
      console.log('✅ Saturday reminder sent successfully');
      return { success: true, message: 'Saturday reminder sent successfully' };
    } else {
      console.error('❌ Error sending Saturday reminder:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ Error sending Saturday reminder:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function sendCustomNotification(message: string): Promise<{success: boolean; message?: string; error?: string}> {
  try {
    const result = await sendNotification(message);
    
    if (result.success) {
      console.log('✅ Custom notification sent successfully');
      return { success: true, message: 'Custom notification sent successfully' };
    } else {
      console.error('❌ Error sending custom notification:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ Error sending custom notification:', error);
    return { success: false, error: (error as Error).message };
  }
} 