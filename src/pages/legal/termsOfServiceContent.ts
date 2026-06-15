import {
  LEGAL_EMAIL,
  LEGAL_ENTITY,
  PRIVACY_EMAIL,
  PRODUCT_DOMAIN,
  PRODUCT_NAME,
  SUPPORT_EMAIL,
} from '../../landing/brand';
import type { LegalDocument } from './types';

const EFFECTIVE = 'June 15, 2026';

export const termsOfServiceDocument: LegalDocument = {
  title: 'Terms of Service',
  description: `Terms and conditions governing your access to and use of ${PRODUCT_NAME}.`,
  path: '/terms',
  effectiveDate: EFFECTIVE,
  lastUpdated: EFFECTIVE,
  sections: [
    {
      id: 'agreement',
      title: '1. Agreement to terms',
      blocks: [
        {
          type: 'paragraph',
          text: `These Terms of Service ("Terms") constitute a legally binding agreement between you and ${LEGAL_ENTITY} ("${PRODUCT_NAME}", "we", "us", or "our") governing your access to and use of the ${PRODUCT_NAME} platform, website at ${PRODUCT_DOMAIN}, APIs, and related services (collectively, the "Service").`,
        },
        {
          type: 'paragraph',
          text: 'By creating an account, clicking "I agree," connecting an integration, or using the Service, you accept these Terms. If you are accepting on behalf of a company or organization, you represent that you have authority to bind that entity, and "you" refers to that entity.',
        },
        {
          type: 'paragraph',
          text: `If you do not agree to these Terms, you must not access or use the Service. Our Privacy Policy at https://${PRODUCT_DOMAIN}/privacy explains how we handle personal data and is incorporated into these Terms by reference.`,
        },
      ],
    },
    {
      id: 'eligibility',
      title: '2. Eligibility',
      blocks: [
        {
          type: 'paragraph',
          text: 'You must be at least 18 years old (or the age of majority in your jurisdiction) and capable of forming a binding contract to use the Service. The Service is designed for business use. You may not use the Service if you are barred under applicable law or if we have previously suspended or terminated your account for violation of these Terms.',
        },
      ],
    },
    {
      id: 'service-description',
      title: '3. Description of the Service',
      blocks: [
        {
          type: 'paragraph',
          text: `${PRODUCT_NAME} provides software for omnichannel customer communication, including shared inbox, contact management, campaign broadcasting, journey automation, AI-assisted responses, analytics, and integrations with messaging and business platforms.`,
        },
        {
          type: 'paragraph',
          text: 'We may modify, update, or discontinue features from time to time. We will use reasonable efforts to provide advance notice of material changes that adversely affect paid features, except where changes are required for security, legal compliance, or third-party platform requirements.',
        },
      ],
    },
    {
      id: 'account',
      title: '4. Accounts and security',
      blocks: [
        {
          type: 'list',
          items: [
            'You must provide accurate, current, and complete registration information and keep it updated.',
            'You are responsible for safeguarding login credentials and for all activity under your account.',
            'You must promptly notify us at ' + SUPPORT_EMAIL + ' of any unauthorized access or security breach.',
            'Workspace administrators may invite team members and assign roles; you are responsible for permissions you grant within your organization.',
            'We may suspend or terminate accounts that violate these Terms or pose security or legal risk.',
          ],
        },
      ],
    },
    {
      id: 'subscriptions',
      title: '5. Subscriptions, trials, and billing',
      blocks: [
        {
          type: 'subheading',
          text: '5.1 Plans and trials',
        },
        {
          type: 'paragraph',
          text: 'Certain features require a paid subscription. We may offer free trials or promotional plans with specified duration and limits. At the end of a trial, continued use may require selecting a paid plan.',
        },
        {
          type: 'subheading',
          text: '5.2 Fees and payment',
        },
        {
          type: 'paragraph',
          text: 'Fees are quoted on our website or order form and may be billed monthly or annually in advance unless otherwise stated. Payments are processed through third-party payment providers (such as Razorpay). You authorize us and our payment partners to charge applicable fees, taxes, and usage-based charges to your designated payment method.',
        },
        {
          type: 'subheading',
          text: '5.3 Renewals and cancellation',
        },
        {
          type: 'paragraph',
          text: 'Subscriptions renew automatically at the end of each billing period unless cancelled before the renewal date through your account settings or by contacting support. Cancellation stops future charges but does not entitle you to a refund for the current period except as stated in Section 5.4 or required by law.',
        },
        {
          type: 'subheading',
          text: '5.4 Refunds',
        },
        {
          type: 'paragraph',
          text: 'Except where required by applicable law or explicitly stated in a separate agreement, all fees are non-refundable. If you believe you were charged in error, contact ' + SUPPORT_EMAIL + ' within thirty (30) days of the charge.',
        },
        {
          type: 'subheading',
          text: '5.5 Taxes',
        },
        {
          type: 'paragraph',
          text: 'Fees are exclusive of applicable taxes (including GST, VAT, or sales tax). You are responsible for taxes associated with your purchase, except taxes based on our net income.',
        },
        {
          type: 'subheading',
          text: '5.6 Usage limits and overages',
        },
        {
          type: 'paragraph',
          text: 'Plans may include limits on messages, contacts, seats, AI usage, or other metrics. Exceeding limits may require upgrading your plan or incurring additional charges as disclosed at purchase or in your workspace.',
        },
      ],
    },
    {
      id: 'customer-data',
      title: '6. Customer data and privacy',
      blocks: [
        {
          type: 'paragraph',
          text: '"Customer Data" means data you or your End Users submit to the Service, including contact records, message content, files, and configuration data.',
        },
        {
          type: 'paragraph',
          text: `You retain ownership of Customer Data. You grant us a worldwide, non-exclusive license to host, process, transmit, and display Customer Data solely to provide and improve the Service, comply with law, and as described in our Privacy Policy (${PRIVACY_EMAIL}).`,
        },
        {
          type: 'paragraph',
          text: 'You are responsible for ensuring that you have all necessary rights, consents, and legal bases to collect and process Customer Data through the Service, including compliance with messaging platform policies and applicable privacy laws.',
        },
      ],
    },
    {
      id: 'acceptable-use',
      title: '7. Acceptable use policy',
      blocks: [
        {
          type: 'paragraph',
          text: 'You agree not to, and not to permit others to:',
        },
        {
          type: 'list',
          items: [
            'Use the Service for unlawful, fraudulent, harassing, defamatory, obscene, or discriminatory purposes.',
            'Send spam, unsolicited bulk messages, or messages without valid consent where required by law or platform policy.',
            'Violate WhatsApp Business Messaging Policy, Meta Platform Terms, Google API Services User Data Policy, or other integrated platform rules.',
            'Transmit malware, phishing content, or material that infringes intellectual property or privacy rights.',
            'Attempt to gain unauthorized access to systems, accounts, or data; probe or scan networks without permission.',
            'Reverse engineer, decompile, or attempt to extract source code except where permitted by law.',
            'Resell, sublicense, or provide the Service to third parties except as expressly authorized.',
            'Use the Service to build a competing product using non-public aspects of the Service.',
            'Circumvent usage limits, security measures, or billing mechanisms.',
            'Use AI features to generate unlawful content or impersonate individuals without disclosure where required.',
          ],
        },
        {
          type: 'paragraph',
          text: 'We may investigate violations and cooperate with law enforcement or platform providers. Violations may result in immediate suspension or termination without refund.',
        },
      ],
    },
    {
      id: 'platform-terms',
      title: '8. Third-party platforms and integrations',
      blocks: [
        {
          type: 'paragraph',
          text: 'The Service enables connections to third-party platforms including Meta (WhatsApp, Instagram, Facebook), Google, Telegram, email providers, and payment processors. Your use of those integrations is subject to the third party\'s terms, policies, and approval processes.',
        },
        {
          type: 'paragraph',
          text: 'We are not responsible for outages, policy changes, account restrictions, or data handling by third-party platforms. You are solely responsible for obtaining and maintaining required business verifications, phone numbers, templates, and opt-in consents for messaging channels.',
        },
        {
          type: 'paragraph',
          text: 'If a platform suspends your account or revokes API access, we cannot guarantee continued delivery of messages through that channel.',
        },
      ],
    },
    {
      id: 'ai-terms',
      title: '9. AI features',
      blocks: [
        {
          type: 'paragraph',
          text: 'AI-generated outputs may be inaccurate, incomplete, or inappropriate. You are responsible for reviewing AI-assisted content before sending it to customers or relying on it for business decisions.',
        },
        {
          type: 'paragraph',
          text: 'AI features are provided "as is" without warranty of accuracy. Do not use AI outputs as professional, legal, medical, or financial advice. You must ensure AI use complies with applicable laws and industry regulations in your sector.',
        },
      ],
    },
    {
      id: 'intellectual-property',
      title: '10. Intellectual property',
      blocks: [
        {
          type: 'paragraph',
          text: `We and our licensors own all rights, title, and interest in the Service, including software, design, trademarks, documentation, and proprietary technology. Except for the limited rights expressly granted in these Terms, no rights are transferred to you.`,
        },
        {
          type: 'paragraph',
          text: `You may not use ${PRODUCT_NAME} branding without prior written consent. Feedback you provide may be used by us without obligation or compensation.`,
        },
      ],
    },
    {
      id: 'confidentiality',
      title: '11. Confidentiality',
      blocks: [
        {
          type: 'paragraph',
          text: 'Each party may receive confidential information from the other. The receiving party will protect confidential information using reasonable care and use it only for purposes related to the Service. Confidentiality obligations do not apply to information that is public, independently developed, or lawfully obtained from a third party without restriction.',
        },
      ],
    },
    {
      id: 'disclaimers',
      title: '12. Disclaimers',
      blocks: [
        {
          type: 'paragraph',
          text: 'TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.',
        },
        {
          type: 'paragraph',
          text: 'We do not warrant that the Service will be uninterrupted, error-free, secure, or free of harmful components, or that messages will be delivered by third-party networks.',
        },
      ],
    },
    {
      id: 'liability',
      title: '13. Limitation of liability',
      blocks: [
        {
          type: 'paragraph',
          text: 'TO THE MAXIMUM EXTENT PERMITTED BY LAW, NEITHER PARTY SHALL BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR FOR LOSS OF PROFITS, REVENUE, DATA, GOODWILL, OR BUSINESS OPPORTUNITIES, ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.',
        },
        {
          type: 'paragraph',
          text: 'OUR TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNTS PAID BY YOU TO US FOR THE SERVICE IN THE TWELVE (12) MONTHS BEFORE THE EVENT GIVING RISE TO LIABILITY, OR (B) ONE HUNDRED U.S. DOLLARS (USD $100).',
        },
        {
          type: 'paragraph',
          text: 'Some jurisdictions do not allow certain limitations; in those cases, our liability is limited to the fullest extent permitted by law.',
        },
      ],
    },
    {
      id: 'indemnification',
      title: '14. Indemnification',
      blocks: [
        {
          type: 'paragraph',
          text: 'You will defend, indemnify, and hold harmless ' + LEGAL_ENTITY + ', its affiliates, officers, directors, employees, and agents from any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys\' fees) arising from: (a) your Customer Data or use of the Service; (b) your violation of these Terms or applicable law; (c) your violation of third-party rights or platform policies; or (d) disputes between you and your End Users.',
        },
      ],
    },
    {
      id: 'termination',
      title: '15. Term and termination',
      blocks: [
        {
          type: 'paragraph',
          text: 'These Terms remain in effect while you use the Service. You may terminate your account at any time through account settings or by contacting support.',
        },
        {
          type: 'paragraph',
          text: 'We may suspend or terminate access immediately if you breach these Terms, fail to pay fees, pose a security risk, or if required by law or a platform provider. Upon termination, your right to use the Service ceases. We may delete Customer Data after a reasonable retention period, subject to legal obligations and backup cycles. Sections that by nature should survive (including payment obligations, disclaimers, liability limits, and indemnification) will survive termination.',
        },
      ],
    },
    {
      id: 'governing-law',
      title: '16. Governing law and disputes',
      blocks: [
        {
          type: 'paragraph',
          text: 'These Terms are governed by the laws of India, without regard to conflict-of-law principles, except where mandatory consumer protection laws in your country of residence require otherwise.',
        },
        {
          type: 'paragraph',
          text: 'Any dispute arising out of or relating to these Terms or the Service shall first be attempted to be resolved through good-faith negotiation. If not resolved within thirty (30) days, disputes shall be subject to the exclusive jurisdiction of the courts located in India, unless applicable law grants you the right to bring claims in your country of residence.',
        },
        {
          type: 'paragraph',
          text: 'If you are a consumer in the EEA or UK, you may also have rights under mandatory local law that cannot be waived by contract.',
        },
      ],
    },
    {
      id: 'export',
      title: '17. Export compliance',
      blocks: [
        {
          type: 'paragraph',
          text: 'You may not use or export the Service in violation of applicable export control or sanctions laws. You represent that you are not located in, or ordinarily resident in, a country subject to comprehensive sanctions, and are not on any government restricted-party list.',
        },
      ],
    },
    {
      id: 'general',
      title: '18. General provisions',
      blocks: [
        {
          type: 'list',
          items: [
            'Entire agreement: These Terms, the Privacy Policy, and any order form or DPA constitute the entire agreement regarding the Service.',
            'Severability: If any provision is unenforceable, the remainder remains in effect.',
            'Waiver: Failure to enforce a provision is not a waiver of future enforcement.',
            'Assignment: You may not assign these Terms without our consent. We may assign these Terms in connection with a merger or sale of assets.',
            'Force majeure: We are not liable for delays or failures due to events beyond our reasonable control.',
            'Notices: We may provide notices via email, in-product messages, or posting on our website.',
          ],
        },
      ],
    },
    {
      id: 'contact',
      title: '19. Contact',
      blocks: [
        {
          type: 'paragraph',
          text: 'Questions about these Terms:',
        },
        {
          type: 'list',
          items: [
            `${LEGAL_ENTITY}`,
            `Legal: ${LEGAL_EMAIL}`,
            `Support: ${SUPPORT_EMAIL}`,
            `Website: https://${PRODUCT_DOMAIN}`,
          ],
        },
      ],
    },
  ],
};
