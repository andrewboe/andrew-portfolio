# WhatsApp Baileys Setup for Vercel

This guide will help you set up WhatsApp functionality using Baileys on Vercel with persistent authentication.

> **Note:** This setup uses Upstash Redis (formerly Vercel KV) for authentication storage. The code automatically supports both old KV_* and new UPSTASH_REDIS_* environment variable names for seamless compatibility.

## Prerequisites

- Vercel account
- WhatsApp mobile app
- Node.js 18+

## Local Development Support

The implementation now supports both local development and production environments:

### Local Development
- **No KV required**: For local development, authentication state is stored in memory
- **QR codes**: Displayed in terminal and available via API
- **Automatic fallback**: Code detects when KV is unavailable and uses local storage

### Production (Vercel)
- **Persistent storage**: Uses Upstash Redis for authentication state
- **Serverless compatible**: Works with Vercel's serverless functions
- **Auto-reconnection**: Handles connection drops gracefully

## 1. Upstash Redis Setup (Vercel KV Replacement)

### Create an Upstash Redis Database
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to your project
3. Go to "Storage" tab
4. Click "Create Database"
5. Select "Upstash for Redis" (this replaced the old KV option)
6. Give it a name (e.g., `whatsapp-auth`)
7. Choose your preferred region (closer to your users = better performance)
8. Click "Create"

### Get Upstash Environment Variables
After creating the Upstash Redis database, Vercel will provide you with:
- `KV_REST_API_URL` (or `UPSTASH_REDIS_REST_URL`)
- `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_TOKEN`)
- `KV_URL` (or `UPSTASH_REDIS_URL`)

**Note:** The `@vercel/kv` package works seamlessly with Upstash Redis, so no code changes are needed.

## 2. Environment Variables Setup

Add the following environment variables to your Vercel project:

### Required Variables:
```env
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# SendGrid (for email notifications)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=your_verified_sender_email

# WhatsApp
WHATSAPP_GROUP_ID=your_whatsapp_group_id@g.us

# Upstash Redis (auto-generated when you create Upstash Redis database)
# These may be named KV_* or UPSTASH_REDIS_* depending on your setup
KV_REST_API_URL=https://your-upstash-url.upstash.io
KV_REST_API_TOKEN=your_upstash_token
KV_URL=redis://your-redis-url

# Alternative naming (use whichever Vercel provides):
# UPSTASH_REDIS_REST_URL=https://your-upstash-url.upstash.io
# UPSTASH_REDIS_REST_TOKEN=your_upstash_token
# UPSTASH_REDIS_URL=redis://your-redis-url

# App URL
NEXT_PUBLIC_APP_URL=https://your-app-url.vercel.app
```

### Optional Variables:
```env
# For admin panel authentication
ADMIN_PASSWORD=your_admin_password
```

## 3. Initial WhatsApp Authentication

### Step 1: Deploy to Vercel
1. Deploy your app to Vercel with the environment variables set
2. Wait for deployment to complete

### Step 2: Authenticate WhatsApp
1. Go to your deployed app's admin panel: `https://your-app.vercel.app/softball`
2. Enter admin credentials (if set up)
3. Look for the "WhatsApp Connection Status" section
4. Click "Get QR Code for Setup"
5. Scan the QR code with WhatsApp mobile app:
   - Open WhatsApp → Settings → Linked Devices
   - Tap "Link a Device"
   - Scan the QR code displayed on your admin panel

### Step 3: Verify Connection
1. Once scanned, the connection status should show "Connected"
2. Test the connection by clicking "Test WhatsApp Message"
3. You should receive a test message in your WhatsApp group

## 4. How It Works

