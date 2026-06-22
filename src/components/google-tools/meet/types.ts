export type MeetIntegration = {
  connectionId: string;
  connectionEmail: string | null;
  lastSyncAt: string | null;
};

export type MeetAttendee = {
  email?: string | null;
  displayName?: string | null;
  responseStatus?: string | null;
  organizer?: boolean;
};

export type MeetMeeting = {
  id: string;
  summary?: string | null;
  description?: string | null;
  htmlLink?: string | null;
  start: string | null;
  end: string | null;
  durationMinutes: number | null;
  meetLink: string | null;
  status: 'upcoming' | 'live' | 'past' | 'cancelled';
  attendees: MeetAttendee[];
  organizer: string | null;
  location?: string | null;
};

export type MeetTab = 'upcoming' | 'today' | 'past' | 'all';
