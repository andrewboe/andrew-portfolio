import mongoose from 'mongoose';
import sgMail from '@sendgrid/mail';
import { 
  sendMessage, 
  getQRForAuth, 
  clearAuthData, 
  getConnectionStatus as getWhatsAppConnectionStatus 
} from './whatsapp-manager';

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI as string)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((error) => console.error('❌ MongoDB connection error:', error));

// RSVP Schema
const rsvpSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  status: { type: String, enum: ['yes', 'no'], required: true },
  comments: { type: String, default: '' },
  gameDate: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const RSVP = mongoose.models.RSVP || mongoose.model('RSVP', rsvpSchema);

// Contact form schema
const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Contact = mongoose.models.Contact || mongoose.model('Contact', contactSchema);

// SendGrid configuration
sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

// Export models
export { RSVP, Contact };

// WhatsApp Bot functionality - Redis-based serverless approach

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

export async function sendWednesdayReminder(): Promise<{success: boolean; message?: string; error?: string}> {
  try {
    const groupId = process.env.WHATSAPP_GROUP_ID;
    if (!groupId) {
      throw new Error('WHATSAPP_GROUP_ID not configured');
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://andrewboe.dev';
    const rsvpUrl = `${appUrl}/softball`;

    const messageText = `🥎 S.O.F.T.B.A.L.L. REMINDER 🥎

Hey team! This Saturday we have softball! 

⚾ Please RSVP at: ${rsvpUrl}

Let us know if you're coming so we can plan accordingly. Game details will be shared closer to Saturday.

Thanks! 🏆`;

    const result = await sendMessage(groupId, messageText);
    
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
    const groupId = process.env.WHATSAPP_GROUP_ID;
    if (!groupId) {
      throw new Error('WHATSAPP_GROUP_ID not configured');
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://andrewboe.dev';
    const rsvpUrl = `${appUrl}/softball`;

    const messageText = `🥎 GAME DAY REMINDER! 🥎

It's SATURDAY - SOFTBALL DAY! ⚾

🏟️ If you haven't already, please confirm your attendance: ${rsvpUrl}

Let's have a great game everyone! See you on the field! 🏆

⚾ Game Day! ⚾`;

    const result = await sendMessage(groupId, messageText);
    
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

export async function getWhatsAppGroups() {
  try {
    // In serverless environment, we don't maintain persistent group lists
    // This is a placeholder for compatibility
    return { groups: [] };
  } catch (error) {
    throw error;
  }
}

// WhatsApp functions using the new Redis-based serverless manager
export async function getQRCode(): Promise<{success: boolean; qr?: string; error?: string}> {
  return await getQRForAuth();
}

export async function clearAuthState(): Promise<{success: boolean; message?: string; error?: string}> {
  return await clearAuthData();
}

export async function getConnectionStatus() {
  return await getWhatsAppConnectionStatus();
}

// RSVP functions
export async function resetRSVPs() {
  try {
    const result = await RSVP.deleteMany({});
    console.log(`Reset complete. Deleted ${result.deletedCount} RSVPs.`);
    return { success: true, deletedCount: result.deletedCount };
  } catch (error) {
    console.error('Error resetting RSVPs:', error);
    return { success: false, error };
  }
}

// Contact form handling
export async function sendContactEmail(name: string, email: string, message: string) {
  try {
    // Save to database
    const contact = new Contact({ name, email, message });
    await contact.save();

    // Send email notification
    const msg = {
      to: 'andrewboe63@gmail.com',
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject: `New Contact Form Submission from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong> ${message}</p>
      `
    };

    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    console.error('Error sending contact email:', error);
    return { success: false, error };
  }
} 