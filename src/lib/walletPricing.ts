/** Canonical wallet pricing — 1 CC = ₹1. Keep in sync with backend usageCost.constants.ts */
export const WALLET_CC_RATES = {
  waMarketing: 1,
  waUtility: 0.3,
  waAuth: 0.3,
  instagram: 0.01,
  email: 1,
  aiAgent: 5,
  journeyTrigger: 0.1,
  inbox: 0,
} as const;

export type WalletPricingKey = keyof typeof WALLET_CC_RATES;

export type WalletPricingRow = {
  key: WalletPricingKey;
  feature: string;
  unitLabel: string;
  rateCc: number;
  rateCcDisplay: string;
  /** Show in usage calculator */
  calculator: boolean;
  calculatorHint?: string;
  sliderMax?: number;
};

export const WALLET_PRICING_ROWS: readonly WalletPricingRow[] = [
  {
    key: 'waMarketing',
    feature: 'WA Marketing',
    unitLabel: 'Per conversation',
    rateCc: WALLET_CC_RATES.waMarketing,
    rateCcDisplay: '1 CC',
    calculator: true,
    calculatorHint: '1 CC / conversation',
    sliderMax: 5000,
  },
  {
    key: 'waUtility',
    feature: 'WA Utility',
    unitLabel: 'Per conversation',
    rateCc: WALLET_CC_RATES.waUtility,
    rateCcDisplay: '0.3 CC',
    calculator: true,
    calculatorHint: '0.3 CC / conversation',
    sliderMax: 5000,
  },
  {
    key: 'waAuth',
    feature: 'WA Auth',
    unitLabel: 'Per conversation',
    rateCc: WALLET_CC_RATES.waAuth,
    rateCcDisplay: '0.3 CC',
    calculator: true,
    calculatorHint: '0.3 CC / conversation',
    sliderMax: 5000,
  },
  {
    key: 'instagram',
    feature: 'Instagram',
    unitLabel: 'Per message',
    rateCc: WALLET_CC_RATES.instagram,
    rateCcDisplay: '0.01 CC',
    calculator: true,
    calculatorHint: '0.01 CC / message',
    sliderMax: 50000,
  },
  {
    key: 'email',
    feature: 'Email',
    unitLabel: 'Per send',
    rateCc: WALLET_CC_RATES.email,
    rateCcDisplay: '1 CC',
    calculator: true,
    calculatorHint: '1 CC / email',
    sliderMax: 10000,
  },
  {
    key: 'aiAgent',
    feature: 'AI Agent',
    unitLabel: 'GPT +35%',
    rateCc: WALLET_CC_RATES.aiAgent,
    rateCcDisplay: '~5 CC',
    calculator: true,
    calculatorHint: '~5 CC / reply (GPT +35%)',
    sliderMax: 2000,
  },
  {
    key: 'journeyTrigger',
    feature: 'Journey Trigger',
    unitLabel: 'Minimal',
    rateCc: WALLET_CC_RATES.journeyTrigger,
    rateCcDisplay: '~0.1 CC',
    calculator: true,
    calculatorHint: '~0.1 CC / trigger',
    sliderMax: 10000,
  },
  {
    key: 'inbox',
    feature: 'Inbox',
    unitLabel: 'Free',
    rateCc: WALLET_CC_RATES.inbox,
    rateCcDisplay: '0 CC',
    calculator: false,
  },
] as const;
