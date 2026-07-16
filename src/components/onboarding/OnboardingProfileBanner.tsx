import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { api } from '../../lib/api';
import { calcDisplayProgress } from '../../lib/onboarding';
import { getOnboardingCache, setOnboardingCache } from '../../lib/session';

export function OnboardingProfileBanner() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const cached = getOnboardingCache();
    if (cached && !cached.onboardingCompleted) {
      setVisible(true);
      setProgress(calcDisplayProgress(cached));
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const state = await api.getOnboarding();
        if (cancelled) return;
        setOnboardingCache({
          onboardingCompleted: state.onboardingCompleted,
          onboardingStep: state.onboardingStep,
          progressPercent: state.progressPercent,
          onboardingSkippedSteps: state.onboardingSkippedSteps,
        });
        const showBanner =
          !state.onboardingCompleted || state.onboardingSkippedSteps.includes(5);
        setVisible(showBanner);
        setProgress(calcDisplayProgress(state));
      } catch {
        if (!cancelled) setVisible(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-r from-sky-50 to-white p-4 md:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Complete your profile</p>
            <p className="mt-0.5 text-xs text-gray-500">
              Finish setup to unlock the best experience — {progress}% complete.
            </p>
            <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/onboarding')}
          className="inline-flex items-center justify-center gap-1.5 self-start rounded-full bg-channel-green px-4 py-2 text-sm font-bold text-white hover:bg-[#20bd5a] md:self-center"
        >
          Continue setup
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
