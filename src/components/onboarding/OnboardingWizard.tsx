import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  User,
} from 'lucide-react';
import { api, setUserName } from '../../lib/api';
import { PRODUCT_LOGO, PRODUCT_NAME } from '../../lib/brand';
import { AppLoadingScreen } from '../ui/AppLoadingScreen';
import {
  ACCOUNT_TYPES,
  COMPANY_SIZES,
  HEARD_ABOUT_OPTIONS,
  INDUSTRIES,
  isStepOptional,
  ONBOARDING_TOTAL_STEPS,
  USE_CASE_OPTIONS,
  type AccountType,
  type OnboardingState,
} from '../../lib/onboarding';
import { detectBrowserTimezone } from '../../lib/locale/detectBrowserTimezone';
import {
  dialForCountry,
  listDialCodeOptions,
  splitPhone,
  toE164,
} from '../../lib/locale/dialCodes';
import { setOnboardingCache } from '../../lib/session';
import { LocaleFields } from '../locale/LocaleFields';
import { OnboardingStepIndicator } from './OnboardingStepIndicator';

const DIAL_OPTIONS = listDialCodeOptions();
const easeOut = [0.22, 1, 0.36, 1] as const;

// Shared chrome; width is composed per control so dial select isn't stuck with w-full.
const fieldShell =
  'min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm shadow-slate-900/5 placeholder:text-slate-400 transition-[border-color,box-shadow] duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

const fieldClass = `w-full ${fieldShell}`;
const selectClass = fieldClass;

