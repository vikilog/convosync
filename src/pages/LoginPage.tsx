import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoginHeroGraphic } from '@/components/LoginHeroGraphic'
import { useAuth } from '@/context/AuthContext'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }
    setLoading(true)
    try {
      await login(email.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-background flex min-h-svh">
      <div className="relative hidden w-1/2 items-end overflow-hidden bg-black lg:flex">
        <LoginHeroGraphic />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/40" />
        <div className="relative z-10 p-10 text-white">
          <div className="mb-8 flex items-center gap-2.5">
            <img src="/convosync-logo.png" alt="" className="size-9 shrink-0" />
            <span className="text-xl font-bold tracking-tight">ConvoSync</span>
          </div>
          <h2 className="max-w-sm text-2xl leading-tight font-semibold tracking-tight">
            One inbox for WhatsApp, Instagram &amp; every channel your customers use
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/75">
            AI-powered automation, unified conversations, and campaigns — all in one workspace.
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-14">
        <div className="mb-7 flex items-center gap-2.5 lg:hidden">
          <img src="/convosync-logo.png" alt="" className="size-9 shrink-0" />
          <span className="text-xl font-bold tracking-tight">ConvoSync</span>
        </div>

        <div className="bg-card w-full max-w-[400px] rounded-3xl border p-7 shadow-xl shadow-black/[0.06] md:p-8">
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
            Sign in to your workspace to continue.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label
                htmlFor="login-email"
                className="text-muted-foreground text-xs font-bold tracking-wide uppercase"
              >
                Email
              </Label>
              <div className="relative">
                <Mail className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={loading}
                  className="focus-visible:border-channel-green focus-visible:ring-channel-green/25 h-11 rounded-xl pl-10"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="login-password"
                  className="text-muted-foreground text-xs font-bold tracking-wide uppercase"
                >
                  Password
                </Label>
                <span className="text-channel-green text-xs font-semibold">Forgot password?</span>
              </div>
              <div className="relative">
                <Lock className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  minLength={8}
                  disabled={loading}
                  className="focus-visible:border-channel-green focus-visible:ring-channel-green/25 h-11 rounded-xl pr-11 pl-10"
                  placeholder="Your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-muted-foreground hover:bg-accent hover:text-foreground absolute top-1/2 right-1.5 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-lg transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error ? (
              <p
                role="alert"
                className="border-destructive/20 bg-destructive/10 text-destructive rounded-xl border px-3 py-2.5 text-xs font-medium"
              >
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
                  Signing in…
                </>
              ) : (
                'Log in'
              )}
            </Button>
          </form>

          <p className="text-muted-foreground mt-6 text-center text-sm">
            New to ConvoSync?{' '}
            <Link to="/signup" className="text-channel-green cursor-pointer font-semibold hover:underline">
              Start free trial
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
