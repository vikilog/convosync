import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';
import { PRODUCT_LOGO, PRODUCT_NAME } from '../../lib/brand';
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
    <div className="mb-6 overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-r from-accent-green-bg to-white p-4 md:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <img
            src={PRODUCT_LOGO}
            alt={PRODUCT_NAME}
            className="h-10 w-10 shrink-0 object-contain"
          />
          <div>
            <p className="text-sm font-bold text-slate-900">Complete your profile</p>
            <p className="mt-0.5 text-xs text-slate-600">
              Finish setup to unlock the best experience — {progress}% complete.
            </p>
            <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-accent-green-bg">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/onboarding')}
          className="inline-flex cursor-pointer items-center justify-center gap-1.5 self-start rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors duration-200 hover:bg-primary-hover md:self-center"
        >
          Continue setup
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
