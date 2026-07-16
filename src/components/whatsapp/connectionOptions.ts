import type { ConnectionTypeCardData } from './types';

export const WHATSAPP_CONNECTION_OPTIONS: ConnectionTypeCardData[] = [
  {
    type: 'business_api',
    title: 'WhatsApp Business API',
    subtitle:
      'Best for automation, AI agents, chatbots, CRM integrations, and scalable customer communication.',
    description:
      'Connect a dedicated WhatsApp number to our platform and unlock advanced automation capabilities.',
    features: [
      'AI Agent Support',
      'Chatbot Automation',
      'API Access',
      'Webhooks & Integrations',
      'Multi-Agent Team Inbox',
      'Appointment & Booking Automation',
      'Marketing Campaigns',
      'Analytics & Reporting',
    ],
    bestFor: [
      'Salons with multiple branches',
      'Businesses handling high message volume',
      'Companies using AI assistants',
      'SaaS integrations',
    ],
    badge: 'Recommended for Growth',
    ctaLabel: 'Get Started',
  },
  {
    type: 'app_coexistence',
    title: 'WhatsApp Business App Coexistence',
    subtitle: 'Use your existing WhatsApp Business App while enabling automation features.',
    description:
      'Keep using WhatsApp on your mobile phone while connecting the same number to our platform.',
    features: [
      'Keep Existing Number',
      'Continue Using Mobile App',
      'Shared Team Inbox',
      'AI Agent Assistance',
      'Customer Contact Sync',
      'No Need To Migrate Number',
      'Easy Setup',
    ],
    bestFor: [
      'Existing WhatsApp Business users',
      'Small businesses',
      'Teams that still reply from mobile',
      'Businesses migrating gradually',
    ],
    badge: 'Easy Setup',
    ctaLabel: 'Get Started',
    comingSoon: true,
  },
];
