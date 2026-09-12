import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, Loader2, User } from 'lucide-react'

import { LocaleFields } from '@/components/locale/LocaleFields'
import { OnboardingStepIndicator } from '@/components/onboarding/OnboardingStepIndicator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { detectBrowserTimezone } from '@/lib/locale/detectBrowserTimezone'
import { dialForCountry, listDialCodeOptions, splitPhone, toE164 } from '@/lib/locale/dialCodes'
import {
  ACCOUNT_TYPES,
  COMPANY_SIZES,
  emptyOnboardingForm,
  HEARD_ABOUT_OPTIONS,
  INDUSTRIES,
  isStepOptional,
  ONBOARDING_TOTAL_STEPS,
  onboardingStepPayload,
  stateToForm,
  USE_CASE_OPTIONS,
  validateOnboardingStep,
  type OnboardingFormState,
  type OnboardingState,
} from '@/lib/onboarding'
import { setOnboardingCache } from '@/lib/onboardingCache'
import { profileResource } from '@/services/profile.service'

const DIAL_OPTIONS = listDialCodeOptions()

export function OnboardingWizard() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [countryHint, setCountryHint] = useState<string | null>(null)
  const [timezoneHint, setTimezoneHint] = useState<string | null>(null)
  const [form, setForm] = useState<OnboardingFormState>(() => emptyOnboardingForm(dialForCountry('IN')))
  const localeApplied = useRef(false)
  const hydrated = useRef(false)

  const { data: loaded, isPending, isError, error: loadError } = profileResource.useOnboarding()
  const localeQ = profileResource.useDetectLocale(
    Boolean(loaded && !loaded.onboardingCompleted && loaded.onboardingStep <= 3),
  )
  const saveStep = profileResource.useSaveOnboardingStep()
  const complete = profileResource.useCompleteOnboarding()
  const loading = isPending && !loaded
  const saving = saveStep.isPending || complete.isPending
  const displayError =
    error ?? (isError ? (loadError instanceof Error ? loadError.message : 'Failed to load onboarding') : null)

  const applyState = useCallback(
    (state: OnboardingState) => {
      setOnboardingCache({
        onboardingCompleted: state.onboardingCompleted,
        onboardingStep: state.onboardingStep,
        progressPercent: state.progressPercent,
        onboardingSkippedSteps: state.onboardingSkippedSteps,
      })
      setForm(stateToForm(state, splitPhone))
      if (state.onboardingCompleted) {
        navigate('/dashboard', { replace: true })
        return
      }
      setCurrentStep(Math.min(Math.max(state.onboardingStep, 1), ONBOARDING_TOTAL_STEPS))
    },
    [navigate],
  )

  useEffect(() => {
    if (!loaded || hydrated.current) return
    hydrated.current = true
    applyState(loaded)
  }, [loaded, applyState])

  useEffect(() => {
    const suggestion = localeQ.data
    if (localeApplied.current || !suggestion || !loaded || loaded.onboardingStep > 3) return
    localeApplied.current = true
    setCountryHint(suggestion.countryHint)
    setTimezoneHint(suggestion.timezoneHint)
    setForm((prev) => {
      const country = suggestion.country || prev.country
      return {
        ...prev,
        country,
        phoneDial: prev.phone.trim() ? prev.phoneDial : dialForCountry(country),
        timezone: suggestion.timezone || prev.timezone || detectBrowserTimezone() || prev.timezone,
      }
    })
  }, [localeQ.data, loaded])

  const persistStep = async (step: number, skip = false) => {
    setError(null)
    try {
      applyState(
        await saveStep.mutateAsync({
          step,
          data: onboardingStepPayload(step, form, toE164),
          skip,
        }),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save progress')
    }
  }

  const handleNext = async () => {
    const validationError = validateOnboardingStep(currentStep, form)
    if (validationError) {
      setError(validationError)
      return
    }
    await persistStep(currentStep)
  }

  const handleComplete = async () => {
    setError(null)
    try {
      applyState(await complete.mutateAsync())
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding')
    }
  }

  const toggleUseCase = (id: string) => {
    setForm((prev) => ({
      ...prev,
      useCases: prev.useCases.includes(id) ? prev.useCases.filter((u) => u !== id) : [...prev.useCases, id],
    }))
  }

  if (loading) {
    return (
      <div className="text-muted-foreground flex min-h-svh items-center justify-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Loading your setup
      </div>
    )
  }

  return (
    <div className="bg-muted/30 min-h-svh">
      <div className="mx-auto flex min-h-svh max-w-3xl flex-col px-4 py-8 md:px-6 md:py-10">
        <header className="mb-8 flex items-center gap-3">
          <img src="/convosync-logo.png" alt="" className="size-12 object-contain" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ConvoSync</h1>
            <p className="text-muted-foreground text-sm">Workspace setup · about 3 minutes</p>
          </div>
        </header>

        <OnboardingStepIndicator currentStep={currentStep} />

        <div className="bg-card mt-8 flex-1 rounded-2xl border p-6 md:p-8">
          {currentStep === 1 ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Welcome to ConvoSync</h2>
                <p className="text-muted-foreground mt-2 text-sm">How will you be using the platform?</p>
              </div>
              <div className="grid gap-3">
                {ACCOUNT_TYPES.map((type) => {
                  const selected = form.accountType === type.id
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, accountType: type.id }))}
                      className={`rounded-xl border p-4 text-left ${
                        selected ? 'border-primary bg-primary/5 ring-primary/15 ring-2' : 'hover:border-primary/40'
                      }`}
                    >
                      <p className="text-sm font-semibold">{type.label}</p>
                      <p className="text-muted-foreground mt-1 text-xs">{type.description}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Your profile</h2>
                <p className="text-muted-foreground mt-2 text-sm">So teammates know who you are.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ob-name">Full name</Label>
                <div className="relative">
                  <User className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    id="ob-name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="pl-10"
                    autoComplete="name"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <div className="flex gap-2">
                  <Select value={form.phoneDial} onValueChange={(phoneDial) => setForm((f) => ({ ...f, phoneDial }))}>
                    <SelectTrigger className="w-[7.5rem]" aria-label="Country code">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {!DIAL_OPTIONS.some((o) => o.dial === form.phoneDial) ? (
                        <SelectItem value={form.phoneDial}>{form.phoneDial}</SelectItem>
                      ) : null}
                      {DIAL_OPTIONS.map((o) => (
                        <SelectItem key={o.dial} value={o.dial}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="98765 43210"
                    autoComplete="tel-national"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ob-role">Role / job title</Label>
                <Input
                  id="ob-role"
                  value={form.jobTitle}
                  onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
                  placeholder="Founder, Support Lead…"
                />
              </div>
            </div>
          ) : null}

          {currentStep === 3 ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  {form.accountType === 'company' ? 'Company details' : 'About you'}
                </h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  {form.accountType === 'company'
                    ? 'Help us understand your organization.'
                    : 'A few details about your business or brand.'}
                </p>
              </div>
              {form.accountType === 'company' ? (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="ob-company">Company name</Label>
                    <div className="relative">
                      <Building2 className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                      <Input
                        id="ob-company"
                        value={form.companyName}
                        onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Company size</Label>
                    <Select value={form.companySize || undefined} onValueChange={(companySize) => setForm((f) => ({ ...f, companySize }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPANY_SIZES.map((size) => (
                          <SelectItem key={size} value={size}>
                            {size === '1' ? 'Just me' : `${size} employees`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Industry</Label>
                    <Select value={form.industry || undefined} onValueChange={(industry) => setForm((f) => ({ ...f, industry }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map((ind) => (
                          <SelectItem key={ind} value={ind}>
                            {ind}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="ob-display">Display / business name</Label>
                  <Input
                    id="ob-display"
                    value={form.displayName}
                    onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                    placeholder="Your brand or professional name"
                  />
                </div>
              )}
              <div className="bg-muted/40 rounded-xl border p-4">
                <p className="mb-1 text-sm font-semibold">Confirm your location</p>
                <p className="text-muted-foreground mb-4 text-xs">
                  Detected from your device. Nothing is saved until you continue.
                </p>
                <LocaleFields
                  idPrefix="onboarding"
                  country={form.country}
                  timezone={form.timezone}
                  countryHint={countryHint}
                  timezoneHint={timezoneHint}
                  onCountryChange={(code) => {
                    setCountryHint(null)
                    setForm((f) => ({ ...f, country: code }))
                  }}
                  onTimezoneChange={(tz) => {
                    setTimezoneHint(null)
                    setForm((f) => ({ ...f, timezone: tz }))
                  }}
                />
              </div>
            </div>
          ) : null}

          {currentStep === 4 ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">What brings you to ConvoSync?</h2>
                <p className="text-muted-foreground mt-2 text-sm">Select all that apply.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {USE_CASE_OPTIONS.map((option) => {
                  const selected = form.useCases.includes(option.id)
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleUseCase(option.id)}
                      className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold ${
                        selected ? 'border-primary bg-primary/5 text-primary' : 'hover:border-primary/40'
                      }`}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          {currentStep === 5 ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">How did you hear about us?</h2>
                <p className="text-muted-foreground mt-2 text-sm">Optional — helps us improve discovery.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Source</Label>
                <Select value={form.heardAbout || 'none'} onValueChange={(v) => setForm((f) => ({ ...f, heardAbout: v === 'none' ? '' : v }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select an option</SelectItem>
                    {HEARD_ABOUT_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ob-ref">Referral code (optional)</Label>
                <Input
                  id="ob-ref"
                  value={form.referralCode}
                  onChange={(e) => setForm((f) => ({ ...f, referralCode: e.target.value }))}
                />
              </div>
            </div>
          ) : null}

          {currentStep === 6 ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Workspace setup</h2>
                <p className="text-muted-foreground mt-2 text-sm">Name your workspace. Locale can be changed in Settings later.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ob-ws">Workspace name</Label>
                <Input
                  id="ob-ws"
                  value={form.workspaceName}
                  onChange={(e) => setForm((f) => ({ ...f, workspaceName: e.target.value }))}
                />
              </div>
            </div>
          ) : null}

          {currentStep === 7 ? (
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-primary mt-0.5 size-6 shrink-0" />
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">You&apos;re all set</h2>
                  <p className="text-muted-foreground mt-2 text-sm">Review your details. You can update them in Settings anytime.</p>
                </div>
              </div>
              <dl className="divide-border divide-y rounded-xl border text-sm">
                {(
                  [
                    ['Account type', form.accountType],
                    ['Name', form.name],
                    ['Workspace', form.workspaceName],
                    ['Country', form.country],
                    ['Timezone', form.timezone],
                    [
                      'Use cases',
                      form.useCases.map((id) => USE_CASE_OPTIONS.find((o) => o.id === id)?.label ?? id).join(', ') || '—',
                    ],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="grid grid-cols-3 gap-2 px-4 py-3">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="col-span-2 font-medium capitalize">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          {displayError ? (
            <p role="alert" className="border-destructive/20 bg-destructive/10 text-destructive mt-5 rounded-xl border px-3 py-2.5 text-xs font-medium">
              {displayError}
            </p>
          ) : null}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {currentStep > 1 && currentStep < 7 ? (
                <Button type="button" variant="outline" disabled={saving} onClick={() => { setError(null); setCurrentStep((s) => Math.max(1, s - 1)) }}>
                  <ArrowLeft />
                  Back
                </Button>
              ) : null}
              {isStepOptional(currentStep) ? (
                <Button type="button" variant="ghost" disabled={saving} onClick={() => void persistStep(currentStep, true)}>
                  Skip for now
                </Button>
              ) : null}
            </div>
            {currentStep < 7 ? (
              <Button type="button" disabled={saving} onClick={() => void handleNext()}>
                {saving ? 'Saving…' : 'Continue'}
                <ArrowRight />
              </Button>
            ) : (
              <Button type="button" disabled={saving} onClick={() => void handleComplete()}>
                {saving ? 'Finishing…' : 'Go to dashboard'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
