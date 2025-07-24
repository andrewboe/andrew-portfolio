# Andrew's Portfolio & Softball RSVP App

This is a [Next.js](https://nextjs.org) project with a **separated microservice architecture**:

- **Vercel**: Hosts the web app, database, cron jobs, and API routes
- **Railway**: Provides persistent WhatsApp connection and messaging

## 🏗️ Architecture

```
Vercel (Web + Database) ←→ Railway (WhatsApp) ←→ WhatsApp Groups
     ↑                         ↑
  MongoDB + SendGrid      Persistent Baileys
  Cron Jobs + UI          Connection + QR Setup
```

## 🚀 Quick Setup

### **Step 1: Vercel Environment Variables**

Create a `.env.local` file for local development:

```bash
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# SendGrid (for email notifications)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=your_verified_sender_email

# Railway WhatsApp Service
RAILWAY_WHATSAPP_URL=https://your-railway-app.railway.app
WHATSAPP_GROUP_ID=your_group_id@g.us

# Admin Access
RESET_SECRET=your_reset_secret_token

# App URL (for links in messages)
NEXT_PUBLIC_APP_URL=http://localhost:3000 # Update for production
```

### **Step 2: Railway WhatsApp Service**

The WhatsApp functionality runs on Railway for persistent connections. See the `RailwayBaileys/` directory for:

- Express server with WhatsApp endpoints
- Web interface for QR code generation
- Persistent authentication storage
- Auto-reconnection logic

## 🛠️ Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

For WhatsApp functionality in development, you'll need the Railway service running.

## ✨ Features

### **Portfolio Website**
- Responsive design with retro pixel art theme
- Project showcase with technology tags
- Contact form with email notifications

### **Softball RSVP System**
- Simple name + yes/no/maybe + comments form
- Real-time RSVP list with status indicators
- Update existing RSVPs (prevents duplicates)
- Admin panel for management

### **Automated WhatsApp Reminders**
- **Wednesday**: Early reminder to RSVP
- **Saturday**: Game day reminder with current counts
- Persistent Railway connection (no QR re-scanning)
- Web interface for QR setup and testing

### **MongoDB Integration**
- RSVP storage and retrieval
- Contact form submissions
- Weekly RSVP reset functionality

## 📋 Deployment

### **Option 1: Full Production Setup**

1. **Deploy Railway WhatsApp Service**:
   - See `RailwayBaileys/railway-baileys/README.md`
   - Get your Railway app URL

2. **Deploy Vercel App**:
   - Push to GitHub
   - Import in Vercel dashboard
   - Add environment variables (including `RAILWAY_WHATSAPP_URL`)
   - Deploy

3. **Setup WhatsApp**:
   - Visit Railway app URL
   - Click "Get QR Code for Setup" 
   - Scan with WhatsApp mobile
   - Test integration via `/api/test-railway`

### **Option 2: Local Development**

```bash
# Start Next.js app
npm run dev

# WhatsApp testing requires Railway service
# (or run Railway service locally on different port)
```

## 🔧 Environment Variables

### **Vercel Variables**
| Variable | Description | Required |
|----------|-------------|-----------|
| `MONGODB_URI` | MongoDB connection string | ✅ |
| `SENDGRID_API_KEY` | SendGrid API key | ✅ |
| `SENDGRID_FROM_EMAIL` | Verified sender email | ✅ |
| `RAILWAY_WHATSAPP_URL` | Railway service URL | ✅ |
| `WHATSAPP_GROUP_ID` | Target WhatsApp group | ✅ |
| `RESET_SECRET` | Admin access token | ✅ |
| `NEXT_PUBLIC_APP_URL` | Your app's public URL | ✅ |

### **Railway Variables**
| Variable | Description | Required |
|----------|-------------|-----------|
| `WHATSAPP_GROUP_ID` | Target WhatsApp group | ✅ |
| `PORT` | Service port (auto-set) | Auto |
| `NODE_ENV` | Environment | Auto |

## 📚 Additional Documentation

- [`VERCEL_DEPLOYMENT_GUIDE.md`](VERCEL_DEPLOYMENT_GUIDE.md) - Detailed Vercel setup
- [`RailwayBaileys/railway-baileys/README.md`](RailwayBaileys/railway-baileys/README.md) - Railway service setup
- [`WHATSAPP_VERCEL_SETUP.md`](WHATSAPP_VERCEL_SETUP.md) - Legacy guide (Railway recommended)

## 🧪 Testing

### **Test WhatsApp Integration**
```bash
# Test Railway connection
GET /api/test-railway

# Test message sending  
POST /api/test-railway

# Manual RSVP reminder test
GET /api/cron/softball/saturday
```

### **Test RSVP System**
1. Visit `/softball`
2. Submit RSVP with name, status, comment
3. Verify appears in RSVP list
4. Submit again with same name (should update, not duplicate)

## 📅 Automated Cron Jobs

- **Monday 12:00 AM**: Reset RSVPs (`/api/cron/softball/reset`)
- **Wednesday 12:00 PM**: Send early reminder (`/api/cron/softball/wednesday`) 
- **Saturday 12:00 PM**: Send game day reminder (`/api/cron/softball/saturday`)

All cron jobs run on Vercel and call Railway for WhatsApp messaging.

## 🏆 Built With

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Database**: MongoDB with Mongoose
- **Email**: SendGrid for notifications
- **WhatsApp**: Baileys library on Railway
- **Deployment**: Vercel + Railway
- **Styling**: Custom pixel art theme with Press Start 2P font
