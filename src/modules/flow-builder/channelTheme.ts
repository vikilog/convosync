/** Channel-themed tokens for journey/flow canvas cards (IG gradient vs WA green). */

export type FlowChannel = 'instagram' | 'whatsapp';

export type FlowChannelTheme = {
  channel: FlowChannel;
  /** Short channel label on action cards */
  channelLabel: string;
  /** CSS background for 22px icon chips */
  iconChipBg: string;
  /** Selected card border class */
  selectedBorder: string;
  /** Primary filled button classes (Set Live / Publish) */
  primaryBtn: string;
  /** Soft accent chip / badge */
  softChip: string;
  /** Accent text / hover */
  accentText: string;
  /** Accent border on hover for dashed controls */
  accentBorderHover: string;
  /** Edge stroke (neutral; shared look) */
  edgeStroke: string;
};

export const FLOW_CHANNEL_THEMES: Record<FlowChannel, FlowChannelTheme> = {
  instagram: {
    channel: 'instagram',
    channelLabel: 'Instagram',
    iconChipBg: 'linear-gradient(135deg, #833AB4 0%, #FD1D1D 50%, #FCB045 100%)',
    selectedBorder: 'border-[#833AB4]',
    primaryBtn:
      'bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCB045] text-white hover:opacity-90 transition-opacity',
    softChip:
      'bg-gradient-to-br from-[#833AB4]/15 via-[#FD1D1D]/10 to-[#FCB045]/15 text-[#833AB4]',
    accentText: 'text-[#833AB4]',
    accentBorderHover: 'hover:border-[#833AB4] hover:text-[#833AB4]',
    edgeStroke: 'var(--color-border-strong)',
  },
  whatsapp: {
    channel: 'whatsapp',
    channelLabel: 'WhatsApp',
    iconChipBg: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
    selectedBorder: 'border-primary',
    primaryBtn: 'bg-primary text-white hover:bg-primary-hover transition-colors',
    softChip: 'bg-accent-green-bg text-primary',
    accentText: 'text-primary',
    accentBorderHover: 'hover:border-primary hover:text-primary',
    edgeStroke: 'var(--color-border-strong)',
  },
};

export const FLOW_EDGE_STYLE = {
  stroke: 'var(--color-border-strong)',
  strokeWidth: 1.5,
} as const;
