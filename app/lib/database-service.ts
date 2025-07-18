import mongoose from 'mongoose';
import sgMail from '@sendgrid/mail';

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI as string)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((error) => console.error('❌ MongoDB connection error:', error));

// RSVP Schema - Simple: name, yes/no/maybe, comments
const rsvpSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, enum: ['yes', 'no', 'maybe'], required: true },
  comments: { type: String, default: '' },
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

// RSVP Database Operations
export async function getAllRSVPs() {
  try {
    const rsvps = await RSVP.find({}).sort({ createdAt: -1 });
    return rsvps;
  } catch (error) {
    console.error('Error fetching RSVPs:', error);
    throw error;
  }
}

export async function addOrUpdateRSVP(rsvpData: {
  name: string;
  status: 'yes' | 'no' | 'maybe';
  comments?: string;
}) {
  try {
    // Check if player has already RSVPed (by name)
    const existingRSVP = await RSVP.findOne({ 
      name: rsvpData.name 
    });

    if (existingRSVP) {
      // Update existing RSVP
      const updated = await RSVP.findByIdAndUpdate(
        existingRSVP._id,
        rsvpData,
        { new: true }
      );
      return updated;
    } else {
      // Create new RSVP
      const newRSVP = new RSVP(rsvpData);
      const saved = await newRSVP.save();
      return saved;
    }
  } catch (error) {
    console.error('Error adding/updating RSVP:', error);
    throw error;
  }
}

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

export async function getRSVPStats() {
  try {
    const totalRSVPs = await RSVP.countDocuments();
    const yesRSVPs = await RSVP.countDocuments({ status: 'yes' });
    const noRSVPs = await RSVP.countDocuments({ status: 'no' });
    const maybeRSVPs = await RSVP.countDocuments({ status: 'maybe' });
    
    return {
      total: totalRSVPs,
      yes: yesRSVPs,
      no: noRSVPs,
      maybe: maybeRSVPs
    };
  } catch (error) {
    console.error('Error getting RSVP stats:', error);
    throw error;
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