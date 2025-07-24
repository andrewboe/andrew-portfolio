# Vercel Deployment Guide - Simplified Architecture

## 🚀 Overview

This guide covers deploying the **Vercel portion** of the application. WhatsApp functionality is now handled by a separate Railway service, making the Vercel deployment much simpler and more reliable.

## 🏗️ Architecture

```
┌─────────────────┐    HTTP API    ┌─────────────────┐    Baileys    ┌─────────────────┐
│     VERCEL      │◄──────────────►│     RAILWAY     │◄─────────────►│    WHATSAPP     │
│                 │                │                 │               │                 │
│ • Web App       │                │ • Persistent    │               │ • Group Chat    │
│ • MongoDB       │                │   Connection    │               │ • QR Scanning   │
│ • Cron Jobs     │                │ • QR Generation │               │ • Messaging     │
│ • API Routes    │                │ • Auto-Reconnect│               │                 │
└─────────────────┘                └─────────────────┘               └─────────────────┘
```

## ✅ What's Simplified

### **Before (Complex)**
- ❌ Redis for auth state management
- ❌ Serverless WhatsApp connections
- ❌ Complex QR handling in Vercel functions
- ❌ Auth state persistence issues
- ❌ Function timeout problems

### **After (Simple)**
- ✅ Just HTTP API calls to Railway
- ✅ No WhatsApp code on Vercel
- ✅ No auth state management
- ✅ Railway handles all WhatsApp complexity
- ✅ Standard Next.js deployment

## 📋 Environment Variables

Set these in your Vercel project dashboard:

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Email (Contact form)
SENDGRID_API_KEY=SG.your_sendgrid_api_key
SENDGRID_FROM_EMAIL=your_verified_sender_email@domain.com

# WhatsApp Integration (Railway)
RAILWAY_WHATSAPP_URL=https://your-railway-app.railway.app
WHATSAPP_GROUP_ID=1234567890-1234567890@g.us

# Admin Access
RESET_SECRET=your_secure_random_string

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## 🚀 Deployment Steps

### **Step 1: Prerequisites**
- [ ] Railway WhatsApp service deployed (see Railway guide)
- [ ] MongoDB database ready
- [ ] SendGrid account configured
- [ ] GitHub repository ready

### **Step 2: Vercel Setup**
1. **Import Project**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import from GitHub

2. **Configure Build**:
   - Framework: Next.js
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

3. **Add Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add all variables from the list above
   - Set for all environments (Production, Preview, Development)

### **Step 3: Deploy**
- [ ] Click "Deploy" - Vercel will build and deploy automatically
- [ ] Wait for deployment to complete
- [ ] Visit your Vercel URL to verify the app loads

### **Step 4: Test Integration**
After deployment, test the Railway integration:

1. **Test Railway Connection**:
   ```bash
   GET https://your-app.vercel.app/api/test-railway
   ```

2. **Test Cron Jobs** (optional):
   ```bash
   GET https://your-app.vercel.app/api/cron/softball/saturday
   ```

## 🧪 Testing Your Deployment

### **1. Basic App Functionality**
- [ ] Visit your Vercel URL
- [ ] Portfolio page loads correctly
- [ ] Softball RSVP page (`/softball`) works
- [ ] Contact form submits successfully

### **2. RSVP System**
- [ ] Submit an RSVP with name, status, comment
- [ ] Verify it appears in the RSVP list
- [ ] Submit again with same name (should update, not duplicate)

### **3. Railway Integration**
- [ ] Test endpoint: `/api/test-railway` returns Railway status
- [ ] If Railway is connected, try posting to test message sending

### **4. Admin Features** (if applicable)
- [ ] Admin panel accessible (with proper auth)
- [ ] Reset RSVPs functionality works
- [ ] WhatsApp test buttons work (calling Railway)

## 📅 Cron Jobs

Vercel automatically handles cron jobs defined in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/softball/reset",
      "schedule": "0 0 * * 1"
    },
    {
      "path": "/api/cron/softball/wednesday", 
      "schedule": "0 12 * * 3"
    },
    {
      "path": "/api/cron/softball/saturday",
      "schedule": "0 12 * * 6"
    }
  ]
}
```

**Schedule Explanation**:
- **Monday 12:00 AM**: Reset RSVPs for new week
- **Wednesday 12:00 PM**: Send early RSVP reminder
- **Saturday 12:00 PM**: Send game day reminder with stats

## 🔧 Troubleshooting

### **"Railway WhatsApp service not responding"**
- Check your `RAILWAY_WHATSAPP_URL` environment variable
- Verify Railway service is deployed and running
- Test Railway service directly in browser

### **"RSVP submission failed"**
- Check MongoDB connection with `MONGODB_URI`
- Verify database has proper read/write permissions
- Check Vercel function logs for database errors

### **"Cron jobs not sending WhatsApp messages"**
- Verify Railway service is connected to WhatsApp
- Check `WHATSAPP_GROUP_ID` format: `number-number@g.us`
- Test Railway messaging manually via Railway web interface

### **"Contact form not sending emails"**
- Verify `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL`
- Check SendGrid dashboard for delivery status
- Ensure sender email is verified in SendGrid

## 📊 Monitoring

### **Vercel Analytics**
- Functions tab: Monitor API response times
- Build logs: Check for deployment issues
- Runtime logs: Debug function execution

### **Key Metrics to Watch**
- `/api/rsvp` response times (RSVP submissions)
- `/api/test-railway` success rate (Railway connectivity)
- Cron job execution success (automated reminders)

## 🎯 Production Checklist

Before going live:

- [ ] **Environment Variables**: All set correctly in Vercel
- [ ] **Railway Integration**: WhatsApp service running and connected
- [ ] **Database**: MongoDB accessible and working
- [ ] **Email**: SendGrid configured and sending
- [ ] **Domain**: Custom domain configured (optional)
- [ ] **Cron Jobs**: Test manually to ensure they work
- [ ] **RSVP Flow**: End-to-end test of RSVP submission and display
- [ ] **Mobile**: Test responsive design on mobile devices

## 🚀 Going Live

1. **Final Deployment**:
   - Merge to main branch
   - Vercel auto-deploys production

2. **Railway WhatsApp Setup**:
   - Visit your Railway app URL
   - Generate QR code and scan with WhatsApp
   - Test messaging from Vercel app

3. **Monitor**: 
   - Watch Vercel function logs
   - Monitor Railway service health
   - Test cron jobs run successfully

Your application is now live with the simplified, reliable architecture! 🎉

## 📚 Additional Resources

- [Railway WhatsApp Setup Guide](RailwayBaileys/railway-baileys/README.md)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment) 