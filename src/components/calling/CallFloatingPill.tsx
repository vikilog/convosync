import { motion } from 'motion/react';
import { Phone } from 'lucide-react';
import type { CallSessionDto } from '../../lib/api';
import { formatCallTimer } from '../../lib/callDuration';
import { CallAvatar } from './CallAvatar';
import { getAiAgentName, getHumanHandlerName, isAiHandlingCall } from './callLabels';

type Props = {
  call: CallSessionDto;
  elapsed: number;
  onClick: () => void;
};

export function CallFloatingPill({ call, elapsed, onClick }: Props) {
  const isAi = isAiHandlingCall(call);
  const aiName = getAiAgentName(call);
  const humanName = getHumanHandlerName(call);
  const dotClass = isAi ? 'bg-emerald-500' : 'bg-blue-500';
  const contactName = call.contact?.name || 'Customer';
  const handlerLabel = isAi
    ? aiName || 'AI Agent'
    : humanName || call.handler?.name || 'You';

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-6 right-6 z-[80] flex items-center gap-2.5 rounded-full border border-slate-200 bg-white pl-2 pr-4 py-2 shadow-lg shadow-slate-900/10 hover:shadow-xl transition-shadow cursor-pointer"
      aria-label="Open call panel"
    >
      <span className="relative shrink-0">
        <CallAvatar
          size="sm"
          kind={isAi ? 'agent' : 'customer'}
          name={isAi ? aiName : humanName || contactName}
          avatarUrl={isAi ? call.aiAgent?.avatarUrl ?? call.handler?.avatarUrl : call.humanAgent?.avatarUrl ?? call.handler?.avatarUrl}
          fallbackIcon="phone"
        />
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${dotClass} animate-pulse`}
          aria-hidden
        />
      </span>
      <span className="flex min-w-0 items-center gap-2 leading-tight">
        <Phone className="h-3.5 w-3.5 shrink-0 text-slate-500" />
        <span className="min-w-0 truncate text-sm font-semibold text-slate-900">
          <span>{contactName}</span>
          <span className="mx-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">vs</span>
          <span className={isAi ? 'text-emerald-700' : ''}>{handlerLabel}</span>
        </span>
        <span className="shrink-0 font-mono text-sm font-bold text-slate-700 tabular-nums">
          {formatCallTimer(elapsed)}
        </span>
      </span>
    </motion.button>
  );
}
