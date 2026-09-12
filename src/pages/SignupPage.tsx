import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Loader2, Lock, Mail, User } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'

const HIGHLIGHTS = [
  'Unified WhatsApp, Instagram & team inbox',
  'AI agents and campaign automation',
  'Connect Meta in under 10 minutes',
]

export function SignupPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Name is required.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      await register(name.trim(), email.trim(), password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-background flex min-h-svh">
      <div className="bg-primary relative hidden w-1/2 items-center justify-center overflow-hidden p-12 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle, color-mix(in oklch, var(--primary-foreground), transparent 70%) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }}
        />
        <div className="text-primary-foreground relative z-10 max-w-md">
          <img src="/convosync-logo.png" alt="" className="mb-8 size-14" />
          <p className="text-primary-foreground/70 text-sm font-bold tracking-widest uppercase">
            14-day free trial
          </p>
          <h1 className="mt-2 text-3xl leading-tight font-semibold tracking-tight">
            Start your ConvoSync workspace in minutes
          </h1>
          <p className="text-primary-foreground/80 mt-4 text-sm leading-relaxed">
            Create your account, then complete a short setup wizard for your company, goals, and workspace
            preferences. No credit card required.
          </p>
          <ul className="text-primary-foreground/90 mt-8 space-y-3 text-sm">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="text-channel-green size-4 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex min-h-svh flex-1 flex-col">
        <div className="px-6 pt-6 md:px-10">
          <Link
            to="/login"
            className="text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-2 text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back to login
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-[420px]">
            <div className="mb-6 flex items-center gap-2 lg:hidden">
              <img src="/convosync-logo.png" alt="" className="size-11" />
            </div>

            <h2 className="text-2xl font-bold">Create your free account</h2>
            <p className="text-muted-foreground mt-1 mb-6 text-sm">
              Sign up to start your trial. You will finish company and workspace details in the next steps.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="signup-name"
                  className="text-muted-foreground text-xs font-bold tracking-wide uppercase"
                >
                  Your name
                </Label>
                <div className="relative">
                  <User className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    id="signup-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    disabled={loading}
                    className="focus-visible:border-channel-green focus-visible:ring-channel-green/25 h-11 rounded-xl pl-9"
                    placeholder="Vikas Sharma"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="signup-email"
                  className="text-muted-foreground text-xs font-bold tracking-wide uppercase"
                >
                  Work email
                </Label>
                <div className="relative">
                  <Mail className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    disabled={loading}
                    className="focus-visible:border-channel-green focus-visible:ring-channel-green/25 h-11 rounded-xl pl-9"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="signup-password"
                  className="text-muted-foreground text-xs font-bold tracking-wide uppercase"
                >
                  Password
                </Label>
                <div className="relative">
                  <Lock className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    disabled={loading}
                    className="focus-visible:border-channel-green focus-visible:ring-channel-green/25 h-11 rounded-xl pl-9"
                    placeholder="Min. 8 characters"
                  />
                </div>
              </div>

              {error ? (
                <p className="border-destructive/20 bg-destructive/10 text-destructive rounded-xl border px-3 py-2 text-xs font-medium">
                  {error}
                </p>
              ) : null}

              <Button
                type="submit"
                disabled={loading}
                className="bg-channel-green h-12 w-full rounded-full text-sm font-bold text-white hover:bg-[#20bd5a]"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  <>
                    Start free trial
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>

            <p className="text-muted-foreground mt-4 text-center text-xs leading-relaxed">
              No credit card required. By signing up you agree to our{' '}
              <span className="text-foreground">Terms of Service</span> and{' '}
              <span className="text-foreground">Privacy Policy</span>.
            </p>

            <p className="text-muted-foreground mt-6 text-center text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-channel-green cursor-pointer font-semibold hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
