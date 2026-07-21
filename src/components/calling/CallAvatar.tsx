import { useState } from 'react';
import { Bot, Phone, User } from 'lucide-react';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE: Record<Size, { box: string; text: string; icon: string }> = {
  xs: { box: 'h-5 w-5', text: 'text-[9px]', icon: 'h-3 w-3' },
  sm: { box: 'h-6 w-6', text: 'text-[10px]', icon: 'h-3.5 w-3.5' },
  md: { box: 'h-10 w-10', text: 'text-sm', icon: 'h-5 w-5' },
  lg: { box: 'h-16 w-16', text: 'text-lg', icon: 'h-7 w-7' },
  xl: { box: 'h-24 w-24', text: 'text-2xl', icon: 'h-10 w-10' },
};

function initialsFromName(name?: string | null): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

type Props = {
  name?: string | null;
  avatarUrl?: string | null;
  size?: Size;
  kind?: 'agent' | 'customer' | 'neutral';
  className?: string;
  fallbackIcon?: 'phone' | 'bot' | 'user' | 'none';
};

export function CallAvatar({
  name,
  avatarUrl,
  size = 'md',
  kind = 'neutral',
  className = '',
  fallbackIcon = 'none',
}: Props) {
  const [broken, setBroken] = useState(false);
  const dim = SIZE[size];
  const showImage = Boolean(avatarUrl) && !broken;

  const tone =
    kind === 'agent'
      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
      : kind === 'customer'
        ? 'bg-slate-200 text-slate-600 border-slate-300'
        : 'bg-slate-100 text-slate-600 border-slate-200';

  if (showImage) {
    return (
      <img
        src={avatarUrl!}
        alt={name || 'Avatar'}
        onError={() => setBroken(true)}
        className={`${dim.box} rounded-full object-cover border shrink-0 ${tone} ${className}`}
      />
    );
  }

  const initials = initialsFromName(name);
  if (initials !== '?' || fallbackIcon === 'none') {
    return (
      <span
        className={`${dim.box} ${dim.text} rounded-full border font-bold inline-flex items-center justify-center shrink-0 ${tone} ${className}`}
        aria-hidden={!name}
      >
        {initials}
      </span>
    );
  }

  const Icon = fallbackIcon === 'bot' ? Bot : fallbackIcon === 'user' ? User : Phone;
  return (
    <span
      className={`${dim.box} rounded-full border inline-flex items-center justify-center shrink-0 ${tone} ${className}`}
    >
      <Icon className={dim.icon} />
    </span>
  );
}
