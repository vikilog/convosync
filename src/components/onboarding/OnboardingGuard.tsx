import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AppLoadingScreen } from '../ui/AppLoadingScreen';
import { api } from '../../lib/api';
import {
  getOnboardingCache,
  isOnboardingCacheFresh,
  setOnboardingCache,
} from '../../lib/session';

type Props = {
  children: ReactNode;
};

export function OnboardingGuard({ children }: Props) {
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const cached = getOnboardingCache();
    if (isOnboardingCacheFresh(cached) && cached) {
      setNeedsOnboarding(!cached.onboardingCompleted);
      setChecking(false);
      return;
    }

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
        setNeedsOnboarding(!state.onboardingCompleted);
      } catch {
        if (!cancelled) setNeedsOnboarding(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  if (checking) {
    return <AppLoadingScreen message="Preparing your workspace" />;
  }

  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
