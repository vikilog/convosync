import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Globe2,
  Sparkles,
  User,
} from 'lucide-react';
import { api, setUserName } from '../../lib/api';
import { AppLoadingScreen } from '../ui/AppLoadingScreen';
import {
  ACCOUNT_TYPES,
  COUNTRIES,
  COMPANY_SIZES,
  HEARD_ABOUT_OPTIONS,
  INDUSTRIES,
  isStepOptional,
  ONBOARDING_TOTAL_STEPS,
  TIMEZONES,
  USE_CASE_OPTIONS,
  type AccountType,
  type OnboardingState,
} from '../../lib/onboarding';
import { setOnboardingCache } from '../../lib/session';
import { OnboardingStepIndicator } from './OnboardingStepIndicator';

type FormState = {
  accountType: AccountType | '';
  name: string;
  phone: string;
  jobTitle: string;
  companyName: string;
  displayName: string;
  companySize: string;
  industry: string;
  country: string;
  useCases: string[];
  heardAbout: string;
  referralCode: string;
  workspaceName: string;
  timezone: string;
};

function stateToForm(state: OnboardingState): FormState {
  const step3 = (state.onboardingData.step3 as Record<string, string> | undefined) ?? {};
  return {
    accountType: state.accountType ?? '',
    name: state.user.name ?? '',
    phone: state.user.phone ?? '',
    jobTitle: state.user.jobTitle ?? '',
    companyName: step3.companyName ?? state.workspace.name ?? '',
    displayName: step3.displayName ?? state.workspace.name ?? '',
    companySize: state.workspace.companySize ?? '',
    industry: state.workspace.industry ?? '',
    country: state.workspace.country ?? 'IN',
    useCases: state.workspace.useCases ?? [],
    heardAbout: state.workspace.heardAbout ?? '',
    referralCode: state.workspace.referralCode ?? '',
    workspaceName: state.workspace.name ?? '',
    timezone: state.workspace.timezone ?? 'Asia/Kolkata',
  };
}

function validateStep(step: number, form: FormState): string | null {
  switch (step) {
    case 1:
      return form.accountType ? null : 'Please select how you plan to use WaBiz.';
    case 2:
      if (!form.name.trim() || form.name.trim().length < 2) return 'Full name is required.';
      if (!form.phone.trim()) return 'Phone number is required.';
      if (!form.jobTitle.trim()) return 'Role or job title is required.';
      return null;
    case 3:
      if (form.accountType === 'company') {
        if (!form.companyName.trim()) return 'Company name is required.';
        if (!form.companySize) return 'Company size is required.';
        if (!form.industry) return 'Industry is required.';
        if (!form.country) return 'Country is required.';
      } else {
        if (!form.displayName.trim()) return 'Display or business name is required.';
        if (!form.country) return 'Country is required.';
      }
      return null;
    case 4:
      return form.useCases.length > 0 ? null : 'Select at least one use case.';
    case 5:
      return null;
    case 6:
      if (!form.workspaceName.trim()) return 'Workspace name is required.';
      if (!form.timezone) return 'Timezone is required.';
      return null;
    default:
      return null;
  }
}

function stepPayload(step: number, form: FormState): Record<string, unknown> {
  switch (step) {
    case 1:
      return { accountType: form.accountType };
    case 2:
      return { name: form.name.trim(), phone: form.phone.trim(), jobTitle: form.jobTitle.trim() };
    case 3:
      return form.accountType === 'company'
        ? {
            companyName: form.companyName.trim(),
            companySize: form.companySize,
            industry: form.industry,
            country: form.country,
          }
        : {
            displayName: form.displayName.trim(),
            country: form.country,
          };
    case 4:
      return { useCases: form.useCases };
    case 5:
      return {
        heardAbout: form.heardAbout,
        referralCode: form.referralCode.trim(),
      };
    case 6:
      return {
        workspaceName: form.workspaceName.trim(),
        timezone: form.timezone,
      };
    default:
      return {};
  }
}

