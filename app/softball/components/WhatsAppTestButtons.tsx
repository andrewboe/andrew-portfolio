import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';

async function testWhatsAppMessage(messageType: 'wednesday' | 'saturday', token: string) {
  const response = await fetch('/api/whatsapp/test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ messageType })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to send WhatsApp message');
  }

  return data;
}

export default function WhatsAppTestButtons() {
  const { token } = useAdmin();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    apiResponse?: any;
  }>({ type: null, message: '' });

  const handleTest = async (messageType: 'wednesday' | 'saturday') => {
    setIsLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const result = await testWhatsAppMessage(messageType, token!);
      setStatus({
        type: 'success',
        message: result.message,
        apiResponse: result.apiResponse
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to send WhatsApp message'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => handleTest('wednesday')}
          disabled={isLoading}
          className={`w-full px-3 py-1.5 text-sm border border-white/20 rounded shadow-sm backdrop-blur-sm
            transition-all duration-200
            ${isLoading 
              ? 'bg-black/30 cursor-not-allowed' 
              : 'bg-blue-500/20 hover:bg-blue-500/40'} 
            text-white/80 hover:text-white`}
        >
          {isLoading ? 'Sending...' : 'Test Wednesday Message'}
        </button>

        <button
          onClick={() => handleTest('saturday')}
          disabled={isLoading}
          className={`w-full px-3 py-1.5 text-sm border border-white/20 rounded shadow-sm backdrop-blur-sm
            transition-all duration-200
            ${isLoading 
              ? 'bg-black/30 cursor-not-allowed' 
              : 'bg-blue-500/20 hover:bg-blue-500/40'} 
            text-white/80 hover:text-white`}
        >
          {isLoading ? 'Sending...' : 'Test Saturday Message'}
        </button>
      </div>

      {status.type && (
        <div className={`mt-2 p-2 rounded text-xs ${
          status.type === 'success' 
            ? 'bg-green-500/20 text-green-200' 
            : 'bg-red-500/20 text-red-200'
        }`}>
          <p>{status.message}</p>
          {status.apiResponse && (
            <pre className="mt-2 text-left overflow-auto max-h-32 font-mono bg-black/30 p-2 rounded">
              {JSON.stringify(status.apiResponse, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
} 