import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    // Forward message to your personal email
    const forwardMsg = {
      to: 'andrewboe63@gmail.com',
      from: process.env.SENDGRID_FROM_EMAIL!, // 'andrew@andrewboe.dev'
      subject: `Portfolio Contact: ${name}`,
      replyTo: email,
      text: message,
      html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p>${message}</p>`
    };
    // Confirmation email to submitter
    const confirmMsg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL!, // 'andrew@andrewboe.dev'
      subject: 'Your message has been received',
      text: `Hi ${name},\n\nThank you for reaching out! Your message has been received and I'll get back to you soon.\n\nBest,\nAndrew`,
      html: `<p>Hi ${name},</p><p>Thank you for reaching out! Your message has been received and I'll get back to you soon.</p><p>Best,<br/>Andrew</p>`
    };
    await Promise.all([
      sgMail.send(forwardMsg),
      sgMail.send(confirmMsg)
    ]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
