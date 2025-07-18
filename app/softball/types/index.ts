export interface RSVP {
  _id: string;
  name: string;
  status: RSVPStatus;
  comments?: string;
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