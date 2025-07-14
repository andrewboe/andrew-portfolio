import React, { useState } from 'react';
import { resetAllRSVPs } from '../api/rsvpApi';
import { useAdmin } from '../context/AdminContext';

export default function ResetButton() {
  const { token } = useAdmin();
  const [isResetting, setIsResetting] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all RSVPs? This cannot be undone.')) {
      return;
    }

    setIsResetting(true);
    setStatus({ type: null, message: '' });

    try {
      const result = await resetAllRSVPs(token!);
      setStatus({
        type: 'success',
        message: result.message
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to reset RSVPs'
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleReset}
        disabled={isResetting}
        className={`w-full px-3 py-1.5 text-sm border border-white/20 rounded shadow-sm backdrop-blur-sm
          transition-all duration-200
          ${isResetting 
            ? 'bg-black/30 cursor-not-allowed' 
            : 'bg-red-500/20 hover:bg-red-500/40'} 
          text-white/80 hover:text-white`}
      >
        {isResetting ? 'Resetting...' : 'Reset All RSVPs'}
      </button>

      {status.type && (
        <div className={`mt-2 p-2 rounded text-xs ${
          status.type === 'success' 
            ? 'bg-green-500/20 text-green-200' 
            : 'bg-red-500/20 text-red-200'
        }`}>
          <p>{status.message}</p>
        </div>
      )}
    </div>
  );
} 