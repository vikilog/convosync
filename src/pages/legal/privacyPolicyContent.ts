import {
  COMPANY_NAME,
  LEGAL_ENTITY,
  PRIVACY_EMAIL,
  PRODUCT_DOMAIN,
  PRODUCT_NAME,
  SUPPORT_EMAIL,
} from '../../landing/brand';
import type { LegalDocument } from './types';

const EFFECTIVE = 'June 15, 2026';

export const privacyPolicyDocument: LegalDocument = {
  title: 'Privacy Policy',
  description: `How ${PRODUCT_NAME} collects, uses, shares, and protects personal data across our platform and services.`,
  path: '/privacy',
  effectiveDate: EFFECTIVE,
  lastUpdated: EFFECTIVE,
  sections: [
    {
      id: 'introduction',
      title: '1. Introduction',
      blocks: [
        {
          type: 'paragraph',
          text: `${LEGAL_ENTITY} ("${COMPANY_NAME}", "we", "us", or "our") operates ${PRODUCT_NAME}, an omnichannel customer communication and automation platform available at ${PRODUCT_DOMAIN} and related applications (collectively, the "Service"). This Privacy Policy explains how we collect, use, disclose, and safeguard personal information when you visit our website, create an account, use the Service, or otherwise interact with us.`,
        },
        {
          type: 'paragraph',
          text: `We are committed to protecting your privacy and handling personal data in accordance with applicable laws, including the EU General Data Protection Regulation (GDPR), the UK GDPR, India's Digital Personal Data Protection Act, 2023 (DPDPA), the California Consumer Privacy Act as amended by the CPRA (CCPA/CPRA), and other global privacy frameworks where they apply.`,
        },
        {
          type: 'paragraph',
          text: `By using the Service, you acknowledge that you have read this Privacy Policy. If you do not agree with our practices, please do not use the Service.`,
        },
      ],
    },
    {
      id: 'controller',
      title: '2. Data controller & contact',
      blocks: [
        {
          type: 'paragraph',
          text: `For the purposes of applicable data protection law, ${LEGAL_ENTITY} is the data controller for personal information we process in connection with the Service, except where we act as a data processor on behalf of our business customers (see Section 8).`,
        },
        {
          type: 'list',
          items: [
            `Legal entity: ${LEGAL_ENTITY}`,
            `Product: ${PRODUCT_NAME}`,
            `Website: https://${PRODUCT_DOMAIN}`,
            `Privacy inquiries: ${PRIVACY_EMAIL}`,
            `General support: ${SUPPORT_EMAIL}`,
          ],
        },
        {
          type: 'paragraph',
          text: `If you are located in the European Economic Area (EEA), United Kingdom, or Switzerland and wish to contact us regarding data protection matters, you may email ${PRIVACY_EMAIL}. We will respond within the timeframes required by applicable law.`,
        },
      ],
    },
    {
      id: 'scope',
      title: '3. Scope of this policy',
      blocks: [
        {
          type: 'paragraph',
          text: `This Privacy Policy applies to personal information collected through our website, web application, APIs, mobile experiences, sales and marketing activities, customer support, and integrations connected to the Service.`,
        },
        {
          type: 'paragraph',
          text: `This policy does not apply to third-party websites, messaging platforms, or services that you or your organization connect to ${PRODUCT_NAME} (such as Meta, Google, or payment providers). Those services are governed by their own privacy policies. We encourage you to review them before connecting an integration.`,
        },
      ],
    },
    {
      id: 'information-we-collect',
      title: '4. Information we collect',
      blocks: [
        {
          type: 'subheading',
          text: '4.1 Information you provide directly',
        },
        {
          type: 'list',
          items: [
            'Account and profile data: name, email address, phone number, job title, company name, password (stored in hashed form), workspace preferences, and billing contact details.',
            'Organization data: company profile, team structure, user roles, permissions, and configuration settings.',
            'Communications with us: support tickets, survey responses, demo requests, and sales correspondence.',
            'Payment information: billing address and transaction metadata. Payment card details are processed by our payment partners; we do not store full card numbers on our servers.',
          ],
        },
        {
          type: 'subheading',
          text: '4.2 Information processed on behalf of customers',
        },
        {
          type: 'paragraph',
          text: `When you use ${PRODUCT_NAME} to manage customer conversations, our customers (your employer or organization) may upload or sync personal data about their end customers ("End Users"), including names, phone numbers, email addresses, message content, conversation history, tags, custom attributes, campaign engagement data, and files or media shared in chats.`,
        },
        {
          type: 'paragraph',
          text: `In these cases, your organization is typically the data controller and ${LEGAL_ENTITY} acts as a data processor, processing End User data only according to the customer's instructions and our Data Processing Agreement (DPA), where applicable.`,
        },
        {
          type: 'subheading',
          text: '4.3 Information collected automatically',
        },
        {
          type: 'list',
          items: [
            'Device and usage data: IP address, browser type, operating system, device identifiers, pages viewed, features used, timestamps, referral URLs, and diagnostic logs.',
            'Security and fraud-prevention data: authentication events, session tokens, failed login attempts, and abuse signals.',
            'Cookies and similar technologies: as described in Section 12.',
          ],
        },
        {
          type: 'subheading',
          text: '4.4 Information from third parties and integrations',
        },
        {
          type: 'paragraph',
          text: `If you connect third-party accounts or channels to the Service, we receive information authorized by you or your organization through OAuth or API permissions, which may include:`,
        },
        {
          type: 'list',
          items: [
            'Meta platforms (WhatsApp Business API, Instagram, Facebook Messenger, Meta Ads): business account IDs, page or phone number metadata, message payloads, delivery and read receipts, template status, and advertising account identifiers.',
            'Google services (Gmail, Google Business Profile, Google Meet, OAuth sign-in): account identifiers, email metadata, calendar or business listing data as permitted by the scopes you approve.',
            'Payment processors (e.g., Razorpay): transaction IDs, subscription status, and billing events.',
            'AI and infrastructure providers: prompts, responses, and usage metadata necessary to deliver AI-assisted features, subject to our agreements and security controls.',
          ],
        },
      ],
    },
    {
      id: 'how-we-use',
      title: '5. How we use personal information',
      blocks: [
        {
          type: 'paragraph',
          text: 'We use personal information for the following purposes:',
        },
        {
          type: 'list',
          items: [
            'Providing, operating, maintaining, and improving the Service, including inbox, campaigns, journeys, AI agents, analytics, and integrations.',
            'Creating and administering accounts, workspaces, and user access controls.',
            'Processing subscriptions, invoices, trials, and payment-related communications.',
            'Delivering customer support, training, and service notifications.',
            'Monitoring performance, debugging errors, ensuring security, and preventing fraud or abuse.',
            'Complying with legal obligations, enforcing our Terms of Service, and protecting our rights and those of our users.',
            'Sending product updates, security alerts, and—with your consent or where permitted—marketing communications.',
            'Generating aggregated or de-identified analytics to understand product usage and improve features.',
          ],
        },
      ],
    },
    {
      id: 'legal-bases',
      title: '6. Legal bases for processing (EEA/UK)',
      blocks: [
        {
          type: 'paragraph',
          text: 'Where GDPR or UK GDPR applies, we rely on the following legal bases:',
        },
        {
          type: 'list',
          items: [
            'Contract: processing necessary to provide the Service you or your organization requested.',
            'Legitimate interests: securing the Service, improving functionality, preventing abuse, and communicating about your account—balanced against your rights.',
            'Consent: where required for marketing emails, non-essential cookies, or certain integrations you enable.',
            'Legal obligation: tax, accounting, regulatory, or law-enforcement requests.',
            'Vital interests or public interest: only in rare circumstances permitted by law.',
          ],
        },
      ],
    },
    {
      id: 'ai-processing',
      title: '7. AI and automated processing',
      blocks: [
        {
          type: 'paragraph',
          text: `${PRODUCT_NAME} includes AI-powered features such as suggested replies, knowledge-base answers, journey automation, and agent assistance. When enabled by your organization, message content and related context may be processed by AI systems to generate responses or recommendations.`,
        },
        {
          type: 'paragraph',
          text: 'We configure AI providers under contractual terms that restrict use of customer data for training public models unless explicitly agreed otherwise. Your organization controls whether and how AI features are enabled for its workspace.',
        },
        {
          type: 'paragraph',
          text: 'We do not make solely automated decisions that produce legal or similarly significant effects about individuals without appropriate human oversight, except as configured by the customer within the Service.',
        },
      ],
    },
    {
      id: 'sharing',
      title: '8. How we share personal information',
      blocks: [
        {
          type: 'paragraph',
          text: 'We do not sell personal information. We share personal information only in the following circumstances:',
        },
        {
          type: 'list',
          items: [
            'Service providers & subprocessors: cloud hosting, email delivery, analytics, customer support tools, payment processing, AI infrastructure, and security vendors that process data on our behalf under written agreements requiring appropriate safeguards.',
            'Integrated platforms: when you connect channels (e.g., Meta, Google), data flows according to your authorization and the platform\'s policies.',
            'Within your organization: administrators and authorized team members in your workspace can access data according to role permissions.',
            'Business transfers: in connection with a merger, acquisition, financing, or sale of assets, subject to confidentiality and notice where required.',
            'Legal and safety: to comply with law, court orders, or governmental requests; to enforce our agreements; or to protect the rights, property, or safety of users, the public, or our company.',
            'With your consent: when you direct us to share information or connect a third-party integration.',
          ],
        },
        {
          type: 'subheading',
          text: '8.1 Subprocessor categories',
        },
        {
          type: 'paragraph',
          text: 'Our subprocessors may include providers for: cloud infrastructure and databases; transactional and subscription billing; email and notification delivery; AI model APIs; logging and monitoring; and identity or OAuth services. A current list may be provided upon request to privacy@' + PRODUCT_DOMAIN + '.',
        },
      ],
    },
    {
      id: 'international-transfers',
      title: '9. International data transfers',
      blocks: [
        {
          type: 'paragraph',
          text: `${LEGAL_ENTITY} is based in India and may process personal information in India and other countries where we or our subprocessors operate. These countries may have data protection laws different from those in your jurisdiction.`,
        },
        {
          type: 'paragraph',
          text: 'Where required, we implement appropriate safeguards for cross-border transfers, such as Standard Contractual Clauses (SCCs), UK International Data Transfer Addendum, or other lawful transfer mechanisms recognized under applicable law.',
        },
      ],
    },
    {
      id: 'retention',
      title: '10. Data retention',
      blocks: [
        {
          type: 'paragraph',
          text: 'We retain personal information for as long as necessary to fulfill the purposes described in this policy, unless a longer retention period is required or permitted by law.',
        },
        {
          type: 'list',
          items: [
            'Account data: retained while your account is active and for a reasonable period thereafter to resolve disputes, enforce agreements, and meet legal obligations.',
            'Customer conversation data: retained according to your organization\'s settings and our agreement; deleted or anonymized upon account termination subject to backup cycles and legal holds.',
            'Logs and security records: typically retained for a limited period unless needed for investigations or compliance.',
            'Marketing preferences: retained until you unsubscribe or object.',
          ],
        },
        {
          type: 'paragraph',
          text: 'When data is no longer needed, we delete or anonymize it in accordance with our retention schedules and technical capabilities.',
        },
      ],
    },
    {
      id: 'security',
      title: '11. Security',
      blocks: [
        {
          type: 'paragraph',
          text: 'We implement administrative, technical, and organizational measures designed to protect personal information, including encryption in transit (TLS), access controls, role-based permissions, audit logging, and secure development practices.',
        },
        {
          type: 'paragraph',
          text: 'No method of transmission or storage is completely secure. You are responsible for maintaining the confidentiality of your credentials and configuring workspace access appropriately. Please notify us immediately at ' + SUPPORT_EMAIL + ' if you suspect unauthorized access.',
        },
      ],
    },
    {
      id: 'cookies',
      title: '12. Cookies and tracking technologies',
      blocks: [
        {
          type: 'paragraph',
          text: 'We use cookies, local storage, and similar technologies to operate the Service, remember preferences, authenticate sessions, and analyze usage.',
        },
        {
          type: 'list',
          items: [
            'Strictly necessary: required for login, security, and core functionality.',
            'Functional: remember settings such as language or workspace preferences.',
            'Analytics: help us understand how the Service is used so we can improve it.',
            'Marketing: only where enabled and subject to your consent where required by law.',
          ],
        },
        {
          type: 'paragraph',
          text: 'You can control cookies through your browser settings. Disabling certain cookies may limit functionality. Where required, we present a cookie consent mechanism for non-essential cookies.',
        },
      ],
    },
    {
      id: 'your-rights',
      title: '13. Your privacy rights',
      blocks: [
        {
          type: 'paragraph',
          text: 'Depending on your location, you may have the following rights regarding your personal information:',
        },
        {
          type: 'list',
          items: [
            'Access: request a copy of personal information we hold about you.',
            'Rectification: request correction of inaccurate or incomplete data.',
            'Erasure: request deletion of personal information, subject to legal exceptions.',
            'Restriction: request limited processing in certain circumstances.',
            'Portability: receive personal information in a structured, machine-readable format where applicable.',
            'Objection: object to processing based on legitimate interests or direct marketing.',
            'Withdraw consent: where processing is based on consent, without affecting prior lawful processing.',
            'Complaint: lodge a complaint with your local supervisory authority.',
          ],
        },
        {
          type: 'paragraph',
          text: `To exercise rights relating to your ${PRODUCT_NAME} account, contact ${PRIVACY_EMAIL}. If you are an End User of one of our customers, please contact that organization directly; we will assist them in responding where we act as processor.`,
        },
        {
          type: 'subheading',
          text: '13.1 California residents (CCPA/CPRA)',
        },
        {
          type: 'paragraph',
          text: 'California residents have rights to know, delete, correct, and opt out of the "sale" or "sharing" of personal information as defined by California law. We do not sell personal information. You may designate an authorized agent to submit requests on your behalf. We will verify requests as required by law and will not discriminate against you for exercising your rights.',
        },
        {
          type: 'subheading',
          text: '13.2 India (DPDPA)',
        },
        {
          type: 'paragraph',
          text: 'Where India\'s Digital Personal Data Protection Act applies, data principals may have rights to access, correction, erasure, grievance redressal, and nomination. You may contact our grievance officer at ' + PRIVACY_EMAIL + ' for applicable requests.',
        },
      ],
    },
    {
      id: 'children',
      title: '14. Children\'s privacy',
      blocks: [
        {
          type: 'paragraph',
          text: `The Service is intended for businesses and is not directed to children under 16 (or the minimum age required in your jurisdiction). We do not knowingly collect personal information from children. If you believe a child has provided us personal information, contact ${PRIVACY_EMAIL} and we will take appropriate steps to delete it.`,
        },
      ],
    },
    {
      id: 'third-party-links',
      title: '15. Third-party links and platforms',
      blocks: [
        {
          type: 'paragraph',
          text: 'The Service may contain links to third-party websites or enable messaging through third-party platforms. We are not responsible for the privacy practices of those third parties. Your use of WhatsApp, Instagram, Facebook, Google, Telegram, and other channels is also subject to their terms and policies, including Meta\'s Business Messaging Policy where applicable.',
        },
      ],
    },
    {
      id: 'changes',
      title: '16. Changes to this policy',
      blocks: [
        {
          type: 'paragraph',
          text: 'We may update this Privacy Policy from time to time. When we make material changes, we will post the updated policy on this page and update the "Last updated" date. Where required by law, we will provide additional notice (such as email or in-product notification). Continued use of the Service after changes become effective constitutes acknowledgment of the updated policy.',
        },
      ],
    },
    {
      id: 'contact',
      title: '17. Contact us',
      blocks: [
        {
          type: 'paragraph',
          text: `If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact:`,
        },
        {
          type: 'list',
          items: [
            `${LEGAL_ENTITY}`,
            `Email: ${PRIVACY_EMAIL}`,
            `Support: ${SUPPORT_EMAIL}`,
            `Website: https://${PRODUCT_DOMAIN}`,
          ],
        },
      ],
    },
  ],
};