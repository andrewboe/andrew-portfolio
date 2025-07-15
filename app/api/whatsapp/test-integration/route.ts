import { NextResponse } from 'next/server';
import { runAllTests } from '../../../lib/test-baileys-integration';

export async function GET() {
  try {
    console.log('🧪 Running Baileys integration tests...');
    
    const testResults = await runAllTests();
    
    return NextResponse.json({
      success: testResults.overall,
      message: testResults.overall 
        ? 'All Baileys integration tests passed! ✅' 
        : 'Some tests failed. Check logs for details. ❌',
      results: testResults,
      details: {
        baileys: testResults.baileys ? 'Socket creation and auth state work' : 'Socket or auth issues',
        idFormats: testResults.idFormats ? 'WhatsApp ID formats valid' : 'ID format issues',
        serialization: testResults.serialization ? 'Redis serialization works' : 'Serialization issues'
      },
      recommendations: testResults.overall ? [] : [
        !testResults.baileys && 'Check Redis connection and Baileys dependencies',
        !testResults.idFormats && 'Verify WhatsApp ID format handling',
        !testResults.serialization && 'Check Redis serialization functions'
      ].filter(Boolean)
    });
    
  } catch (error) {
    console.error('❌ Error running integration tests:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to run integration tests',
      details: error instanceof Error ? {
        name: error.name,
        message: error.message
      } : 'Unknown error',
      recommendations: [
        'Check that all dependencies are installed',
        'Verify Redis environment variables are set',
        'Ensure Baileys is properly configured'
      ]
    }, { status: 500 });
  }
} 