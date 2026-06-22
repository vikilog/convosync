export function formatInrAmount(rupees: number, decimals = 2): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(rupees);
}

export function formatInrPaise(paise: number, currency = 'INR'): string {
  if (currency !== 'INR') {
    return `${(paise / 100).toFixed(2)} ${currency}`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export function formatBillingDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const invoiceStatusStyles: Record<string, string> = {
  paid: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  created: 'bg-slate-50 text-slate-700 border-slate-200',
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  failed: 'bg-red-50 text-red-800 border-red-200',
  refunded: 'bg-violet-50 text-violet-800 border-violet-200',
};

export function formatTransactionType(type: string): string {
  const labels: Record<string, string> = {
    subscription: 'Subscription',
    plan_purchase: 'Plan purchase',
    custom_plan: 'Custom plan',
    addon: 'Add-on',
    one_time: 'One-time',
    addon_contacts: 'Extra contacts',
    addon_team_members: 'Extra seats',
    addon_ai_agents: 'Extra AI agents',
    addon_channels: 'Extra channels',
    addon_ai_tokens: 'AI tokens',
    addon_campaigns: 'Campaigns',
    addon_emails: 'Email sends',
  };
  return labels[type] ?? type.replace(/_/g, ' ');
}
