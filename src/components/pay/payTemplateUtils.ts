export function formatPayAmount(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

export function inferBillingPeriod(description: string): string {
  const match = description.match(/\b(monthly|annual|yearly)\b/i);
  if (!match) return 'Monthly';
  const word = match[0].toLowerCase();
  if (word === 'yearly') return 'Annual';
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function buildPaymentTemplateVariables(
  contactName: string,
  description: string,
  amountRupees: number
): string[] {
  const paise = Math.round(amountRupees * 100);
  return [contactName.trim(), inferBillingPeriod(description), formatPayAmount(paise)];
}

export function buildPlainPaymentPreview(
  contactName: string,
  description: string,
  amountRupees: number
): string {
  const amount = formatPayAmount(Math.round(amountRupees * 100));
  return `Hi ${contactName.trim()}, please complete your payment of ${amount} for ${description.trim()}. Tap below to pay securely via UPI or card.`;
}
