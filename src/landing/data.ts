/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Conversation, CampaignTemplate, Campaign, JourneyNode, AiAgentConfig, Testimonial, PricingPlan, UseCase } from './types';

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    customerName: 'Priya Mehta',
    channel: 'whatsapp',
    lastMessage: 'Is the course enrollment still open for next week?',
    timestamp: 'Just now',
    unreadCount: 1,
    assignedTo: 'unassigned',
    messages: [
      { id: 'm1-1', sender: 'customer', text: 'Hey there! I saw your ad on Instagram about the Full Stack cohort.', timestamp: '10:15 AM' },
      { id: 'm1-2', sender: 'agent', text: 'Hi Priya! Yes, our next Full Stack cohort starts soon. Let me know if you want the details.', timestamp: '10:18 AM' },
      { id: 'm1-3', sender: 'customer', text: 'Is the course enrollment still open for next week?', timestamp: '10:30 AM' }
    ],
    status: 'active',
  },
  {
    id: 'conv-2',
    customerName: 'Rahul Verma',
    channel: 'instagram',
    lastMessage: 'Can I track my order #7731? It was shipped on Tuesday.',
    timestamp: '2m ago',
    unreadCount: 0,
    assignedTo: 'ai',
    messages: [
      { id: 'm2-1', sender: 'customer', text: 'Hello, need some help with my order.', timestamp: 'Yesterday' },
      { id: 'm2-2', sender: 'ai', text: 'Hi Rahul! 🤖 I can help you track your order. Please reply with your Order ID starting with #.', timestamp: 'Yesterday' },
      { id: 'm2-3', sender: 'customer', text: 'Can I track my order #7731? It was shipped on Tuesday.', timestamp: '2 years or 2 minutes ago' }
    ],
    status: 'active',
  },
  {
    id: 'conv-3',
    customerName: 'Amit Shah',
    channel: 'telegram',
    lastMessage: 'What are the premium subscription charges?',
    timestamp: '15m ago',
    unreadCount: 0,
    assignedTo: 'ai',
    messages: [
      { id: 'm3-1', sender: 'customer', text: 'Hello, what are your premium community sub rates?', timestamp: '11:00 AM' },
      { id: 'm3-2', sender: 'ai', text: 'Hi Amit! 🤖 Our pricing starts from ₹1,999/month for the Starter plan and ₹4,999/month for the Growth plan.', timestamp: '11:02 AM' },
      { id: 'm3-3', sender: 'customer', text: 'What are the premium subscription charges?', timestamp: '11:15 AM' }
    ],
    status: 'active'
  },
  {
    id: 'conv-4',
    customerName: 'Vikram Grover',
    channel: 'messenger',
    lastMessage: 'Do you offer a refund if I cancel in 3 days?',
    timestamp: '1h ago',
    unreadCount: 0,
    assignedTo: 'unassigned',
    messages: [
      { id: 'm4-1', sender: 'customer', text: 'Hey, quick question about your cancelation policy.', timestamp: '10:00 AM' }
    ],
    status: 'active'
  },
  {
    id: 'conv-5',
    customerName: 'Sneha Rao',
    channel: 'email',
    lastMessage: 'Invoice request for April 2026 contract.',
    timestamp: '4h ago',
    unreadCount: 0,
    assignedTo: 'agent',
    messages: [
      { id: 'm5-1', sender: 'customer', text: 'Can you please supply the tax receipt/invoice for our enterprise subscription bought last Tuesday?', timestamp: '07:05 AM' },
      { id: 'm5-2', sender: 'agent', text: 'Sure Sneha, let me fetch that for you from our billing desk.', timestamp: '07:15 AM' }
    ],
    status: 'active'
  }
];