export function OnboardingWizard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<FormState>({
    accountType: '',
    name: '',
    phone: '',
    jobTitle: '',
    companyName: '',
    displayName: '',
    companySize: '',
    industry: '',
    country: 'IN',
    useCases: [],
    heardAbout: '',
    referralCode: '',
    workspaceName: '',
    timezone: 'Asia/Kolkata',
  });

  const applyState = useCallback((state: OnboardingState) => {
    setOnboardingCache({
      onboardingCompleted: state.onboardingCompleted,
      onboardingStep: state.onboardingStep,
      progressPercent: state.progressPercent,
      onboardingSkippedSteps: state.onboardingSkippedSteps,
    });
    setForm(stateToForm(state));
    if (state.user.name) setUserName(state.user.name);
    if (state.onboardingCompleted) {
      navigate('/dashboard', { replace: true });
      return;
    }
    setCurrentStep(Math.min(Math.max(state.onboardingStep, 1), ONBOARDING_TOTAL_STEPS));
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const state = await api.getOnboarding();
        if (!cancelled) applyState(state);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load onboarding');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyState]);

  const persistStep = async (step: number, skip = false) => {
    setSaving(true);
    setError(null);
    try {
      const state = await api.saveOnboardingStep(step, stepPayload(step, form), skip);
      applyState(state);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    const validationError = validateStep(currentStep, form);
    if (validationError) {
      setError(validationError);
      return;
    }
    await persistStep(currentStep);
  };

  const handleSkip = async () => {
    if (!isStepOptional(currentStep)) return;
    await persistStep(currentStep, true);
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((s) => Math.max(1, s - 1));
  };

  const handleComplete = async () => {
    setSaving(true);
    setError(null);
    try {
      const state = await api.completeOnboarding();
      applyState(state);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding');
    } finally {
      setSaving(false);
    }
  };

  const toggleUseCase = (id: string) => {
    setForm((prev) => ({
      ...prev,
      useCases: prev.useCases.includes(id)
        ? prev.useCases.filter((u) => u !== id)
        : [...prev.useCases, id],
    }));
  };

  if (loading) {
    return <AppLoadingScreen message="Loading your setup" />;
  }

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-sky-50">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-8 md:px-6">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-primary">WaBiz setup</p>
            <p className="text-xs text-gray-500">Tell us about yourself — takes about 3 minutes</p>
          </div>
        </div>

        <OnboardingStepIndicator currentStep={currentStep} />

        <div className="mt-8 flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome to WaBiz</h1>
                <p className="mt-2 text-sm text-gray-500">
                  How will you be using the platform? This helps us tailor your workspace.
                </p>
              </div>
              <div className="grid gap-3">
                {ACCOUNT_TYPES.map((type) => {
                  const selected = form.accountType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, accountType: type.id }))}
                      className={[
                        'rounded-xl border p-4 text-left transition-all',
                        selected
                          ? 'border-primary bg-sky-50 ring-2 ring-primary/15'
                          : 'border-slate-200 hover:border-primary/40',
                      ].join(' ')}
                    >
                      <p className="text-sm font-bold text-gray-900">{type.label}</p>
                      <p className="mt-1 text-xs text-gray-500">{type.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Your profile</h1>
                <p className="mt-2 text-sm text-gray-500">So teammates know who you are in the workspace.</p>
              </div>
              <label className="block">
                <span className="text-meta font-bold uppercase tracking-wide text-gray-500">Full name</span>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </label>
              <label className="block">
                <span className="text-meta font-bold uppercase tracking-wide text-gray-500">Phone</span>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 98765 43210"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="block">
                <span className="text-meta font-bold uppercase tracking-wide text-gray-500">Role / job title</span>
                <input
                  value={form.jobTitle}
                  onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
                  placeholder="Founder, Support Lead, Marketing Manager…"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {form.accountType === 'company' ? 'Company details' : 'About you'}
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                  {form.accountType === 'company'
                    ? 'Help us understand your organization.'
                    : 'A few details about your business or brand.'}
                </p>
              </div>
              {form.accountType === 'company' ? (
                <>
                  <label className="block">
                    <span className="text-meta font-bold uppercase tracking-wide text-gray-500">Company name</span>
                    <div className="relative mt-1">
                      <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        value={form.companyName}
                        onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </label>
                  <label className="block">
                    <span className="text-meta font-bold uppercase tracking-wide text-gray-500">Company size</span>
                    <select
                      value={form.companySize}
                      onChange={(e) => setForm((f) => ({ ...f, companySize: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select size</option>
                      {COMPANY_SIZES.map((size) => (
                        <option key={size} value={size}>
                          {size === '1' ? 'Just me' : `${size} employees`}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-meta font-bold uppercase tracking-wide text-gray-500">Industry</span>
                    <select
                      value={form.industry}
                      onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select industry</option>
                      {INDUSTRIES.map((ind) => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                    </select>
                  </label>
                </>
              ) : (
                <label className="block">
                  <span className="text-meta font-bold uppercase tracking-wide text-gray-500">Display / business name</span>
                  <input
                    value={form.displayName}
                    onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                    placeholder="Your brand or professional name"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </label>
              )}
              <label className="block">
                <span className="text-meta font-bold uppercase tracking-wide text-gray-500">Country</span>
                <select
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">What brings you to WaBiz?</h1>
                <p className="mt-2 text-sm text-gray-500">Select all that apply — we use this to personalize tips.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {USE_CASE_OPTIONS.map((option) => {
                  const selected = form.useCases.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleUseCase(option.id)}
                      className={[
                        'rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-all',
                        selected
                          ? 'border-primary bg-sky-50 text-primary'
                          : 'border-slate-200 text-gray-700 hover:border-primary/40',
                      ].join(' ')}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">How did you hear about us?</h1>
                <p className="mt-2 text-sm text-gray-500">Optional — helps us improve how people discover WaBiz.</p>
              </div>
              <label className="block">
                <span className="text-meta font-bold uppercase tracking-wide text-gray-500">Source</span>
                <select
                  value={form.heardAbout}
                  onChange={(e) => setForm((f) => ({ ...f, heardAbout: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select an option</option>
                  {HEARD_ABOUT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-meta font-bold uppercase tracking-wide text-gray-500">Referral code (optional)</span>
                <input
                  value={form.referralCode}
                  onChange={(e) => setForm((f) => ({ ...f, referralCode: e.target.value }))}
                  placeholder="If someone referred you"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Workspace setup</h1>
                <p className="mt-2 text-sm text-gray-500">Name your workspace and set your default timezone.</p>
              </div>
              <label className="block">
                <span className="text-meta font-bold uppercase tracking-wide text-gray-500">Workspace name</span>
                <input
                  value={form.workspaceName}
                  onChange={(e) => setForm((f) => ({ ...f, workspaceName: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="block">
                <span className="text-meta font-bold uppercase tracking-wide text-gray-500">Timezone</span>
                <div className="relative mt-1">
                  <Globe2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <select
                    value={form.timezone}
                    onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              </label>
            </div>
          )}

          {currentStep === 7 && (
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">You&apos;re all set</h1>
                  <p className="mt-2 text-sm text-gray-500">
                    Review your details below. You can update them anytime in Settings.
                  </p>
                </div>
              </div>
              <dl className="divide-y divide-slate-200 rounded-xl border border-slate-200 text-sm">
                <div className="grid grid-cols-3 gap-2 px-4 py-3">
                  <dt className="text-gray-500">Account type</dt>
                  <dd className="col-span-2 font-medium capitalize text-gray-900">{form.accountType}</dd>
                </div>
                <div className="grid grid-cols-3 gap-2 px-4 py-3">
                  <dt className="text-gray-500">Name</dt>
                  <dd className="col-span-2 font-medium text-gray-900">{form.name}</dd>
                </div>
                <div className="grid grid-cols-3 gap-2 px-4 py-3">
                  <dt className="text-gray-500">Workspace</dt>
                  <dd className="col-span-2 font-medium text-gray-900">{form.workspaceName}</dd>
                </div>
                <div className="grid grid-cols-3 gap-2 px-4 py-3">
                  <dt className="text-gray-500">Use cases</dt>
                  <dd className="col-span-2 font-medium text-gray-900">
                    {form.useCases
                      .map((id) => USE_CASE_OPTIONS.find((o) => o.id === id)?.label ?? id)
                      .join(', ') || '—'}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {error && (
            <p className="mt-5 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-danger-red">
              {error}
            </p>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              {currentStep > 1 && currentStep < 7 && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-[#faf9ff] disabled:opacity-60"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              )}
              {isStepOptional(currentStep) && (
                <button
                  type="button"
                  onClick={() => void handleSkip()}
                  disabled={saving}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-500 hover:text-primary disabled:opacity-60"
                >
                  Skip for now
                </button>
              )}
            </div>

            {currentStep < 7 ? (
              <button
                type="button"
                onClick={() => void handleNext()}
                disabled={saving}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Continue'}
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleComplete()}
                disabled={saving}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-60"
              >
                {saving ? 'Finishing…' : 'Go to dashboard'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
