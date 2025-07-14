import { RSVP, RSVPFormData } from '../types';

export async function fetchRSVPs(): Promise<RSVP[]> {
  const response = await fetch('/api/rsvp');
  if (!response.ok) {
    throw new Error('Failed to fetch RSVPs');
  }
  return response.json();
}

export async function submitRSVP(formData: RSVPFormData): Promise<RSVP> {
  const response = await fetch('/api/rsvp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    throw new Error('Failed to submit RSVP');
  }

  return response.json();
}

export async function resetAllRSVPs(token: string): Promise<{ message: string }> {
  const response = await fetch('/api/rsvp/reset', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to reset RSVPs');
  }

  return response.json();
} 