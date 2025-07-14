export async function testReset(token: string) {
  try {
    const response = await fetch('/api/rsvp/reset', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to reset RSVPs');
    }

    console.log('Reset successful:', data.message);
    return data;
  } catch (error) {
    console.error('Reset failed:', error);
    throw error;
  }
} 