export const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-1',
    name: 'Dussehra Festive Broadcast',
    templateId: 'tmpl-1',
    targetAudience: 'Active Shoppers (Delhi NCR)',
    sentCount: 4280,
    deliveredCount: 4190,
    readCount: 2921,
    repliedCount: 847,
    status: 'completed',
    scheduledTime: 'Finished yesterday'
  },
  {
    id: 'camp-2',
    name: 'Webinar Re-engagement Blast',
    templateId: 'tmpl-2',
    targetAudience: 'Incomplete Signups',
    sentCount: 1532,
    deliveredCount: 1480,
    readCount: 924,
    repliedCount: 312,
    status: 'completed',
    scheduledTime: '2 days ago'
  },
  {
    id: 'camp-3',
    name: 'Early-Bird Summer Launch',
    templateId: 'tmpl-1',
    targetAudience: 'All Registered Newsletter (Email & WA)',
    sentCount: 0,
    deliveredCount: 0,
    readCount: 0,
    repliedCount: 0,
    status: 'scheduled',
    scheduledTime: '2026-06-10 at 10:00 AM'
  }
];

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    id: 'tmpl-1',
    name: 'Festive Offer Discount 15%',
    channel: 'whatsapp',
    status: 'approved',
    bodyText: '🌟 Festive Special! Hey {{name}}, get flat 15% off all premium plans this weekend. Use code FESTIVE15. Click below to chat with an assistant or buy directly!',
    category: 'Marketing'
  },
  {
    id: 'tmpl-2',
    name: 'Cart Recovery Reminder',
    channel: 'whatsapp',
    status: 'approved',
    bodyText: 'Hey {{name}}, we noticed you left some awesome items in your cart. 🛒 Grab them now before they sell out! Use code SAVE10 for free shipping.',
    category: 'Utility'
  },
  {
    id: 'tmpl-3',
    name: 'Instagram DM Auto-discount',
    channel: 'instagram',
    status: 'approved',
    bodyText: 'Thanks for mentioning us! Promo Code is THANKYOU10. Head to checkout now.',
    category: 'Marketing'
  }
];

export const JOURNEY_NODES: JourneyNode[] = [
  {
    id: 'j-1',
    type: 'trigger',
    title: 'Trigger: Contact Created',
    description: 'When a new customer connects on WhatsApp, Instagram, or Telegram',
    colorType: 'purple',
    nextNodes: ['j-2']
  },
  {
    id: 'j-2',
    type: 'action',
    title: 'Send Welcome Template',
    description: 'Instantly dispatch configured channel-specific welcome message',
    colorType: 'blue',
    nextNodes: ['j-3']
  },
  {
    id: 'j-3',
    type: 'condition',
    title: 'Wait 1 Hour',
    description: 'Pause execution for 1 hour to give the contact time to read',
    colorType: 'orange',
    nextNodes: ['j-4']
  },
  {
    id: 'j-4',
    type: 'condition',
    title: 'Message Status: Replied?',
    description: 'Check if the customer provided a response to the welcome message',
    colorType: 'orange',
    nextNodes: ['j-5', 'j-6']
  },
  {
    id: 'j-5',
    type: 'action',
    title: 'Assign to Sales Agent',
    description: 'Route to active human representative for professional closing',
    colorType: 'blue'
  },
  {
    id: 'j-6',
    type: 'agent',
    title: 'Deploy AI Agent Step',
    description: 'Activate AI Chatbot Sara or Max to engage, qualify, and answer FAQs',
    colorType: 'teal',
    nextNodes: ['j-7']
  },
  {
    id: 'j-7',
    type: 'action',
    title: 'Send Follow-up Prompt',
    description: 'Send gentle nudge or promo voucher code automatically',
    colorType: 'blue'
  }
];

