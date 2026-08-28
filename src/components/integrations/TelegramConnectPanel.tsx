/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ExternalLink, Send } from 'lucide-react';
import { Input } from '../ui/input';

export function TelegramBrandIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M22.05 2.53a1.68 1.68 0 00-1.72-.28L1.9 9.6a1.6 1.6 0 00.1 3.02l4.7 1.47 1.82 5.84a1.61 1.61 0 002.63.7l2.6-2.32 4.6 3.4a1.66 1.66 0 002.6-1L22.7 4.1a1.68 1.68 0 00-.65-1.57zM9.4 14.6l-1.15 3.7-1.14-3.66 10.1-8.02z" />
    </svg>
  );
}

type TelegramStep = {
  title: string;
  description: string;
};

const STEPS: TelegramStep[] = [
  {
    title: 'Open BotFather on Telegram',
    description: 'In the Telegram app, search for @BotFather (verified account) or open t.me/botfather.',
  },
  {
    title: 'Create a new bot',
    description: 'Send /newbot, then choose a display name and a username ending in "bot" (e.g. convosync_support_bot).',
  },
  {
    title: 'Copy the bot token',
    description: 'BotFather replies with an HTTP API token that looks like 123456789:AAH... Copy the whole string.',
  },
  {
    title: 'Paste it below',
    description: 'Enter the token here to link this bot to your ConvoSync workspace.',
  },
];

type Props = {
  botToken: string;
  onBotTokenChange: (value: string) => void;
  onConnect: () => void;
  connecting?: boolean;
  error?: string;
  info?: string;
};

export function TelegramConnectPanel({
  botToken,
  onBotTokenChange,
  onConnect,
  connecting = false,
  error,
  info,
}: Props) {
  const [touched, setTouched] = useState(false);
  const trimmedToken = botToken.trim();
  const looksValid = /^\d+:[\w-]{20,}$/.test(trimmedToken);

  return (
    <div className="bg-white border-2 border-[#229ED9]/25 rounded-2xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(34,158,217,0.1)]">
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-black uppercase tracking-wider bg-[#e8f6fd] text-[#229ED9] border border-[#229ED9]/20 mb-4">
        <TelegramBrandIcon className="w-3 h-3" />
        Telegram Bot
      </span>
      <h4 className="text-xl font-semibold text-gray-950">Connect a Telegram bot</h4>
      <p className="mt-2 text-sm text-swiss-muted font-medium max-w-xl">
        ConvoSync talks to Telegram through a bot you create with BotFather. Follow the steps
        below to get a bot token, then paste it in to link the bot to this workspace.
      </p>

      <ol className="mt-5 space-y-3">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-[#e8f6fd] text-[#229ED9] text-xs font-black flex items-center justify-center">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-swiss-ink">{step.title}</p>
              <p className="text-xs text-swiss-muted font-medium mt-0.5">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>

      <a
        href="https://t.me/botfather"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#229ED9] hover:underline"
      >
        Open @BotFather on Telegram
        <ExternalLink className="w-3 h-3" />
      </a>

      <div className="mt-6 pt-6 border-t border-slate-100">
        <label htmlFor="telegram-bot-token" className="block text-xs font-black uppercase tracking-wide text-swiss-muted mb-1.5">
          Bot token
        </label>
        <Input
          id="telegram-bot-token"
          type="text"
          value={botToken}
          onChange={(e) => onBotTokenChange(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="123456789:AAHdd2ZjhP9k...  "
          spellCheck={false}
          autoComplete="off"
          className="h-auto w-full px-3.5 py-2.5 rounded-xl border border-swiss-line bg-white text-sm font-mono text-swiss-ink placeholder:text-swiss-faint focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        {touched && trimmedToken && !looksValid ? (
          <p className="mt-1.5 text-xs font-bold text-amber-700">
            That doesn't look like a bot token — it should look like 123456789:AA...
          </p>
        ) : null}

        {error && (
          <p className="mt-3 text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
            {error}
          </p>
        )}
        {info && (
          <p className="mt-3 text-sm font-bold text-primary bg-accent-green-bg border border-primary/15 rounded-xl px-4 py-2">
            {info}
          </p>
        )}

        <button
          type="button"
          onClick={onConnect}
          disabled={connecting || !trimmedToken}
          className="mt-4 inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-black transition-all"
        >
          <Send className="w-4 h-4" />
          {connecting ? 'Connecting…' : 'Connect Telegram bot'}
        </button>
      </div>
    </div>
  );
}
