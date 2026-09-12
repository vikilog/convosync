export const TEMPLATE_CATEGORIES = ['Utility', 'Marketing', 'Authentication'] as const
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number]

export const TEMPLATE_STATUSES = ['Draft', 'Pending', 'Approved', 'Rejected', 'Paused'] as const
export type TemplateStatus = (typeof TEMPLATE_STATUSES)[number]

export type HeaderFormat = 'none' | 'text' | 'image' | 'video' | 'document'

export type WhatsAppTemplate = {
  id: string
  name: string
  category: TemplateCategory
  status: TemplateStatus
  language: string
  headerFormat: HeaderFormat
  header: string
  body: string
  footer: string
  variableSamples: string[]
  buttonText: string
  rejectionReason?: string
  lastUpdated: string
}

export type EmailTemplate = {
  id: string
  name: string
  category: TemplateCategory
  status: TemplateStatus
  subject: string
  preview: string
  lastUpdated: string
}

export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'wa_1',
    name: 'order_confirmation',
    category: 'Utility',
    status: 'Approved',
    language: 'English',
    headerFormat: 'text',
    header: 'Order confirmed 🎉',
    body: 'Hi {{1}}, your order #{{2}} has been confirmed and will be shipped within 24 hours. Track it anytime from your account.',
    footer: 'ConvoSync Store',
    variableSamples: ['Riya', '48213'],
    buttonText: 'Track order',
    lastUpdated: '2 days ago',
  },
  {
    id: 'wa_2',
    name: 'diwali_special_offer',
    category: 'Marketing',
    status: 'Approved',
    language: 'English',
    headerFormat: 'image',
    header: '',
    body: "Diwali Special! Get {{1}}% off on your favourite picks. Offer valid till {{2}} — don't miss out!",
    footer: 'Reply STOP to unsubscribe',
    variableSamples: ['20', 'Sunday'],
    buttonText: 'Shop now',
    lastUpdated: '5 days ago',
  },
  {
    id: 'wa_3',
    name: 'otp_login',
    category: 'Authentication',
    status: 'Approved',
    language: 'English',
    headerFormat: 'none',
    header: '',
    body: 'Your ConvoSync verification code is {{1}}. This code expires in 5 minutes. Do not share it with anyone.',
    footer: '',
    variableSamples: ['482913'],
    buttonText: '',
    lastUpdated: '1 week ago',
  },
  {
    id: 'wa_4',
    name: 'cart_abandonment',
    category: 'Marketing',
    status: 'Pending',
    language: 'English',
    headerFormat: 'text',
    header: 'You left something behind 👀',
    body: 'Hi {{1}}, you still have items worth ₹{{2}} in your cart. Complete your purchase before they sell out!',
    footer: 'ConvoSync Store',
    variableSamples: ['Aman', '2,499'],
    buttonText: 'Complete purchase',
    lastUpdated: '3 hours ago',
  },
  {
    id: 'wa_5',
    name: 'feedback_request',
    category: 'Utility',
    status: 'Draft',
    language: 'English',
    headerFormat: 'none',
    header: '',
    body: 'Hi {{1}}, thanks for your recent purchase! We would love to hear your feedback — it only takes a minute.',
    footer: '',
    variableSamples: ['Priya'],
    buttonText: 'Give feedback',
    lastUpdated: '1 day ago',
  },
  {
    id: 'wa_6',
    name: 'appointment_reminder',
    category: 'Utility',
    status: 'Rejected',
    language: 'English',
    headerFormat: 'text',
    header: 'Appointment reminder',
    body: 'Hi {{1}}, this is a reminder for your appointment on {{2}} at {{3}}. Reply CONFIRM to keep your slot.',
    footer: '',
    variableSamples: ['Karan', '10 Sept', '4:00 PM'],
    buttonText: '',
    rejectionReason: 'Body text does not match the sample submitted for review.',
    lastUpdated: '4 days ago',
  },
]

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'em_1',
    name: 'Welcome Series — Email 1',
    category: 'Marketing',
    status: 'Approved',
    subject: 'Welcome to ConvoSync 👋',
    preview: 'Thanks for signing up! Here is everything you need to get started with your new workspace…',
    lastUpdated: '6 days ago',
  },
  {
    id: 'em_2',
    name: 'Monthly Newsletter',
    category: 'Marketing',
    status: 'Approved',
    subject: 'Your October roundup is here',
    preview: 'This month: new features, top customer stories, and a few tips to grow faster…',
    lastUpdated: '2 weeks ago',
  },
  {
    id: 'em_3',
    name: 'Invoice Receipt',
    category: 'Utility',
    status: 'Approved',
    subject: 'Your invoice from ConvoSync',
    preview: 'Hi there, please find attached your invoice for order #2291. Thank you for your business…',
    lastUpdated: '3 days ago',
  },
  {
    id: 'em_4',
    name: 'Re-engagement Draft',
    category: 'Marketing',
    status: 'Draft',
    subject: "We miss you — here's 15% off",
    preview: 'It has been a while! Come back and enjoy 15% off your next order, valid for 7 days…',
    lastUpdated: '1 hour ago',
  },
]