export const AI_AGENTS_CONFIG: AiAgentConfig[] = [
  {
    id: 'agent-max',
    name: 'Max',
    role: 'Lead Capture',
    icon: '🎯',
    accentColor: '#0284c7', // Violet
    isActive: true,
    kbDocs: ['pricing-plans.pdf', 'product-catalog-2026.docx', 'faqs.txt'],
    description: 'Greets new contacts, asks qualifying questions, captures details, tags them, and routes hot leads to sales instantly.',
    stats: {
      resolutionRate: '94%',
      chatsHandled: '1,420',
      satisfaction: '98%'
    },
    sampleQuestions: [
      'What is your budget?',
      'Can you share your email?',
      'Let’s qualify your inquiry.',
      'Suggest a plan for a team of 10.'
    ],
    systemPrompt: `You are Max, the Lead Capture AI agent for ConvoSync.
Your tone is professional, cheerful, and highly structured.
Your core tasks:
1. Greet the user warmly and introduce yourself as Max from ConvoSync.
2. Ask for their business name and primary communication bottleneck.
3. Help map them to the best plan: Starter or Growth. Encourage the Growth plan because it supports all 5 channels and priority support.
4. Politely request their professional email and WhatsApp number to schedule a demo.
Keep responses concise (max 2-3 sentences).`
  },
  {
    id: 'agent-sara',
    name: 'Sara',
    role: 'Customer Service',
    icon: '🎧',
    accentColor: '#0084FF', // Messenger Blue
    isActive: true,
    kbDocs: ['shipping-return-policy.txt', 'refund-terms.pdf', 'help-center-v2.md'],
    description: 'Answers product questions, tracks orders, handles returns, resolves complaints using your FAQ and docs, with smart human escalation.',
    stats: {
      resolutionRate: '87%',
      chatsHandled: '3,842',
      satisfaction: '96%'
    },
    sampleQuestions: [
      'Can I cancel anytime?',
      'Do you support Indian payment mechanisms (INR)?',
      'What happens if my agent count exceeds the allowance?',
      'How does the 14-day free trial work?'
    ],
    systemPrompt: `You are Sara, the master Support AI agent for ConvoSync.
Your tone is incredibly helpful, patient, empathetic, and clear.
Answers to common queries:
- Billing/Free Trial: Yes, we offer a 14-day 100% free trial. No credit card is needed to register and start.
- India Pricing: Standard INR options, Starter at ₹1,999/mo or Growth at ₹4,999/mo. Pay directly in INR with Indian credit cards, UPI, or NetBanking!
- Per-message fees: We charge absolutely zero markup on your messages. You pay only your Meta WhatsApp API fees directly.
- Escalation: If they ask to speak to a person, say "I can connect you with an expert. One moment..."`
  },
  {
    id: 'agent-aria',
    name: 'Aria',
    role: 'Shop Assistant',
    icon: '🛍️',
    accentColor: '#25D366', // Channel Green
    isActive: true,
    kbDocs: ['storefront-prices.csv', 'spring-inventory.xml', 'coupons.txt'],
    description: 'Helps customers find products, displays inventory, adds items to cart, and issues secure payment links directly on chat.',
    stats: {
      resolutionRate: '81%',
      chatsHandled: '942',
      satisfaction: '94%'
    },
    sampleQuestions: [
      'Do you have any discount code?',
      'What products do you support?',
      'Can you send me a checkout link?',
      'Do you have physical store locations?'
    ],
    systemPrompt: `You are Aria, the bubbly and energetic Shop Assistant AI for ConvoSync.
Your tone is fun, enthusiastic, and highly helpful for commerce. Use shopping emojis (🛒, ✨, 🛍️) delightfully.
Help guide the conversation:
- Recommend finding product fits.
- Inform them about the ConvoSync Starter package (₹1,999/mo) or Growth package (₹4,999/mo).
- Help them generate a customized checkout link by collecting their preferred package.
Keep interactions upbeat, fast-paced, and engaging!`
  },
  {
    id: 'agent-custom',
    name: 'Build Your Own',
    role: 'Custom',
    icon: '⚙️',
    accentColor: '#F59E0B', // Warning Orange
    isActive: false,
    kbDocs: [],
    description: 'Train a fully custom AI agent on your proprietary business rules, appointment scheduler, or specific localized CRM integrations.',
    stats: {
      resolutionRate: 'Infinite',
      chatsHandled: '0 (New)',
      satisfaction: 'TBD'
    },
    sampleQuestions: [
      'How to upload proprietary database?',
      'Can I connect my Google Calendar?',
      'Do you support webhooks?'
    ],
    systemPrompt: 'You are a custom configured AI bot helper guide.'
  }
];