### Authentication Storage
- WhatsApp authentication credentials are stored in Upstash Redis (via Vercel's integration)
- This persists across serverless function executions
- Automatic reconnection handles temporary disconnections

### Serverless Considerations
- Each API call initializes the WhatsApp connection if needed
- Connection state is maintained globally within each serverless function
- QR codes are temporarily stored in KV for retrieval

### Connection Flow
1. First request triggers WhatsApp initialization
2. If not authenticated, QR code is generated and stored in Upstash Redis
3. After scanning QR code, credentials are saved to Upstash Redis
4. Subsequent requests use stored credentials for reconnection

## 5. API Endpoints

### Available Endpoints:
- `GET /api/whatsapp/status` - Check connection status
- `GET /api/whatsapp/qr` - Get QR code for authentication
- `POST /api/whatsapp/test` - Send test message
- `GET /api/whatsapp/groups` - List WhatsApp groups

### Cron Jobs:
- `GET /api/cron/softball/wednesday` - Send Wednesday reminders
- `GET /api/cron/softball/saturday` - Send Saturday reminders
- `POST /api/cron/softball/reset` - Reset weekly RSVPs

## 6. Troubleshooting

### Common Issues:

#### "QR Code Expired"
- QR codes expire after 5 minutes
- Click "Get QR Code for Setup" again to generate a new one

#### "Connection Lost"
- WhatsApp connections can drop due to inactivity
- The system automatically attempts to reconnect
- Check connection status and re-authenticate if needed

#### "Cannot read properties of undefined (reading 'public')"
- This indicates corrupted authentication state
- **Solution**: Use "Clear Auth State" button in admin panel
- **Root cause**: Authentication data was incomplete or corrupted
- **Prevention**: Ensure stable internet during initial setup

#### "QR Code Not Appearing"
- Check that QR code generation is working via terminal (local development)
- Verify API endpoint `/api/whatsapp/qr` is accessible
- **Solution**: Clear auth state and try again
- **Local development**: QR code should appear in terminal

#### "Failed to send message"
- Verify WhatsApp group ID is correct and ends with `@g.us`
- Ensure your WhatsApp account is not banned/restricted
- Check that the group exists and you're a member

#### "Upstash Redis Storage Errors"
- Verify Upstash Redis environment variables are set correctly
- Check Vercel Storage dashboard for any Upstash Redis issues
- Ensure you have sufficient Upstash Redis storage quota

### Debugging Steps:
1. Check Vercel function logs for detailed error messages
2. Use the connection status endpoint to verify authentication
3. **Use "Clear Auth State" button** if connection keeps failing
4. Test with a simple message first
5. Verify all environment variables are set correctly

### New Troubleshooting Features:
- **Clear Auth State**: Removes corrupted authentication data
- **Connection Status**: Real-time connection monitoring
- **QR Code Regeneration**: Get new QR codes when needed
- **Local Development Support**: Works without KV setup
- **Automatic Retry Logic**: Clears corrupted state after 5 failed attempts

## 7. Maintenance

### Regular Tasks:
- Monitor connection status via admin panel
- Re-authenticate if connection is lost for extended periods
- Check Upstash Redis usage to ensure within limits

### Security Notes:
- Never commit authentication files to version control
- Upstash Redis stores sensitive WhatsApp credentials securely
- Use environment variables for all sensitive data
- Consider IP restrictions for admin endpoints

## 8. Scaling Considerations

### Vercel Limits:
- Function execution time: 10 seconds (Hobby), 60 seconds (Pro)
- Function size: 50MB
- Upstash Redis storage: varies by plan (check your Upstash dashboard)

### Optimization:
- Connection pooling reduces cold start times
- QR code caching minimizes API calls
- Automatic retry logic handles temporary failures

## 9. Support

If you encounter issues:
1. Check Vercel function logs
2. Verify environment variables (both KV_* and UPSTASH_REDIS_* variants)
3. Test WhatsApp connection status
4. Review Upstash Redis storage usage in your Vercel dashboard
5. Consult Baileys documentation for WhatsApp-specific issues

## 10. Additional Features

### Future Enhancements:
- Multi-device support
- Message scheduling
- Rich media support (images, documents)
- Webhook integration
- Message analytics

Your WhatsApp integration should now work seamlessly with Vercel's serverless architecture! 