type FormState = {
  accountType: AccountType | '';
  name: string;
  /** National number digits (UI); composed to E.164 on save. */
  phone: string;
  phoneDial: string;
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
  const country = state.workspace.country ?? 'IN';
  const { dial, national } = splitPhone(state.user.phone, country);
  return {
    accountType: state.accountType ?? '',
    name: state.user.name ?? '',
    phone: national,
    phoneDial: dial,
    jobTitle: state.user.jobTitle ?? '',
    companyName: step3.companyName ?? state.workspace.name ?? '',
    displayName: step3.displayName ?? state.workspace.name ?? '',
    companySize: state.workspace.companySize ?? '',
    industry: state.workspace.industry ?? '',
    country,
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
      return form.accountType ? null : 'Please select how you plan to use ConvoSync.';
    case 2:
      if (!form.name.trim() || form.name.trim().length < 2) return 'Full name is required.';
      if (!form.phone.trim()) return 'Phone number is required.';
      if (!form.jobTitle.trim()) return 'Role or job title is required.';
      return null;
    case 3:
      if (form.accountType === 'company') {
        if (!form.companyName.trim()) return 'Company name is required.';
        if (/https?:\/\//i.test(form.companyName) || /^www\./i.test(form.companyName.trim())) {
          return 'Company name cannot be a URL.';
        }
        if (!form.companySize) return 'Company size is required.';
        if (!form.industry) return 'Industry is required.';
        if (!form.country) return 'Country is required.';
        if (!form.timezone) return 'Timezone is required.';
      } else {
        if (!form.displayName.trim()) return 'Display or business name is required.';
        if (/https?:\/\//i.test(form.displayName) || /^www\./i.test(form.displayName.trim())) {
          return 'Business name cannot be a URL.';
        }
        if (!form.country) return 'Country is required.';
        if (!form.timezone) return 'Timezone is required.';
      }
      return null;
    case 4:
      return form.useCases.length > 0 ? null : 'Select at least one use case.';
    case 5:
      return null;
    case 6:
      if (!form.workspaceName.trim()) return 'Workspace name is required.';
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
      return {
        name: form.name.trim(),
        phone: toE164(form.phoneDial, form.phone),
        jobTitle: form.jobTitle.trim(),
      };
    case 3:
      return form.accountType === 'company'
        ? {
            companyName: form.companyName.trim(),
            companySize: form.companySize,
            industry: form.industry,
            country: form.country,
            timezone: form.timezone,
          }
        : {
            displayName: form.displayName.trim(),
            country: form.country,
            timezone: form.timezone,
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
  const reduceMotion = useReducedMotion();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [countryHint, setCountryHint] = useState<string | null>(null);
  const [timezoneHint, setTimezoneHint] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    accountType: '',
    name: '',
    phone: '',
    phoneDial: dialForCountry('IN'),
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

  const t = (duration: number) =>
    reduceMotion ? { duration: 0 } : { duration, ease: easeOut };

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
        if (cancelled) return;
        applyState(state);
        if (state.onboardingCompleted) return;

        // Prefill suggestion into the form only — never auto-save until the user continues.
        const browserTimezone = detectBrowserTimezone();
        const suggestion = await api.detectLocale(browserTimezone || undefined).catch(() => null);
        if (cancelled || !suggestion) return;

        setCountryHint(suggestion.countryHint);
        setTimezoneHint(suggestion.timezoneHint);
        // Don't clobber locale already confirmed in a later onboarding step.
        if (state.onboardingStep > 3) return;
        setForm((prev) => {
          const country = suggestion.country || prev.country;
          // Prefill dial from detected country when phone is still empty.
          const phoneDial = prev.phone.trim()
            ? prev.phoneDial
            : dialForCountry(country);
          return {
            ...prev,
            country,
            phoneDial,
            timezone: suggestion.timezone || prev.timezone || browserTimezone || prev.timezone,
          };
        });
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
    <div
      className="relative min-h-screen selection:bg-emerald-100 selection:text-emerald-950"
      style={{
        background: 'linear-gradient(180deg, #f4faf6 0%, #eef7f1 40%, #f8faf9 100%)',
      }}
    >
      <div className="pointer-events-none absolute inset-0 app-grid-bg opacity-60" aria-hidden />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-8 md:px-6 md:py-10">
        {/* Hero brand — first viewport signal */}
        <motion.header
          className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={t(0.4)}
        >
          <div className="flex items-center gap-3">
            <img
              src={PRODUCT_LOGO}
              alt={PRODUCT_NAME}
              className="h-12 w-12 object-contain drop-shadow-sm sm:h-14 sm:w-14"
            />
            <div className="min-w-0">
              <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                {PRODUCT_NAME}
              </h1>
              <p className="mt-0.5 text-sm text-slate-600">
                Workspace setup · about 3 minutes
              </p>
            </div>
          </div>
        </motion.header>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...t(0.4), delay: reduceMotion ? 0 : 0.06 }}
        >
          <OnboardingStepIndicator currentStep={currentStep} />
        </motion.div>

        <motion.div
          className="mt-8 flex-1 rounded-2xl border border-black/5 bg-white p-6 shadow-sm shadow-slate-900/5 md:p-8"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...t(0.45), delay: reduceMotion ? 0 : 0.1 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={t(0.25)}
            >
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                      Welcome to {PRODUCT_NAME}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
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
                            'cursor-pointer rounded-xl border p-4 text-left transition-colors duration-200',
                            selected
                              ? 'border-primary bg-accent-green-bg ring-2 ring-primary/15'
                              : 'border-slate-200 bg-white hover:border-primary/40 hover:bg-accent-green-bg/40',
                          ].join(' ')}
                        >
                          <p className="text-sm font-bold text-slate-900">{type.label}</p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-600">
                            {type.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                      Your profile
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      So teammates know who you are in the workspace.
                    </p>
                  </div>
                  <label className="block">
                    <span className="text-meta font-bold uppercase tracking-wide text-slate-600">
                      Full name
                    </span>
                    <div className="relative mt-1.5">
                      <User
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        aria-hidden
                      />
                      <input
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        autoComplete="name"
                        className={`${fieldClass} pl-10`}
                      />
                    </div>
                  </label>
                  <label className="block">
                    <span className="text-meta font-bold uppercase tracking-wide text-slate-600">
                      Phone
                    </span>
                    <div className="mt-1.5 flex min-w-0 items-stretch gap-2">
                      <select
                        value={form.phoneDial}
                        onChange={(e) => setForm((f) => ({ ...f, phoneDial: e.target.value }))}
                        aria-label="Country code"
                        className={`${fieldShell} w-auto max-w-[7.5rem] shrink-0 cursor-pointer px-2`}
                      >
                        {!DIAL_OPTIONS.some((o) => o.dial === form.phoneDial) && (
                          <option value={form.phoneDial}>{form.phoneDial}</option>
                        )}
                        {DIAL_OPTIONS.map((o) => (
                          <option key={o.dial} value={o.dial}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        placeholder="98765 43210"
                        autoComplete="tel-national"
                        className={`${fieldShell} min-w-0 flex-1`}
                      />
                    </div>
                  </label>
                  <label className="block">
                    <span className="text-meta font-bold uppercase tracking-wide text-slate-600">
                      Role / job title
                    </span>
                    <input
                      value={form.jobTitle}
                      onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
                      placeholder="Founder, Support Lead, Marketing Manager…"
                      className={`mt-1.5 ${fieldClass}`}
                    />
                  </label>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                      {form.accountType === 'company' ? 'Company details' : 'About you'}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {form.accountType === 'company'
                        ? 'Help us understand your organization.'
                        : 'A few details about your business or brand.'}
                    </p>
                  </div>
                  {form.accountType === 'company' ? (
                    <>
                      <label className="block">
                        <span className="text-meta font-bold uppercase tracking-wide text-slate-600">
                          Company name
                        </span>
                        <div className="relative mt-1.5">
                          <Building2
                            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                            aria-hidden
                          />
                          <input
                            value={form.companyName}
                            onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                            className={`${fieldClass} pl-10`}
                          />
                        </div>
                      </label>
                      <label className="block">
                        <span className="text-meta font-bold uppercase tracking-wide text-slate-600">
                          Company size
                        </span>
                        <select
                          value={form.companySize}
                          onChange={(e) => setForm((f) => ({ ...f, companySize: e.target.value }))}
                          className={`mt-1.5 cursor-pointer ${selectClass}`}
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
                        <span className="text-meta font-bold uppercase tracking-wide text-slate-600">
                          Industry
                        </span>
                        <select
                          value={form.industry}
                          onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                          className={`mt-1.5 cursor-pointer ${selectClass}`}
                        >
                          <option value="">Select industry</option>
                          {INDUSTRIES.map((ind) => (
                            <option key={ind} value={ind}>
                              {ind}
                            </option>
                          ))}
                        </select>
                      </label>
                    </>
                  ) : (
                    <label className="block">
                      <span className="text-meta font-bold uppercase tracking-wide text-slate-600">
                        Display / business name
                      </span>
                      <input
                        value={form.displayName}
                        onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                        placeholder="Your brand or professional name"
                        className={`mt-1.5 ${fieldClass}`}
                      />
                    </label>
                  )}
                  <div className="rounded-xl border border-slate-200 bg-accent-green-bg/50 p-4">
                    <p className="mb-1 text-sm font-semibold text-slate-800">Confirm your location</p>
                    <p className="mb-4 text-xs leading-relaxed text-slate-600">
                      We detected these from your device and network. Change either before continuing —
                      nothing is saved until you confirm.
                    </p>
                    <LocaleFields
                      idPrefix="onboarding"
                      country={form.country}
                      timezone={form.timezone}
                      countryHint={countryHint}
                      timezoneHint={timezoneHint}
                      onCountryChange={(code) => {
                        setCountryHint(null);
                        setForm((f) => ({ ...f, country: code }));
                      }}
                      onTimezoneChange={(tz) => {
                        setTimezoneHint(null);
                        setForm((f) => ({ ...f, timezone: tz }));
                      }}
                    />
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                      What brings you to {PRODUCT_NAME}?
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      Select all that apply — we use this to personalize tips.
                    </p>
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
                            'cursor-pointer rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors duration-200',
                            selected
                              ? 'border-primary bg-accent-green-bg text-primary'
                              : 'border-slate-200 text-slate-700 hover:border-primary/40 hover:bg-accent-green-bg/40',
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
                    <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                      How did you hear about us?
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      Optional — helps us improve how people discover {PRODUCT_NAME}.
                    </p>
                  </div>
                  <label className="block">
                    <span className="text-meta font-bold uppercase tracking-wide text-slate-600">
                      Source
                    </span>
                    <select
                      value={form.heardAbout}
                      onChange={(e) => setForm((f) => ({ ...f, heardAbout: e.target.value }))}
                      className={`mt-1.5 cursor-pointer ${selectClass}`}
                    >
                      <option value="">Select an option</option>
                      {HEARD_ABOUT_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-meta font-bold uppercase tracking-wide text-slate-600">
                      Referral code (optional)
                    </span>
                    <input
                      value={form.referralCode}
                      onChange={(e) => setForm((f) => ({ ...f, referralCode: e.target.value }))}
                      placeholder="If someone referred you"
                      className={`mt-1.5 ${fieldClass}`}
                    />
                  </label>
                </div>
              )}

              {currentStep === 6 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                      Workspace setup
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      Name your workspace. Country and timezone were set earlier — you can change them
                      in Settings anytime.
                    </p>
                  </div>
                  <label className="block">
                    <span className="text-meta font-bold uppercase tracking-wide text-slate-600">
                      Workspace name
                    </span>
                    <input
                      value={form.workspaceName}
                      onChange={(e) => setForm((f) => ({ ...f, workspaceName: e.target.value }))}
                      className={`mt-1.5 ${fieldClass}`}
                    />
                  </label>
                </div>
              )}

              {currentStep === 7 && (
                <div className="space-y-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2
                      className="mt-0.5 h-6 w-6 shrink-0 text-primary"
                      aria-hidden
                    />
                    <div>
                      <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                        You&apos;re all set
                      </h2>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        Review your details below. You can update them anytime in Settings.
                      </p>
                    </div>
                  </div>
                  <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">
                    <div className="grid grid-cols-3 gap-2 px-4 py-3">
                      <dt className="text-slate-500">Account type</dt>
                      <dd className="col-span-2 font-medium capitalize text-slate-900">
                        {form.accountType}
                      </dd>
                    </div>
                    <div className="grid grid-cols-3 gap-2 px-4 py-3">
                      <dt className="text-slate-500">Name</dt>
                      <dd className="col-span-2 font-medium text-slate-900">{form.name}</dd>
                    </div>
                    <div className="grid grid-cols-3 gap-2 px-4 py-3">
                      <dt className="text-slate-500">Workspace</dt>
                      <dd className="col-span-2 font-medium text-slate-900">
                        {form.workspaceName}
                      </dd>
                    </div>
                    <div className="grid grid-cols-3 gap-2 px-4 py-3">
                      <dt className="text-slate-500">Country</dt>
                      <dd className="col-span-2 font-medium text-slate-900">{form.country}</dd>
                    </div>
                    <div className="grid grid-cols-3 gap-2 px-4 py-3">
                      <dt className="text-slate-500">Timezone</dt>
                      <dd className="col-span-2 font-medium text-slate-900">{form.timezone}</dd>
                    </div>
                    <div className="grid grid-cols-3 gap-2 px-4 py-3">
                      <dt className="text-slate-500">Use cases</dt>
                      <dd className="col-span-2 font-medium text-slate-900">
                        {form.useCases
                          .map((id) => USE_CASE_OPTIONS.find((o) => o.id === id)?.label ?? id)
                          .join(', ') || '—'}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {error && (
            <p
              role="alert"
              className="mt-5 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs font-medium text-danger-red"
            >
              {error}
            </p>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {currentStep > 1 && currentStep < 7 && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={saving}
                  className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors duration-200 hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                  Back
                </button>
              )}
              {isStepOptional(currentStep) && (
                <button
                  type="button"
                  onClick={() => void handleSkip()}
                  disabled={saving}
                  className="inline-flex min-h-11 cursor-pointer items-center rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition-colors duration-200 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
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
                className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors duration-200 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {saving ? 'Saving…' : 'Continue'}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleComplete()}
                disabled={saving}
                className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors duration-200 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {saving ? 'Finishing…' : 'Go to dashboard'}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
