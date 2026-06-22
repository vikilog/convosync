/**
 * Sample WhatsApp template for ConvoSync Growth Plan subscription payments.
 * Load in template builder, save as draft, then submit to Meta for approval.
 *
 * WhatsApp Pay send mapping (later):
 *   {{1}} body → contact name
 *   {{2}} body → "Monthly" | "Annual"
 *   {{3}} body → "₹2,499" (or formatted amount)
 *   {{1}} URL button → Razorpay link suffix (e.g. path after domain) or token
 */
import type { CampaignTemplate } from '../../types';

export const GROWTH_PLAN_TEMPLATE_PRESET = {
  name: 'growth_plan_payment',
  category: 'Utility' as const,
  language: 'en_US',
  headerFormat: 'TEXT' as const,
  header: 'ConvoSync Growth Plan',
  bodyPattern: `Hi {{1}},

Your Growth Plan subscription ({{2}}) is ready to activate.

Complete payment of {{3}} to unlock:
• 5,000 contacts & 10 team members
• 50,000 WhatsApp messages/month
• Campaigns, journeys & WhatsApp Pay

Tap Pay now below to checkout securely via UPI or card.`,
  footer: 'ConvoSync · Business messaging',
  variableSamples: ['Rajesh', 'Monthly', '₹2,499'],
  buttonType: 'URL' as const,
  buttonText: 'Pay now',
  /** Meta dynamic URL — pass payment link suffix when sending */
  buttonUrl: 'https://convosync.in/pay/{{1}}',
  buttonUrlSample: 'sample_payment_id',
};

export function growthPlanPresetAsDraft(): Omit<CampaignTemplate, 'id' | 'lastUpdated' | 'status'> {
  const p = GROWTH_PLAN_TEMPLATE_PRESET;
  return {
    name: p.name,
    category: p.category,
    language: p.language,
    headerFormat: p.headerFormat,
    header: p.header,
    bodyPattern: p.bodyPattern,
    footer: p.footer,
    variables: p.variableSamples,
    buttons: [p.buttonText],
    buttonType: p.buttonType,
    buttonText: p.buttonText,
    buttonUrl: p.buttonUrl,
  };
}
