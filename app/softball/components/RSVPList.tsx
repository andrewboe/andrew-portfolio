import React, { useState } from 'react';
import { RSVP, RSVPListProps, RSVPStatus } from '../types';
import { STATUS_COLORS } from '../constants';
import CommentText from './CommentText';

export default function RSVPList({ rsvps }: RSVPListProps) {
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  // Group RSVPs by status
  const groupedRSVPs = {
    yes: rsvps.filter(rsvp => rsvp.status === 'yes'),
    no: rsvps.filter(rsvp => rsvp.status === 'no'),
    maybe: rsvps.filter(rsvp => rsvp.status === 'maybe')
  };

  const toggleComment = (id: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-background/80 backdrop-blur-sm p-6 border-2 border-primary/30 shadow-pixel">
        <h2 className="text-xl text-white mb-6 text-center">Current RSVPs</h2>
        
        {/* RSVP counts */}
        <div className="flex justify-around mb-6">
          {Object.entries(groupedRSVPs).map(([status, statusRSVPs]) => (
            <div key={status} className="text-center">
              <div className="text-2xl text-white">{statusRSVPs.length}</div>
              <div className="text-sm text-white uppercase">{status}</div>
            </div>
          ))}
        </div>

        {/* RSVP list */}
        <div className="space-y-6">
          {Object.entries(groupedRSVPs).map(([status, statusRSVPs]) => (
            <div key={status} className="space-y-2">
              {statusRSVPs.map((rsvp) => (
                <div
                  key={rsvp._id}
                  className="bg-black/50 border-2 border-primary/30 p-4 shadow-pixel"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white">{rsvp.playerName}</span>
                    <span className={`px-2 py-1 text-xs text-white ${STATUS_COLORS[status as RSVPStatus]} shadow-pixel uppercase`}>
                      {status}
                    </span>
                  </div>
                  {rsvp.comment && (
                    <div className="mt-2 text-sm text-gray-300">
                      <CommentText 
                        text={rsvp.comment}
                        isExpanded={expandedComments.has(rsvp._id)}
                        onToggle={() => toggleComment(rsvp._id)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 