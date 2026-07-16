/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Check, ChevronDown, PauseCircle, Play, Route, XCircle } from 'lucide-react';

export type JourneyProgressStep = {
  nodeId: string;
  type: string;
  label: string;
  state: 'done' | 'current' | 'pending' | 'failed';
  detail?: string;
  waitUntil?: string | null;
};

export type ContactJourneyProgress = {
  executionId: string;
  journeyId: string;
  journeyName: string;
  status: string;
  currentNodeId: string | null;
  startedAt: string;
  lastExecutedAt: string | null;
  waitUntil?: string | null;
  steps: JourneyProgressStep[];
};

type JourneyOption = { id: string; name: string };

type Props = {
  progress: ContactJourneyProgress | null;
  initialLoading?: boolean;
  publishedJourneys?: JourneyOption[];
  assignedJourneyId?: string | null;
  onAssignJourney?: (journeyId: string) => void;
};

function formatRemaining(ms: number): string {
  if (ms <= 0) return 'Resuming soon…';
  const totalSec = Math.ceil(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  if (minutes > 0) return `${minutes}m ${seconds}s left`;
  return `${seconds}s left`;
}

function WaitRemaining({ waitUntil }: { waitUntil: string }) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, new Date(waitUntil).getTime() - Date.now())
  );

  useEffect(() => {
    const tick = () => {
      setRemaining(Math.max(0, new Date(waitUntil).getTime() - Date.now()));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [waitUntil]);

  return (
    <span className="mt-1 inline-flex items-center gap-1 rounded-md border border-[#f2994a]/25 bg-[#fff5e6] px-2 py-0.5 text-[11px] font-bold tabular-nums text-[#b45309]">
      <PauseCircle className="h-3 w-3 shrink-0" />
      {formatRemaining(remaining)}
    </span>
  );
}

function statusBadge(status: string) {
  switch (status) {
    case 'running':
      return {
        label: 'Running',
        className: 'bg-[#e6f7ec] text-[#006d2f] border-[#5dfd8a]/30',
        pulse: true,
      };
    case 'waiting':
      return {
        label: 'Waiting',
        className: 'bg-[#fff5e6] text-[#b45309] border-[#f2994a]/25',
        pulse: false,
      };
    case 'completed':
      return {
        label: 'Done',
        className: 'bg-sky-50 text-sky-600 border-sky-100',
        pulse: false,
      };
    case 'failed':
      return {
        label: 'Failed',
        className: 'bg-red-50 text-[#ba1a1a] border-red-200',
        pulse: false,
      };
    default:
      return {
        label: status,
        className: 'bg-gray-50 text-gray-600 border-gray-200',
        pulse: false,
      };
  }
}

function StatusBadgePill({
  status,
  badge,
}: {
  status: string;
  badge: ReturnType<typeof statusBadge>;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.className}`}
    >
      {badge.pulse ? (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
      ) : status === 'waiting' ? (
        <PauseCircle className="h-3 w-3" />
      ) : status === 'failed' ? (
        <XCircle className="h-3 w-3" />
      ) : status === 'completed' ? (
        <Check className="h-3 w-3" />
      ) : (
        <Route className="h-3 w-3" />
      )}
      {badge.label}
    </span>
  );
}

function StepDot({ state }: { state: JourneyProgressStep['state'] }) {
  if (state === 'done') {
    return (
      <span className="absolute -left-[21px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#006d2f]">
        <Check className="h-2 w-2 text-white" strokeWidth={3} />
      </span>
    );
  }

  if (state === 'current') {
    return (
      <span className="absolute -left-[21px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-channel-green ring-2 ring-emerald-100">
        <span className="h-1 w-1 animate-pulse rounded-full bg-white" />
      </span>
    );
  }

  if (state === 'failed') {
    return (
      <span className="absolute -left-[21px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#ba1a1a]">
        <XCircle className="h-2 w-2 text-white" />
      </span>
    );
  }

  return (
    <span className="absolute -left-[21px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-slate-200" />
  );
}

function JourneySteps({ progress }: { progress: ContactJourneyProgress }) {
  const doneCount = progress.steps.filter((s) => s.state === 'done').length;

  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-gray-500">
        {doneCount} of {progress.steps.length} steps completed
      </p>
      <div className="relative max-h-40 space-y-2 overflow-y-auto pl-5 pr-1 before:absolute before:bottom-2 before:left-[6px] before:top-2 before:w-px before:bg-slate-200">
        {progress.steps.map((step) => (
          <div key={step.nodeId} className="relative text-left">
            <StepDot state={step.state} />
            <p
              className={`text-sm font-semibold leading-tight ${
                step.state === 'current'
                  ? 'text-sky-600'
                  : step.state === 'failed'
                    ? 'text-[#ba1a1a]'
                    : step.state === 'done'
                      ? 'text-gray-900'
                      : 'text-gray-400'
              }`}
            >
              {step.label}
            </p>
            {step.detail && (
              <p
                className={`mt-0.5 text-xs font-medium ${
                  step.state === 'current' ? 'text-sky-600/70' : 'text-gray-400'
                }`}
              >
                {step.detail}
              </p>
            )}
            {step.state === 'current' && step.type === 'WAIT' && step.waitUntil && (
              <WaitRemaining waitUntil={step.waitUntil} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export const ContactJourneyPanel: React.FC<Props> = ({
  progress,
  initialLoading,
  publishedJourneys = [],
  assignedJourneyId = null,
  onAssignJourney,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedJourneyId, setSelectedJourneyId] = useState(assignedJourneyId ?? '');

  useEffect(() => {
    setSelectedJourneyId(assignedJourneyId ?? progress?.journeyId ?? '');
  }, [assignedJourneyId, progress?.journeyId, progress?.executionId]);

  useEffect(() => {
    if (progress?.status === 'running' || progress?.status === 'waiting') {
      setExpanded(true);
    } else if (progress?.status === 'completed' || progress?.status === 'failed') {
      setExpanded(false);
    }
  }, [progress?.executionId, progress?.status]);

  const currentStep = progress?.steps.find((s) => s.state === 'current');
  const badge = progress ? statusBadge(progress.status) : null;
  const assignedName =
    publishedJourneys.find((j) => j.id === assignedJourneyId)?.name ?? 'Assigned journey';

  if (initialLoading && !progress) {
    return (
      <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 h-3 w-28 rounded bg-gray-200" />
        <div className="h-4 w-full rounded bg-gray-200" />
      </div>
    );
  }

  const isActive = progress?.status === 'running' || progress?.status === 'waiting';

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-colors ${
        isActive ? 'border-sky-200' : 'border-slate-200'
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        className="flex w-full cursor-pointer items-start gap-2 p-3 text-left transition-colors hover:bg-slate-50"
        aria-expanded={expanded}
      >
        <span
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
            isActive ? 'bg-sky-50 text-sky-600' : 'bg-sky-50 text-gray-400'
          }`}
        >
          <Route className="h-4 w-4" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold text-gray-500">Automation journey</p>
            {progress && badge && (
              <StatusBadgePill status={progress.status} badge={badge} />
            )}
          </div>

          {progress ? (
            <>
              <p
                className="mt-1 break-words text-sm font-bold leading-snug text-gray-900"
                title={progress.journeyName}
              >
                {progress.journeyName}
              </p>
              {!expanded && progress.status === 'completed' && (
                <p className="mt-1 text-xs font-medium text-gray-500">
                  {progress.steps.filter((s) => s.state === 'done').length} steps completed
                </p>
              )}
              {!expanded && currentStep && progress.status !== 'completed' && (
                <p className="mt-1 truncate text-xs font-semibold text-sky-600">
                  Now: {currentStep.label}
                </p>
              )}
              {!expanded && currentStep?.type === 'WAIT' && currentStep.waitUntil && (
                <div className="mt-1">
                  <WaitRemaining waitUntil={currentStep.waitUntil} />
                </div>
              )}
            </>
          ) : assignedJourneyId ? (
            <p className="mt-1 break-words text-sm font-bold leading-snug text-gray-900" title={assignedName}>
              {assignedName}
            </p>
          ) : (
            <p className="mt-1 text-sm font-medium text-gray-500">No active journey</p>
          )}
        </div>

        <ChevronDown
          className={`mt-1 h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {expanded && (
        <div className="border-t border-slate-200 px-3 pb-3">
          {!progress ? (
            <div className="py-4 text-center">
              <Route className="mx-auto mb-2 h-5 w-5 text-gray-300" />
              <p className="text-xs leading-relaxed text-gray-500">
                When a journey runs for this contact, live steps will show here.
              </p>
            </div>
          ) : (
            <div className="pt-3">
              <JourneySteps progress={progress} />
            </div>
          )}
        </div>
      )}

      {onAssignJourney && publishedJourneys.length > 0 && (
        <div className="space-y-2 border-t border-slate-200 bg-slate-50/50 p-3">
          <p className="text-xs font-bold text-gray-500">Assign journey</p>
          <select
            value={selectedJourneyId}
            onChange={(e) => setSelectedJourneyId(e.target.value)}
            className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 outline-none transition-colors focus:border-channel-green/40 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">Select a journey…</option>
            {publishedJourneys.map((journey) => (
              <option key={journey.id} value={journey.id}>
                {journey.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!selectedJourneyId}
            onClick={() => {
              if (!selectedJourneyId) return;
              onAssignJourney(selectedJourneyId);
            }}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-channel-green py-2.5 text-sm font-bold text-white transition-colors hover:bg-channel-green-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Play className="h-3.5 w-3.5" />
            {selectedJourneyId && selectedJourneyId === assignedJourneyId
              ? 'Restart journey'
              : 'Start journey'}
          </button>
        </div>
      )}
    </article>
  );
};
