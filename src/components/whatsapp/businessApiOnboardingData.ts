import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Bot,
  Building2,
  CalendarCheck,
  FileCheck2,
  Globe,
  Inbox,
  Link2,
  MessageSquare,
  Phone,
  Plug,
  User,
  Wifi,
} from 'lucide-react';

export type OnboardingProgressStep = {
  id: number;
  label: string;
};

export const BUSINESS_API_PROGRESS_STEPS: OnboardingProgressStep[] = [
  { id: 1, label: 'Requirements' },
  { id: 2, label: 'Connect Meta Account' },
  { id: 3, label: 'Configure WhatsApp Number' },
  { id: 4, label: 'Verification' },
  { id: 5, label: 'Complete' },
];

export type RequirementItem = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const BUSINESS_API_REQUIREMENTS: RequirementItem[] = [
  {
    id: 'facebook',
    title: 'Facebook Account',
    description: 'An active Facebook account with access to Business Manager.',
    icon: User,
  },
  {
    id: 'business-info',
    title: 'Business Information',
    description: 'Business name, address, website, email, and company details.',
    icon: Building2,
  },
  {
    id: 'phone',
    title: 'Phone Number',
    description: 'A phone number that can receive OTP verification.',
    icon: Phone,
  },
  {
    id: 'documents',
    title: 'Business Verification Documents',
    description: 'Required if Meta requests business verification.',
    icon: FileCheck2,
  },
  {
    id: 'internet',
    title: 'Stable Internet Connection',
    description: 'Needed during the onboarding process.',
    icon: Wifi,
  },
];

export type BenefitItem = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const BUSINESS_API_BENEFITS: BenefitItem[] = [
  {
    id: 'ai',
    title: 'AI Agents',
    description: 'Automate customer conversations.',
    icon: Bot,
  },
  {
    id: 'booking',
    title: 'Appointment Booking',
    description: 'Allow customers to book directly through WhatsApp.',
    icon: CalendarCheck,
  },
  {
    id: 'inbox',
    title: 'Team Inbox',
    description: 'Multiple staff members can manage conversations.',
    icon: Inbox,
  },
  {
    id: 'campaigns',
    title: 'Campaigns',
    description: 'Send marketing and promotional messages.',
    icon: MessageSquare,
  },
  {
    id: 'integrations',
    title: 'Integrations',
    description: 'Connect CRM, ERP, and other business systems.',
    icon: Plug,
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Track message performance and engagement.',
    icon: BarChart3,
  },
];

export type SetupTimelineStep = {
  step: number;
  title: string;
  description: string;
};

export const BUSINESS_API_SETUP_TIMELINE: SetupTimelineStep[] = [
  {
    step: 1,
    title: 'Connect your Facebook account',
    description: 'Sign in with the Facebook profile that manages your business assets.',
  },
  {
    step: 2,
    title: 'Select or create a Meta Business Account',
    description: 'Choose the Business Manager portfolio that will own your WhatsApp assets.',
  },
  {
    step: 3,
    title: 'Register a WhatsApp Business Account',
    description: 'Create or link the WhatsApp Business Account inside Meta Business Suite.',
  },
  {
    step: 4,
    title: 'Verify your phone number using OTP',
    description: 'Confirm ownership with a one-time code sent to your business number.',
  },
  {
    step: 5,
    title: 'Complete setup and start messaging customers',
    description: 'Finish configuration and activate automation on your connected number.',
  },
];

export type ImportantNote = {
  id: string;
  message: string;
};

export const BUSINESS_API_IMPORTANT_NOTES: ImportantNote[] = [
  {
    id: 'number-exclusive',
    message:
      'The selected phone number cannot already be connected to another WhatsApp Business API account.',
  },
  {
    id: 'verification',
    message: 'Meta may request business verification for higher messaging limits.',
  },
  {
    id: 'pricing',
    message: 'Messaging charges are billed according to Meta pricing.',
  },
];
