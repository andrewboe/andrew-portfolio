import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';

async function testWhatsAppMessage(token: string) {
  const response = await fetch('/api/whatsapp/local-test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      message: '🤖 Test message from WhatsApp Bot'
      // No 'to' field - server will use WHATSAPP_GROUP_ID from environment
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to send WhatsApp message');
  }

  return data;
}

async function fetchWhatsAppGroups(token: string) {
  // For now, return placeholder since we're using clean local setup
  return { 
    success: true, 
    groups: [{ id: 'local-group', name: 'Local Development Group' }] 
  };
}

async function fetchQRCode(token: string) {
  const response = await fetch('/api/whatsapp/local-test?action=qr', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch QR code');
  }

  return data;
}

async function fetchConnectionStatus(token: string) {
  const response = await fetch('/api/whatsapp/local-test?action=status', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch connection status');
  }

  return data;
}

async function clearAuthState(token: string) {
  const response = await fetch('/api/whatsapp/local-test?action=clear', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to clear auth state');
  }

  return data;
}

export default function WhatsAppTestButtons() {
  const { token } = useAdmin();
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [qrCode, setQRCode] = useState<string | null>(null);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    apiResponse?: any;
  }>({ type: null, message: '' });

  // Check connection status on component mount
  useEffect(() => {
    if (token) {
      checkConnectionStatus();
    }
  }, [token]);

  const checkConnectionStatus = async () => {
    try {
      const result = await fetchConnectionStatus(token!);
      setConnectionStatus(result);
      
      // Don't automatically fetch QR code - let user request it manually
      // This prevents automatic WhatsApp connection on page load
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  };

  const handleTestMessage = async () => {
    setIsLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const result = await testWhatsAppMessage(token!);
      setStatus({
        type: 'success',
        message: result.message,
        apiResponse: result.response
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

  const handleFetchGroups = async () => {
    setIsLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const result = await fetchWhatsAppGroups(token!);
      setStatus({
        type: 'success',
        message: result.message || 'Groups fetched successfully',
        apiResponse: result.groups
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch WhatsApp groups'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetQRCode = async () => {
    setIsLoading(true);
    setStatus({ type: null, message: '' });
    setQRCode(null); // Clear existing QR code

    try {
      const result = await fetchQRCode(token!);
      if (result.success) {
        setQRCode(result.qr);
        setStatus({
          type: 'success',
          message: 'QR code retrieved. Scan with WhatsApp mobile app.'
        });
      } else {
        setStatus({
          type: 'error',
          message: result.error || 'Failed to get QR code'
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch QR code'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAuthState = async () => {
    if (!confirm('Are you sure you want to clear the authentication state? This will require re-scanning the QR code.')) {
      return;
    }

    setIsLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const result = await clearAuthState(token!);
      setStatus({
        type: 'success',
        message: result.message || 'Auth state cleared successfully'
      });
      
      // Clear local state
      setConnectionStatus(null);
      setQRCode(null);
      
      // Refresh connection status
      setTimeout(() => {
        checkConnectionStatus();
      }, 1000);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to clear auth state'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Connection Status */}
      <div className="mb-4 p-3 rounded border border-white/20 bg-black/20">
        <h3 className="text-sm font-bold text-white/90 mb-2">WhatsApp Connection Status</h3>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${connectionStatus?.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-white/70">
            {connectionStatus?.isConnected ? 'Connected' : 'Not Connected'}
          </span>
          <button
            onClick={checkConnectionStatus}
            className="ml-auto text-xs px-2 py-1 border border-white/20 rounded hover:bg-white/10"
          >
            Refresh
          </button>
        </div>
        {connectionStatus?.user && (
          <p className="text-xs text-white/60 mt-1">
            User: {connectionStatus.user.name || connectionStatus.user.id}
          </p>
        )}
      </div>

      {/* QR Code Display */}
      {qrCode && !connectionStatus?.isConnected && (
        <div className="mb-4 p-3 rounded border border-white/20 bg-black/20">
          <h3 className="text-sm font-bold text-white/90 mb-2">Scan QR Code</h3>
          <div className="bg-white p-2 rounded">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}`} 
              alt="WhatsApp QR Code" 
              className="w-full max-w-[200px] mx-auto"
            />
          </div>
          <p className="text-xs text-white/60 mt-2">
            Scan this QR code with WhatsApp mobile app → Settings → Linked Devices
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {!connectionStatus?.isConnected && (
          <button
            onClick={handleGetQRCode}
            disabled={isLoading}
            className={`w-full px-3 py-1.5 text-sm border border-white/20 rounded shadow-sm backdrop-blur-sm
              transition-all duration-200
              ${isLoading 
                ? 'bg-black/30 cursor-not-allowed' 
                : 'bg-yellow-500/20 hover:bg-yellow-500/40'} 
              text-white/80 hover:text-white`}
          >
            {isLoading ? 'Getting QR...' : 'Get QR Code for Setup'}
          </button>
        )}

        <button
          onClick={handleTestMessage}
          disabled={isLoading || !connectionStatus?.isConnected}
          className={`w-full px-3 py-1.5 text-sm border border-white/20 rounded shadow-sm backdrop-blur-sm
            transition-all duration-200
            ${isLoading || !connectionStatus?.isConnected
              ? 'bg-black/30 cursor-not-allowed' 
              : 'bg-blue-500/20 hover:bg-blue-500/40'} 
            text-white/80 hover:text-white`}
        >
          {isLoading ? 'Sending...' : 'Test WhatsApp Message (Baileys)'}
        </button>

        <button
          onClick={handleFetchGroups}
          disabled={isLoading || !connectionStatus?.isConnected}
          className={`w-full px-3 py-1.5 text-sm border border-white/20 rounded shadow-sm backdrop-blur-sm
            transition-all duration-200
            ${isLoading || !connectionStatus?.isConnected
              ? 'bg-black/30 cursor-not-allowed' 
              : 'bg-green-500/20 hover:bg-green-500/40'} 
            text-white/80 hover:text-white`}
        >
          {isLoading ? 'Fetching...' : 'Fetch WhatsApp Groups'}
        </button>

        {/* Troubleshooting Section */}
        <div className="mt-4 pt-2 border-t border-white/20">
          <p className="text-xs text-white/60 mb-2">Troubleshooting:</p>
          <button
            onClick={handleClearAuthState}
            disabled={isLoading}
            className={`w-full px-3 py-1.5 text-sm border border-white/20 rounded shadow-sm backdrop-blur-sm
              transition-all duration-200
              ${isLoading 
                ? 'bg-black/30 cursor-not-allowed' 
                : 'bg-red-500/20 hover:bg-red-500/40'} 
              text-white/80 hover:text-white`}
          >
            {isLoading ? 'Clearing...' : 'Clear Auth State'}
          </button>
        </div>
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