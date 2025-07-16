import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing Redis connection...');
    
    // Check environment variables
    const envVars = {
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
      KV_REST_API_URL: process.env.KV_REST_API_URL,
      KV_KV_REST_API_URL: process.env.KV_KV_REST_API_URL,
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ? '***[PRESENT]***' : 'NOT SET',
      KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? '***[PRESENT]***' : 'NOT SET',
      KV_KV_REST_API_TOKEN: process.env.KV_KV_REST_API_TOKEN ? '***[PRESENT]***' : 'NOT SET',
    };
    
    console.log('Environment variables:', envVars);
    
    // Try to determine which variables to use
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || process.env.KV_KV_REST_API_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || process.env.KV_KV_REST_API_TOKEN;
    
    if (!redisUrl || !redisToken) {
      return NextResponse.json({
        success: false,
        error: 'Redis environment variables not found',
        envVars,
        redisUrl: redisUrl ? 'PRESENT' : 'MISSING',
        redisToken: redisToken ? 'PRESENT' : 'MISSING'
      }, { status: 500 });
    }
    
    console.log('Using Redis URL:', redisUrl?.substring(0, 20) + '...');
    console.log('Token available:', !!redisToken);
    
    // Test Redis connection
    const redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });
    
    // Test basic operations
    const testKey = 'redis-test-' + Date.now();
    const testValue = 'test-value-' + Date.now();
    
    console.log('Testing Redis SET operation...');
    await redis.set(testKey, testValue, { ex: 60 }); // 1 minute expiry
    
    console.log('Testing Redis GET operation...');
    const retrievedValue = await redis.get(testKey);
    
    console.log('Testing Redis DEL operation...');
    await redis.del(testKey);
    
    const success = retrievedValue === testValue;
    
    return NextResponse.json({
      success,
      message: success ? 'Redis connection successful!' : 'Redis test failed',
      envVars,
      testResults: {
        setValue: testValue,
        retrievedValue,
        match: success
      },
      redisConfig: {
        url: redisUrl?.substring(0, 20) + '...',
        hasToken: !!redisToken
      }
    });
    
  } catch (error) {
    console.error('❌ Redis test error:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      stack: (error as Error).stack,
      envVars: {
        UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ? 'PRESENT' : 'NOT SET',
        KV_REST_API_URL: process.env.KV_REST_API_URL ? 'PRESENT' : 'NOT SET',
        KV_KV_REST_API_URL: process.env.KV_KV_REST_API_URL ? 'PRESENT' : 'NOT SET',
        UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ? 'PRESENT' : 'NOT SET',
        KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? 'PRESENT' : 'NOT SET',
        KV_KV_REST_API_TOKEN: process.env.KV_KV_REST_API_TOKEN ? 'PRESENT' : 'NOT SET',
      }
    }, { status: 500 });
  }
} 