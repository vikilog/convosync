import { motion, AnimatePresence } from 'motion/react';
import { Headphones, Loader2, Mic, PhoneOff, X } from 'lucide-react';
import type { CallSessionDto } from '../../lib/api';
import { formatCallTimer } from '../../lib/callDuration';
import { CallAvatar } from './CallAvatar';
import { CallLiveTranscript } from './CallLiveTranscript';
import { CallAgentPreviewChat } from './CallAgentPreviewChat';
import { getAiAgentName, getHumanHandlerName, isAiHandlingCall } from './callLabels';
import { isAgentCallPreviewId } from '../../lib/callPreviewEvents';

export type CallAgentMode = 'idle' | 'listening' | 'speaking';

type Props = {
  open: boolean;
  onClose: () => void;
  call: CallSessionDto;
  elapsed: number;
  agentMode: CallAgentMode;
  busy: boolean;
  error: string | null;
  muted: boolean;
  previewWelcomeMessage?: string | null;
  previewLanguage?: string;
  onListenIn: () => void;
  onTakeOver: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
};

function callTitleLine(
  call: CallSessionDto,
  contactName: string,
  agentMode: CallAgentMode,
  aiName: string | null,
) {
  const humanName = getHumanHandlerName(call);
  const isAi = isAiHandlingCall(call) && agentMode !== 'speaking';
  const agentLabel = isAi ? aiName || 'AI Agent' : humanName || 'You';

  return (
    <>
      <span>{contactName}</span>
      <span className="mx-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">vs</span>
      <span className={isAi ? 'text-emerald-700' : 'text-slate-900'}>{agentLabel}</span>
    </>
  );
}

export function CallSideSheet({
  open,
  onClose,
  call,
  elapsed,
  agentMode,
  busy,
  error,
  muted,
  previewWelcomeMessage,
  previewLanguage = 'english',
  onListenIn,
  onTakeOver,
  onEnd,
  onToggleMute,
}: Props) {
  const contactName = call.contact?.name || 'Customer';
  const aiName = getAiAgentName(call);
  const isAi = isAiHandlingCall(call) && agentMode !== 'speaking';
  const showHumanControls = !isAi || agentMode === 'listening' || agentMode === 'speaking';
  const interactivePreview = isAgentCallPreviewId(call.callId) && Boolean(call.aiAgent?.id);

  return (
    <AnimatePresence>
      {(open || interactivePreview) && (
        <motion.aside
          key="call-side-sheet"
          initial={{ x: '100%' }}
          animate={{ x: open ? 0 : '100%' }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className={`fixed top-0 right-0 z-[79] flex h-full w-1/2 min-w-[360px] max-w-full flex-col border-l border-slate-200 bg-white shadow-2xl ${
            open ? '' : 'pointer-events-none'
          }`}
          aria-label="Call details"
          aria-hidden={!open}
        >
          <header className="shrink-0 border-b border-slate-100 px-4 py-4">
            <div className="flex items-center gap-3">
              <CallAvatar
                size="md"
                kind="customer"
                name={contactName}
                avatarUrl={call.contact?.avatarUrl}
                fallbackIcon="user"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 min-w-0">
                  <p className="min-w-0 flex-1 truncate text-base font-bold text-slate-900">
                    {callTitleLine(call, contactName, agentMode, aiName)}
                  </p>
                  <span className="shrink-0 font-mono text-base font-bold text-slate-700 tabular-nums">
                    {formatCallTimer(elapsed)}
                  </span>
                </div>
                {agentMode === 'listening' && (
                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                    <Headphones className="h-3 w-3" />
                    Listening in
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 cursor-pointer"
                aria-label="Close panel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>

          <div className="shrink-0 border-b border-slate-100 px-4 py-3 flex flex-nowrap gap-2">
            {!interactivePreview && isAi && agentMode === 'idle' && (
              <button
                type="button"
                disabled={busy}
                onClick={onListenIn}
                className="flex-1 min-h-10 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-60 cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Headphones className="h-4 w-4" />}
                Listen in
              </button>
            )}
            {!interactivePreview && isAi && (agentMode === 'idle' || agentMode === 'listening') && (
              <button
                type="button"
                disabled={busy}
                onClick={onTakeOver}
                className="flex-1 min-h-10 rounded-xl bg-channel-green text-white text-sm font-bold hover:opacity-95 disabled:opacity-60 cursor-pointer inline-flex items-center justify-center gap-1.5 [&_svg]:text-white"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
                Take over
              </button>
            )}
            {!interactivePreview && showHumanControls && !isAi && (
              <button
                type="button"
                onClick={onToggleMute}
                className="flex-1 min-h-10 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 hover:bg-slate-50 cursor-pointer"
              >
                {muted ? 'Unmute' : 'Mute'}
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={onEnd}
              className="flex-1 min-h-10 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-60 cursor-pointer inline-flex items-center justify-center gap-1.5"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <PhoneOff className="h-4 w-4" />}
              {interactivePreview ? 'End preview' : 'End call'}
            </button>
          </div>

          {error && (
            <p className="mx-4 mt-3 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex-1 min-h-0 overflow-hidden flex flex-col px-4 py-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
              {interactivePreview ? 'Test conversation' : 'Live transcript'}
            </p>
            {interactivePreview && call.aiAgent?.id ? (
              <CallAgentPreviewChat
                agentId={call.aiAgent.id}
                agentName={aiName || call.aiAgent.name}
                agentAvatarUrl={call.aiAgent.avatarUrl ?? call.handler?.avatarUrl}
                contactName={contactName}
                welcomeMessage={previewWelcomeMessage}
                language={previewLanguage}
                className="flex-1 min-h-0"
                onCutCall={onEnd}
              />
            ) : (
              <CallLiveTranscript
                callId={call.callId}
                className="flex-1 max-h-none min-h-0"
                agentAvatarUrl={call.aiAgent?.avatarUrl ?? call.handler?.avatarUrl}
                agentName={aiName || call.handler?.name}
                contactAvatarUrl={call.contact?.avatarUrl}
                contactName={contactName}
              />
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
