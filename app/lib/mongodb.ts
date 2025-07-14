import mongoose from 'mongoose';
import { schedule } from 'node-cron';
import sgMail from '@sendgrid/mail';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('Please add your SendGrid API key to .env.local');
}

// Validate WhatsApp environment variables
if (!process.env.WHATSAPP_TO_NUMBER || !process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
  throw new Error('Please add WhatsApp configuration to .env.local (WHATSAPP_TO_NUMBER, WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID)');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Create the connection
const connection = mongoose.createConnection(process.env.MONGODB_URI as string);

// Function to send Wednesday WhatsApp message
export async function sendWednesdayReminder() {
  try {
    const rsvpLink = `${process.env.NEXT_PUBLIC_APP_URL}/softball`;
    const message = `Time to RSVP for softball!\n\nClick here to let us know if you're coming: ${rsvpLink}`;

    console.log('Attempting to send Wednesday WhatsApp message to:', process.env.WHATSAPP_TO_NUMBER);
    
    const response = await fetch(`https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: process.env.WHATSAPP_TO_NUMBER,
        type: 'text',
        text: { body: message }
      })
    });

    const responseData = await response.json();
    console.log('WhatsApp API Response:', responseData);

    if (!response.ok) {
      throw new Error(`WhatsApp API Error (${response.status}): ${JSON.stringify(responseData)}`);
    }

    console.log('Wednesday WhatsApp reminder sent successfully');
    return { success: true, response: responseData };
  } catch (error) {
    console.error('Error sending Wednesday WhatsApp reminder:', error);
    throw error;
  }
}

// Function to send Saturday WhatsApp message
export async function sendSaturdayReminder() {
  try {
    const rsvpLink = `${process.env.NEXT_PUBLIC_APP_URL}/softball`;
    const message = `Softball is tomorrow! Please RSVP if you haven't already!\n\nClick here to let us know if you're coming: ${rsvpLink}`;

    console.log('Attempting to send Saturday WhatsApp message to:', process.env.WHATSAPP_TO_NUMBER);
    
    const response = await fetch(`https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: process.env.WHATSAPP_TO_NUMBER,
        type: 'text',
        text: { body: message }
      })
    });

    const responseData = await response.json();
    console.log('WhatsApp API Response:', responseData);

    if (!response.ok) {
      throw new Error(`WhatsApp API Error (${response.status}): ${JSON.stringify(responseData)}`);
    }

    console.log('Saturday WhatsApp reminder sent successfully');
    return { success: true, response: responseData };
  } catch (error) {
    console.error('Error sending Saturday WhatsApp reminder:', error);
    throw error;
  }
}

// Function to send reset notification email
async function sendResetNotification(deletedCount: number) {
  const msg = {
    to: 'andrewboe63@gmail.com',
    from: process.env.SENDGRID_FROM_EMAIL!,
    subject: 'Softball RSVP Weekly Reset',
    text: `Weekly reset completed. ${deletedCount} RSVPs were cleared from the database.`,
    html: `
      <h2>Softball RSVP Weekly Reset</h2>
      <p>The weekly reset has been completed.</p>
      <p><strong>RSVPs Cleared:</strong> ${deletedCount}</p>
      <p>Time: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}</p>
    `
  };

  try {
    await sgMail.send(msg);
    console.log('Reset notification email sent');
  } catch (error) {
    console.error('Error sending reset notification:', error);
  }
}

// Function to reset RSVPs
export async function resetRSVPs() {
  try {
    const result = await RSVP.deleteMany({});
    console.log(`Reset complete. Deleted ${result.deletedCount} RSVPs.`);
    
    // Send notification email
    await sendResetNotification(result.deletedCount || 0);
    
    return { success: true, deletedCount: result.deletedCount };
  } catch (error) {
    console.error('Error resetting RSVPs:', error);
    return { success: false, error };
  }
}

// Schedule weekly reset - Runs at 12:00 AM every Monday
schedule('0 0 * * 1', resetRSVPs, {
  timezone: "America/New_York"
});

// Schedule WhatsApp reminders
// Wednesday at 12:00 PM (noon)
schedule('0 12 * * 3', sendWednesdayReminder, {
  timezone: "America/New_York"
});

// Saturday at 12:00 PM (noon)
schedule('0 12 * * 6', sendSaturdayReminder, {
  timezone: "America/New_York"
});

// Handle connection events
connection.on('connected', () => {
  console.log('=== MongoDB Connection Details ===');
  console.log(`Connected to host: ${connection.host}`);
  console.log(`Database name: ${connection.name}`);
  
  // Verify we're connected to the correct database
  if (connection.name !== 'softballrsvp') {
    console.warn(`Warning: Connected to database "${connection.name}" instead of "softballrsvp". Please check your MONGODB_URI.`);
  }

  // Log collection details after a short delay to ensure model is registered
  setTimeout(() => {
    const collections = Object.keys(connection.models);
    console.log('\n=== Collection Details ===');
    console.log('Registered collections:', collections);
    console.log('RSVP collection name:', connection.models.RSVP.collection.name);
    console.log('===============================\n');
  }, 1000);
});

connection.on('error', (error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});

// RSVP Schema
const rsvpSchema = new mongoose.Schema({
  playerName: {
    type: String,
    required: [true, 'Please enter your name'],
    trim: true,
  },
  status: {
    type: String,
    required: [true, 'Please select your status'],
    enum: ['yes', 'no', 'maybe'],
  },
  comment: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create the models using the connection instance
export const RSVP = connection.model('RSVP', rsvpSchema);

// Export the connection for use in other parts of the application
export const connectDB = async () => connection; 