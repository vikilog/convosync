import {
  Calendar,
  FileSpreadsheet,
  HardDrive,
  Mail,
  MapPin,
  Video,
  type LucideIcon,
} from 'lucide-react';

export type GoogleToolProduct =
  | 'calendar'
  | 'business_profile'
  | 'sheets'
  | 'drive'
  | 'gmail'
  | 'meet';

/** Primary Google Tools workspace tabs (top navigation). */
export const GOOGLE_TOOLS_MAIN_TABS = [
  'calendar',
  'sheets',
  'drive',
  'gmail',
  'meet',
] as const satisfies readonly GoogleToolProduct[];

export type GoogleToolsMainTab = (typeof GOOGLE_TOOLS_MAIN_TABS)[number];

export function isGoogleToolsMainTab(value: string): value is GoogleToolsMainTab {
  return (GOOGLE_TOOLS_MAIN_TABS as readonly string[]).includes(value);
}

export const GOOGLE_TOOLS_CHANGED_EVENT = 'convosync:google-tools-changed';

export const GOOGLE_TOOL_META: Record<
  GoogleToolProduct,
  { label: string; shortLabel: string; icon: LucideIcon; description: string }
> = {
  calendar: {
    label: 'Google Calendar',
    shortLabel: 'Calendar',
    icon: Calendar,
    description: 'View and manage workspace calendar events.',
  },
  business_profile: {
    label: 'Google Business Profile',
    shortLabel: 'Business Profile',
    icon: MapPin,
    description: 'Manage locations and business profile data.',
  },
  sheets: {
    label: 'Google Sheets',
    shortLabel: 'Sheets',
    icon: FileSpreadsheet,
    description: 'Read and write spreadsheet data.',
  },
  drive: {
    label: 'Google Drive',
    shortLabel: 'Drive',
    icon: HardDrive,
    description: 'Browse and manage Drive files.',
  },
  gmail: {
    label: 'Gmail',
    shortLabel: 'Gmail',
    icon: Mail,
    description: 'Send and read email from connected accounts.',
  },
  meet: {
    label: 'Google Meet',
    shortLabel: 'Meet',
    icon: Video,
    description: 'Create and manage Meet links.',
  },
};

export function isGoogleToolProduct(value: string): value is GoogleToolProduct {
  return value in GOOGLE_TOOL_META;
}

export function notifyGoogleToolsChanged(): void {
  window.dispatchEvent(new Event(GOOGLE_TOOLS_CHANGED_EVENT));
}
