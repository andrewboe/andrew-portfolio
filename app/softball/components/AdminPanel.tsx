import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import ResetButton from './ResetButton';
import WhatsAppTestButtons from './WhatsAppTestButtons';

export default function AdminPanel() {
  const { isAdmin, token, login, logout } = useAdmin();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleLogin = async () => {
    const inputToken = prompt('Please enter the admin token:');
    if (!inputToken) return;

    setIsLoggingIn(true);
    setError(null);

    try {
      // Verify the token by attempting to use it
      const response = await fetch('/api/rsvp/reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${inputToken}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        login(inputToken);
        setIsExpanded(true);
      } else {
        setError(data.error || 'Invalid admin token');
      }
    } catch (error) {
      setError('Failed to verify admin token');
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleLogin}
          disabled={isLoggingIn}
          className={`px-3 py-1 text-sm border border-white/20 shadow-sm backdrop-blur-sm 
            transition-all duration-200 rounded-full
            ${isLoggingIn 
              ? 'bg-black/30 cursor-not-allowed' 
              : 'bg-black/20 hover:bg-black/40'} 
            text-white/60 hover:text-white/80`}
        >
          {isLoggingIn ? '...' : 'Admin'}
        </button>
        {error && (
          <div className="absolute bottom-full right-0 mb-2 p-2 rounded shadow-pixel bg-red-600/90 backdrop-blur-sm text-right min-w-[200px]">
            <p className="text-white text-xs">{error}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg p-4 mb-2
        transition-all duration-300 ${isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <div className="space-y-4">
          <ResetButton />
          <WhatsAppTestButtons />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-1 text-sm border border-white/20 rounded-full shadow-sm backdrop-blur-sm
            bg-black/20 hover:bg-black/40 text-white/60 hover:text-white/80 transition-all duration-200"
        >
          {isExpanded ? 'Hide' : 'Show Controls'}
        </button>
        <button
          onClick={logout}
          className="px-3 py-1 text-sm border border-white/20 rounded-full shadow-sm backdrop-blur-sm
            bg-black/20 hover:bg-black/40 text-white/60 hover:text-white/80 transition-all duration-200"
        >
          Logout
        </button>
      </div>
    </div>
  );
} 