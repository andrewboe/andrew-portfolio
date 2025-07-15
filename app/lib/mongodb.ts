import mongoose from 'mongoose';
import sgMail from '@sendgrid/mail';

// Validate required environment variables
const requiredEnvVars = {
  MONGODB_URI: process.env.MONGODB_URI,
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  WHAPI_TOKEN: process.env.WHAPI_TOKEN,
  WHATSAPP_GROUP_ID: process.env.WHATSAPP_GROUP_ID,
};

Object.entries(requiredEnvVars).forEach(([name, value]) => {
  if (!value) {
    throw new Error(`Environment variable ${name} is required but not set.`);
  }
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

// Connection options
const options = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4, // Use IPv4, skip trying IPv6
  maxPoolSize: 10,
};

// Create the connection with retry logic
let retryCount = 0;
const maxRetries = 3;

async function createConnection() {
  try {
    const conn = mongoose.createConnection(process.env.MONGODB_URI as string, options);
    
    // Connection event handlers
    conn.on('connected', () => {
      console.log('=== MongoDB Connection Details ===');
      console.log(`Connected to host: ${conn.host}`);
      console.log(`Database name: ${conn.name}`);
      retryCount = 0; // Reset retry count on successful connection
      
      // Verify we're connected to the correct database
      if (conn.name !== 'softballrsvp') {
        console.warn(`Warning: Connected to database "${conn.name}" instead of "softballrsvp". Please check your MONGODB_URI.`);
      }

      // Log collection details after a short delay to ensure model is registered
      setTimeout(() => {
        const collections = Object.keys(conn.models);
        console.log('\n=== Collection Details ===');
        console.log('Registered collections:', collections);
        console.log('RSVP collection name:', conn.models.RSVP?.collection.name);
        console.log('===============================\n');
      }, 1000);
    });

    conn.on('error', async (error) => {
      console.error('MongoDB connection error:', error);
      
      if (retryCount < maxRetries) {
        retryCount++;
        console.log(`Retrying connection... Attempt ${retryCount} of ${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
        return createConnection();
      } else {
        console.error('Max retry attempts reached. Exiting...');
        process.exit(1);
      }
    });

    conn.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    return conn;
  } catch (error) {
    console.error('Error creating MongoDB connection:', error);
    throw error;
  }
}

// Create the initial connection
const connection = await createConnection();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});

// Function to send WhatsApp group message using Whapi.cloud
async function sendWhapiGroupMessage(message: string) {
  try {
    const response = await fetch('https://gate.whapi.cloud/messages/text', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: process.env.WHATSAPP_GROUP_ID,
        body: message
      })
    });

    const responseData = await response.json();
    console.log('Whapi.cloud API Response:', responseData);

    if (!response.ok) {
      throw new Error(`Whapi.cloud API Error (${response.status}): ${JSON.stringify(responseData)}`);
    }

    return { success: true, response: responseData };
  } catch (error) {
    console.error('Error sending WhatsApp group message via Whapi.cloud:', error);
    throw error;
  }
}

// Function to send Wednesday reminder
export async function sendWednesdayReminder() {
  try {
    const rsvpLink = `${process.env.NEXT_PUBLIC_APP_URL}/softball`;
    const message = `⚾ Time to RSVP for softball! ⚾\n\nClick here to let us know if you're coming: ${rsvpLink}`;

    console.log('Attempting to send Wednesday WhatsApp group message via Whapi.cloud');
    const result = await sendWhapiGroupMessage(message);
    console.log('Wednesday WhatsApp reminder sent successfully:', result);
    return { success: true, response: result };
  } catch (error) {
    console.error('Error sending Wednesday WhatsApp reminder:', error);
    throw error;
  }
}

// Function to send Saturday reminder
export async function sendSaturdayReminder() {
  try {
    const rsvpLink = `${process.env.NEXT_PUBLIC_APP_URL}/softball`;
    const message = `🥎 Softball is tomorrow! Please RSVP if you haven't already! 🥎\n\nClick here to let us know if you're coming: ${rsvpLink}`;

    console.log('Attempting to send Saturday WhatsApp group message via Whapi.cloud');
    const result = await sendWhapiGroupMessage(message);
    console.log('Saturday WhatsApp reminder sent successfully:', result);
    return { success: true, response: result };
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
export const connectDB = async () => {
  if (connection.readyState !== 1) {
    // If not connected (0) or disconnected (3), try to reconnect
    console.log('MongoDB not connected, attempting to reconnect...');
    return createConnection();
  }
  return connection;
}; 