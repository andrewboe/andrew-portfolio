import { useState, useEffect, useCallback } from 'react';
import { RSVP, RSVPFormData } from '../types';
import { fetchRSVPs, submitRSVP, resetAllRSVPs } from '../api/rsvpApi';

export function useRSVPs() {
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRSVPs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchRSVPs();
      setRsvps(data);
    } catch (err) {
      setError('Failed to load RSVPs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addRSVP = useCallback(async (formData: RSVPFormData) => {
    try {
      await submitRSVP(formData);
      await loadRSVPs(); // Refresh the list
      return true;
    } catch (err) {
      throw err;
    }
  }, [loadRSVPs]);

  const resetRSVPs = useCallback(async (token: string) => {
    try {
      const result = await resetAllRSVPs(token);
      await loadRSVPs(); // Refresh the list after reset
      return result;
    } catch (err) {
      throw err;
    }
  }, [loadRSVPs]);

  useEffect(() => {
    loadRSVPs();
  }, [loadRSVPs]);

  return {
    rsvps,
    isLoading,
    error,
    addRSVP,
    resetRSVPs,
    refreshRSVPs: loadRSVPs
  };
} 