export type WhatsAppConnectionType = 'business_api' | 'app_coexistence';

export type ConnectionTypeCardData = {
  type: WhatsAppConnectionType;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  bestFor: string[];
  badge: string;
  ctaLabel: string;
};
