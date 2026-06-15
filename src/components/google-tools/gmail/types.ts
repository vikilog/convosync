export type GmailFolder = 'inbox' | 'starred' | 'sent' | 'drafts' | 'trash';

export type GmailMessageSummary = {
  id: string;
  threadId: string | null;
  snippet: string | null;
  labelIds: string[];
  internalDate: string | null;
  from: string;
  to: string;
  subject: string;
  date: string;
  isUnread: boolean;
  isStarred: boolean;
};

export type GmailMessageDetail = GmailMessageSummary & {
  bodyText: string;
  bodyHtml: string;
};

export type GmailIntegration = {
  connectionId: string;
  connectionEmail: string | null;
  lastSyncAt: string | null;
};

export type GmailFolderCounts = Partial<Record<GmailFolder, number>>;