export const USE_CASES: UseCase[] = [
  {
    id: 'edtech',
    title: 'EdTech & Education',
    description: 'Automate student registration enquiries on WhatsApp and Instagram around the clock. Your AI agent handles routine questions regarding batches and schedules, while visual journeys auto-send EMI payment alerts.',
    subFeatures: '🤖 24/7 Course advisors • 📊 Enrollment tracking • ⚡ Staggered payment reminders',
    metrics: '3x more admissions | 70% less support load',
    imageAlt: 'School and Academy admissions hub mockup'
  },
  {
    id: 'ecommerce',
    title: 'E-commerce & D2C Brands',
    description: 'Run conversational storefront commerce on WhatsApp and Instagram DM. Trigger abandoned cart reminder flows with tailored discount codes and automatically track order shipments through instant updates.',
    subFeatures: '🛍️ Direct catalog share • 🔄 Cart rescue automation • 📦 Shipping tracking API',
    metrics: '23% cart recovery | 68% campaign open rate',
    imageAlt: 'E-commerce chat catalog checkout flow illustration'
  },
  {
    id: 'healthcare',
    title: 'Healthcare & Clinics',
    description: 'Emporwer patients to seamlessly schedule appointments on WhatsApp and Messenger. AI answers diagnostic pre-requisites and patient safety instructions, sending automated, friendly prescription reminders.',
    subFeatures: '📅 Interactive calendar sync • 🏥 HIPAA compliance guard • ⚡ Auto appointment notifications',
    metrics: '40% fewer no-shows | 80% queries auto-resolved',
    imageAlt: 'Clinic booking assistance system visualization'
  },
  {
    id: 'realestate',
    title: 'Real Estate & Builders',
    description: 'Pre-qualify and filter leads originating from Click-To-WhatsApp (CTWA) property ad portals. AI identifies buyer specifications, home budgets, and timing ranges, delivering brochures instantly.',
    subFeatures: '🎯 Instant qualification bot • 🏠 Automated brochures dispatch • 📞 Hot leads human warning',
    metrics: '5x more qualified leads',
    imageAlt: 'Real estate buyer qualification flow mockup'
  },
  {
    id: 'salons',
    title: 'Salons & Wellness Spas',
    description: 'Completely eliminate booking friction through an interactive booking automation flow. Request loyalty surveys after spa experiences and broadcast flash discounts to local customers on slow weekdays.',
    subFeatures: '🧴 Automated parlor time scheduler • 📈 Post-visit reviews • 📤 Mid-week flash broadcasts',
    metrics: '2x repeat bookings',
    imageAlt: 'Salons queue and scheduling manager visualization'
  },
  {
    id: 'fintech',
    title: 'Fintech & BFSI',
    description: 'Integrate loan calculators, compliance document checklists, and credit scoring pipelines inside secure WhatsApp API sandboxes. Safely auto-send monthly loan repayment or EMI payment guidelines.',
    subFeatures: '📄 Automated doc collection • 🛡️ Secure encrypted transaction channels • 🚨 Repayment campaign blasts',
    metrics: '60% faster loan processing',
    imageAlt: 'Secure finance check assistant mockup'
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 't-1',
    quote: "Campaign open rates went from 18% (email) to 67% (WhatsApp). ConvoSync paid for itself in the first week.",
    author: 'Priya Mehta',
    role: 'Marketing Manager',
    company: 'Saffron D2C Brand',
    location: 'Mumbai'
  },
  {
    id: 't-2',
    quote: "AI appointment booking saved us 4 hours of phone calls every single day. Patients love the WhatsApp promptness.",
    author: 'Rahul Nair',
    role: 'Operations Head',
    company: 'Apex Clinic Chain',
    location: 'Bengaluru'
  },
  {
    id: 't-3',
    quote: "CTWA ads + AI lead capture = our cost per qualified lead dropped by 60%. Nothing else comes close to this efficiency.",
    author: 'Anjali Singh',
    role: 'CEO',
    company: 'Uptown Real Estate Agency',
    location: 'Gurugram'
  }
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    priceMonthly: 1999,
    priceAnnual: 1599, // 2 months free equivalent approx (1,999 * 10 / 12)
    description: 'Perfect for small teams and direct storefronts getting started.',
    features: [
      '2,000 m-synced Contacts',
      '3 core Channels (WA + IG + 1 more)',
      '3 human Team Agents',
      '1 active AI Agent role',
      'Basic broadcast campaigns',
      'Visual Journey Builder',
      'Email and chat support'
    ],
    ctaText: 'Start 14-day Free Trial'
  },
  {
    id: 'growth',
    name: 'Growth',
    priceMonthly: 4999,
    priceAnnual: 3999, // 2 months free equivalent approx (4,999 * 10 / 12)
    description: 'Optimized for high-volume scale-ups and customer service centers.',
    features: [
      '10,000 sync-safe Contacts',
      'All 5 Channels connected simultanously',
      '10 human Team Agents included',
      '3 AI Agents with custom training',
      'Advanced Campaign builders + CTWA ads integration',
      'Custom Journey automation + real-time diagnostics',
      'WhatsApp + Instagram bulk broadcasts',
      'Priority assistance support (4hr SLA)'
    ],
    ctaText: 'Start 14-day Free Trial',
    isPopular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 0, // Treated specially
    priceAnnual: 0,
    description: 'Custom configurations, high-security limits, and agency white-labels.',
    features: [
      'Unlimited contacts & volume sync',
      'Unlimited human human agents & permissions',
      'Unlimited custom AI Agents',
      'Custom CRM integrations & full agency white-labeling',
      'Dedicated Customer Success Account Manager',
      '99.9% guaranteed uptime SLA response',
      'On-premise hybrid cloud hosting'
    ],
    ctaText: 'Talk to Sales'
  }
];
