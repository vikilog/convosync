import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Bot,
  CalendarCheck,
  Inbox,
  MessageSquare,
  Smartphone,
  User,
  Users,
  Wifi,
} from 'lucide-react';
import type {
  BenefitItem,
  ImportantNote,
  OnboardingProgressStep,
  RequirementItem,
  SetupTimelineStep,
} from './businessApiOnboardingData';

export const COEXISTENCE_PROGRESS_STEPS: OnboardingProgressStep[] = [
  { id: 1, label: 'Requirements' },
  { id: 2, label: 'Connect WhatsApp' },
  { id: 3, label: 'Grant Permissions' },
  { id: 4, label: 'Sync Data' },
  { id: 5, label: 'Complete' },
];

export const COEXISTENCE_TRUST_BADGES = [
  'Official Meta Integration',
  'No Number Migration Required',
  'Continue Using Mobile App',
] as const;

export const COEXISTENCE_REQUIREMENTS: RequirementItem[] = [
  {
    id: 'active-app',
    title: 'Active WhatsApp Business App',
    description: 'Your number must already be registered on WhatsApp Business App.',
    icon: MessageSquare,
  },
  {
    id: 'mobile',
    title: 'Mobile Device Access',
    description: 'You will need access to the phone that contains the WhatsApp Business account.',
    icon: Smartphone,
  },
  {
    id: 'internet',
    title: 'Stable Internet Connection',
    description: 'Required during the connection process.',
    icon: Wifi,
  },
  {
    id: 'facebook',
    title: 'Facebook Account',
    description: 'Used for Meta authorization during setup.',
    icon: User,
  },
];

export const COEXISTENCE_BENEFITS: BenefitItem[] = [
  {
    id: 'inbox',
    title: 'Shared Team Inbox',
    description: 'Allow multiple staff members to manage conversations.',
    icon: Inbox,
  },
  {
    id: 'ai',
    title: 'AI Assistant',
    description: 'Automatically answer common customer questions.',
    icon: Bot,
  },
  {
    id: 'booking',
    title: 'Appointment Booking',
    description: 'Customers can book services directly through WhatsApp.',
    icon: CalendarCheck,
  },
  {
    id: 'sync',
    title: 'Contact Synchronization',
    description: 'Sync customer contacts and conversations.',
    icon: Users,
  },
  {
    id: 'management',
    title: 'Conversation Management',
    description: 'Handle all chats from a centralized dashboard.',
    icon: MessageSquare,
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Track customer engagement and team performance.',
    icon: BarChart3,
  },
];

export type CoexistenceChannelFeature = {
  id: string;
  label: string;
};

export const COEXISTENCE_MOBILE_FEATURES: CoexistenceChannelFeature[] = [
  { id: 'reply', label: 'Continue replying from phone' },
  { id: 'notify', label: 'Receive notifications' },
  { id: 'chats', label: 'Access existing chats' },
];

export const COEXISTENCE_PLATFORM_FEATURES: CoexistenceChannelFeature[] = [
  { id: 'team', label: 'Team access' },
  { id: 'ai', label: 'AI automation' },
  { id: 'reporting', label: 'Reporting' },
  { id: 'campaigns', label: 'Campaigns' },
];

export const COEXISTENCE_IMPORTANT_NOTES: ImportantNote[] = [
  {
    id: 'app-continues',
    message: 'Your existing WhatsApp Business App will continue working normally.',
  },
  {
    id: 'history',
    message: 'No chat history will be deleted.',
  },
  {
    id: 'disconnect',
    message: 'You can disconnect the integration at any time.',
  },
  {
    id: 'permissions',
    message: 'Some Meta permissions may be required during setup.',
  },
];

export const COEXISTENCE_CONNECTION_TIMELINE: SetupTimelineStep[] = [
  {
    step: 1,
    title: 'Login with Meta',
    description: 'Authenticate with the Facebook account linked to your business.',
  },
  {
    step: 2,
    title: 'Select your WhatsApp Business account',
    description: 'Choose the WhatsApp Business App profile you want to connect.',
  },
  {
    step: 3,
    title: 'Grant required permissions',
    description: 'Approve access so the platform can sync messages and contacts.',
  },
  {
    step: 4,
    title: 'Sync account information',
    description: 'Import your number, profile, and conversation data securely.',
  },
  {
    step: 5,
    title: 'Start managing WhatsApp from the platform',
    description: 'Your team can collaborate while you keep using the mobile app.',
  },
];

export type { LucideIcon };
