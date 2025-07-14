export interface RSVP {
  _id: string;
  playerName: string;
  status: RSVPStatus;
  comment?: string;
  createdAt: string;
}

export type RSVPStatus = 'yes' | 'no' | 'maybe';

export interface RSVPFormData {
  playerName: string;
  status: RSVPStatus;
  comment: string;
}

export interface RSVPFormProps {
  onRSVPSubmitted: () => void;
}

export interface RSVPListProps {
  rsvps: RSVP[];
} 