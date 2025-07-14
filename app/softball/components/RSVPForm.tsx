import React, { useState } from 'react';
import { RSVPFormProps, RSVPFormData, RSVPStatus } from '../types';
import { STATUS_BUTTON_STYLES, MAX_COMMENT_LENGTH } from '../constants';
import BaseballAnimation from './BaseballAnimation';

export default function RSVPForm({ onRSVPSubmitted }: RSVPFormProps) {
  const [formData, setFormData] = useState<RSVPFormData>({
    playerName: '',
    status: 'maybe',
    comment: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
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

      // Show baseball animation
      setShowAnimation(true);
      setTimeout(() => setShowAnimation(false), 3000);

      // Reset form
      setFormData({
        playerName: '',
        status: 'maybe',
        comment: ''
      });
      
      // Notify parent component
      onRSVPSubmitted();
    } catch (err) {
      setError('Failed to submit RSVP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusStyles = (status: RSVPStatus) => {
    const baseStyles = "px-4 py-2 border-2 shadow-pixel uppercase transition-all duration-200";
    return formData.status === status
      ? `${baseStyles} ${STATUS_BUTTON_STYLES[status]}`
      : `${baseStyles} bg-black/50 text-white border-primary/30 hover:bg-primary/20`;
  };

  return (
    <>
      {showAnimation && <BaseballAnimation />}
      <div className="w-full max-w-md mx-auto bg-background/80 backdrop-blur-sm p-6 border-2 border-primary/30 shadow-pixel">
        {error && (
          <div className="mb-4 p-3 bg-red-500/50 border-2 border-red-500 text-white text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Player Name Input */}
          <div className="space-y-2">
            <label htmlFor="playerName" className="block text-sm text-white">
              Player Name
            </label>
            <input
              type="text"
              id="playerName"
              value={formData.playerName}
              onChange={(e) => setFormData({ ...formData, playerName: e.target.value })}
              className="w-full px-3 py-2 bg-black/50 border-2 border-primary/30 text-white focus:outline-none focus:border-primary shadow-pixel"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* RSVP Status */}
          <div className="space-y-2">
            <label className="block text-sm text-white">
              Will you be there?
            </label>
            <div className="flex gap-4 justify-center">
              {(['yes', 'no', 'maybe'] as RSVPStatus[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFormData({ ...formData, status })}
                  className={getStatusStyles(status)}
                  disabled={isSubmitting}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Comment Input */}
          <div className="space-y-2">
            <label htmlFor="comment" className="block text-sm text-white">
              Comments (Optional) - {MAX_COMMENT_LENGTH - formData.comment.length} characters remaining
            </label>
            <textarea
              id="comment"
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value.slice(0, MAX_COMMENT_LENGTH) })}
              className="w-full px-3 py-2 bg-black/50 border-2 border-primary/30 text-white focus:outline-none focus:border-primary shadow-pixel resize-y min-h-[120px]"
              placeholder="Running late? Can only play one game? Let us know!"
              disabled={isSubmitting}
              style={{ scrollbarWidth: 'none' }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`w-full px-6 py-3 bg-primary text-white border-2 border-primary/30 shadow-pixel transition-colors ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/90'
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit RSVP'}
          </button>
        </form>
      </div>
    </>
  );
} 