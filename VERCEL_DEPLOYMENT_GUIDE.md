# Vercel Deployment Guide - WhatsApp Bot Integration

## 🚀 Overview

Your WhatsApp bot has been completely refactored to work seamlessly with Vercel's serverless environment. The previous file-based authentication and persistent connection approach has been replaced with a Redis-based, serverless-compatible system.

## ✅ Key Changes Made

### 1. **Redis-Based Authentication System**
- **New File**: `app/lib/redis-auth-state.ts`
- Replaces Baileys' file-based auth with Redis storage
- Handles serialization/deserialization of authentication credentials
- Manages QR codes and connection state in Redis

### 2. **Serverless WhatsApp Manager**
- **New File**: `app/lib/whatsapp-manager.ts`
- Smart connection caching with timeout handling
- Optimized for serverless function lifecycle
- Automatic connection management and recovery

### 3. **Refactored Core Library**
- **Updated**: `app/lib/mongodb.ts`
- Removed file system dependencies (`fs.rmSync`, `./baileys_auth_info`)
- Eliminated global state variables that don't persist in serverless
- Updated all WhatsApp functions to use new Redis-based system

## 🔧 Environment Variables Required

Make sure these are set in your Vercel environment:

```bash
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# SendGrid (for contact forms)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=your_verified_sender_email

# WhatsApp Configuration
WHATSAPP_GROUP_ID=your_whatsapp_group_id@g.us
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# Redis (CRITICAL for WhatsApp functionality)
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# Alternative Redis naming (if using Vercel KV)
KV_REST_API_URL=your_kv_url
KV_REST_API_TOKEN=your_kv_token
```

## 📋 Deployment Checklist

### 1. **Upstash Redis Setup** (CRITICAL)
- [ ] Create an Upstash Redis database
- [ ] Copy the REST URL and Token to Vercel environment variables
- [ ] Test Redis connection works

### 2. **Vercel Configuration**
- [ ] Add all environment variables to Vercel dashboard
- [ ] Ensure function timeout is set appropriately (max 60s for Hobby plan)
- [ ] Deploy and test basic functionality

### 3. **WhatsApp Authentication**
- [ ] After deployment, call `/api/whatsapp/qr` to get QR code
- [ ] Scan QR with WhatsApp to authenticate
- [ ] Test message sending with `/api/whatsapp/test`

## 🔄 How It Works Now

### **Authentication Flow**
1. **QR Generation**: Call `/api/whatsapp/qr` → Creates connection → Stores QR in Redis
2. **Authentication**: Scan QR with WhatsApp → Auth credentials saved to Redis
3. **Messaging**: WhatsApp functions check Redis for auth state and connection status

### **Serverless Optimization**
- **Smart Caching**: Connections are cached for 30 seconds within the same function instance
- **State Persistence**: All state stored in Redis, not memory
- **Connection Recovery**: Automatic reconnection handling for dropped connections

### **Redis Data Structure**
```
whatsapp:creds       → Authentication credentials
whatsapp:keys        → Signal protocol keys
whatsapp:qr          → Current QR code (5min expiry)
whatsapp:connection_state → Connection status and metadata
```

## 🧪 Testing Your Deployment

### **Pre-Deployment: Test Baileys Integration**
Before deploying, test that the integration works correctly:
```bash
curl https://your-app.vercel.app/api/whatsapp/test-integration
```
This will verify:
- ✅ Redis auth state creation
- ✅ Baileys socket creation  
- ✅ Event handler setup
- ✅ WhatsApp ID format validation
- ✅ Serialization compatibility

### 1. **Test Redis Connection**
```bash
curl https://your-app.vercel.app/api/whatsapp/status
```
Should return connection status from Redis.

### 2. **Generate QR Code**
```bash
curl https://your-app.vercel.app/api/whatsapp/qr
```
Should return a QR code string for authentication.

### 3. **Test Message Sending** (after authentication)
```bash
curl -X POST https://your-app.vercel.app/api/whatsapp/test
```
Should send a test message to your configured group.

## ⚠️ Important Notes

### **Function Timeouts**
- QR generation can take up to 60 seconds
- Message sending is typically under 10 seconds
- Consider upgrading to Pro plan for longer timeouts if needed

### **Redis Costs**
- QR codes expire after 5 minutes to reduce storage
- Connection state expires after 1 hour
- Auth credentials persist until manually cleared

### **Error Handling**
- All functions now return proper error responses
- Redis failures fallback gracefully
- Connection issues are logged and handled

## 🔧 Troubleshooting

### **"Redis environment variables not found"**
- Ensure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set
- Check Vercel environment variables are deployed

### **"QR generation timed out"**
- This is normal on first deployment
- Try again after a few minutes
- Check function logs in Vercel dashboard

### **"WhatsApp not connected"**
- Generate new QR code with `/api/whatsapp/qr`
- Clear auth state with `/api/whatsapp/clear-auth` if needed
- Re-authenticate by scanning new QR

### **Messages not sending**
- Verify `WHATSAPP_GROUP_ID` format: `1234567890-1234567890@g.us`
- Check WhatsApp connection status with `/api/whatsapp/status`
- Ensure you're authenticated and connection is recent

## 🎯 Next Steps

1. **Test Integration First** - Run the integration test endpoint locally
2. **Deploy to Vercel** with the new code
3. **Set up Upstash Redis** and add environment variables  
4. **Run Integration Test** on deployed app to verify everything works
5. **Test authentication flow** by generating and scanning QR
6. **Test message functionality** with the test endpoint
7. **Monitor function logs** during initial deployment
8. **Remove test files** - Delete `/api/whatsapp/test-integration` and `/lib/test-baileys-integration.ts` for production

Your WhatsApp bot is now fully compatible with Vercel's serverless platform! 🚀

## ✅ **Verification Checklist**

Before going live, ensure:
- [ ] Integration test passes (`/api/whatsapp/test-integration`)
- [ ] Redis environment variables are set correctly
- [ ] QR code generation works (`/api/whatsapp/qr`)
- [ ] WhatsApp authentication completes successfully
- [ ] Test message sends properly (`/api/whatsapp/test`)
- [ ] All test files removed from production build 