'use client';

import { useState, FormEvent, Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Loader2, Clock, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/cn';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Rotating brand proof-points shown on the brand panel. Kept small + quiet
// — this is the ONE place in the admin where we're allowed to be a little
// expressive, but it's still an operator's door, not marketing.
const BRAND_LINES = [
  'Buyers speak. Sellers answer.',
  'Matchmaking, built for Africa.',
  'From Harare to Lagos and back again.',
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idleExpired = searchParams.get('reason') === 'idle';

  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [loading, setLoading] = useState(false);

  const otpRef = useRef<HTMLInputElement>(null);

  // Auto-focus the OTP field when step transitions. Keyboard users should
  // land on the next action without reaching for the mouse.
  useEffect(() => {
    if (step === 'otp') {
      const t = setTimeout(() => otpRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [step]);

  // Cycle the brand line every 6s — quietly, one at a time, respects
  // reduced-motion by staying on the first line.
  const [lineIdx, setLineIdx] = useState(0);
  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
    const id = setInterval(() => setLineIdx((i) => (i + 1) % BRAND_LINES.length), 6000);
    return () => clearInterval(id);
  }, []);

  async function handleRequestOtp() {
    setError('');
    setNotice('');
    if (!email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    setSendingOtp(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/admin-request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      if (!res.ok && res.status !== 204) {
        const body = await res.json().catch(() => ({ message: 'Failed to send code' }));
        throw new Error(body.message || `Failed to send code (${res.status})`);
      }
      setStep('otp');
      setNotice('If that email is registered, a 6-digit code is on its way.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send code.');
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Double-submit guard: Enter-key + button-click within the same tick
    // can trigger two submissions. The second one lands after the first
    // has consumed the OTP, gets 401 "Invalid credentials", and briefly
    // flashes the error on screen right before navigation completes.
    if (loading || sendingOtp) return;
    if (step === 'email') {
      // First step is a "send code" submit, not a real login.
      void handleRequestOtp();
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/admin-login-v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), otp }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(body.message || `Login failed (${res.status})`);
      }
      const data = await res.json();
      if (!data.admin) throw new Error('Unexpected login response shape.');

      sessionStorage.setItem('adminToken', data.access_token);
      sessionStorage.setItem('adminRefreshToken', data.refresh_token);
      sessionStorage.setItem('adminUser', JSON.stringify(data.admin));
      sessionStorage.setItem('adminRole', data.admin.adminRole);
      sessionStorage.setItem('lastActivity', Date.now().toString());
      document.cookie = `adminToken=${data.access_token};path=/;max-age=7200;SameSite=Strict;Secure`;

      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      if (message.includes('fetch') || message.includes('network') || message.includes('ECONNREFUSED')) {
        setError('Unable to connect to the server. Please try again.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  const canSubmit =
    (step === 'email' && email.includes('@') && !sendingOtp) ||
    (step === 'otp' && otp.length === 6 && !loading);

  return (
    <main className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] bg-canvas text-fg">
      {/* ── Brand panel ─────────────────────────────────────────────── */}
      <aside
        aria-hidden="false"
        className="relative overflow-hidden hidden lg:flex flex-col justify-between p-10 xl:p-14"
      >
        {/* Emerald wash + orbs — slow pan so it feels alive without bouncing */}
        <div className="absolute inset-0 -z-10" style={panelBackground} />
        {/* Noise grain over the wash */}
        <div className="absolute inset-0 -z-10 opacity-[0.06] mix-blend-overlay pointer-events-none" style={noiseBackground} />

        <div className="flex items-center gap-2 animate-stagger-1">
          <SellaiMark />
          <span className="text-xs font-medium tracking-[0.22em] uppercase text-white/70">
            Admin · Control
          </span>
        </div>

        <div className="animate-stagger-2 max-w-xl">
          <h1 className="font-display text-[clamp(72px,9vw,128px)] leading-[0.9] font-medium text-white tracking-tight">
            Sellai
          </h1>
          <p
            key={lineIdx}
            className="mt-6 text-xl font-display text-white/85 leading-snug max-w-md transition-opacity duration-500"
          >
            {BRAND_LINES[lineIdx]}
          </p>
          <p className="mt-4 text-sm text-white/55 max-w-md">
            You&apos;re signing in to the control surface that keeps the marketplace
            honest — buyers, sellers, runners, disputes, money. Tread carefully.
          </p>
        </div>

        <div className="flex items-end justify-between text-xs text-white/45 animate-stagger-3">
          <span className="tabular">Sellai Admin · v1.0 · {new Date().getFullYear()}</span>
          <span className="hidden xl:inline">Harare</span>
        </div>
      </aside>

      {/* ── Form panel ──────────────────────────────────────────────── */}
      <section className="relative flex items-center justify-center p-6 sm:p-10">
        {/* Mobile brand strip — collapses everything above into a tight band */}
        <div className="lg:hidden absolute top-0 inset-x-0 h-20 flex items-center justify-center px-6" style={panelBackground}>
          <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay pointer-events-none" style={noiseBackground} />
          <div className="relative flex items-center gap-2.5">
            <SellaiMark />
            <span className="text-xs font-medium tracking-[0.22em] uppercase text-white/80">
              Admin · Control
            </span>
          </div>
        </div>

        <div className="w-full max-w-[420px] lg:pt-0 pt-28">
          <div className="animate-stagger-2">
            <h2 className="font-display text-3xl font-medium text-fg leading-tight">
              {step === 'email' ? 'Sign in' : 'Check your email'}
            </h2>
            <p className="text-sm text-fg-muted mt-1.5">
              {step === 'email'
                ? 'We\'ll send a 6-digit code to your admin email.'
                : <>A code is on the way to <span className="text-fg font-medium">{email}</span>.</>}
            </p>
          </div>

          {idleExpired && (
            <div className="mt-6 flex items-start gap-2.5 p-3 rounded-lg border border-warning/30 bg-warning-bg animate-stagger-3">
              <Clock className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-warning leading-relaxed">
                You were signed out for inactivity. Log back in to continue.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5 animate-stagger-3" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-fg-muted mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  if (error) setError('');
                  setEmail(e.target.value);
                }}
                placeholder="admin@sellai.app"
                required
                readOnly={step === 'otp'}
                className={cn(
                  'w-full h-11 px-3.5 rounded-lg bg-panel border text-sm text-fg',
                  'placeholder:text-fg-subtle transition-colors duration-fast',
                  'focus-visible:outline-none focus-visible:border-accent',
                  step === 'otp' ? 'border-muted text-fg-muted cursor-not-allowed' : 'border-default hover:border-strong',
                )}
              />
              {step === 'otp' && (
                <button
                  type="button"
                  onClick={() => { setStep('email'); setOtp(''); setNotice(''); setError(''); }}
                  className="mt-1.5 text-2xs text-fg-subtle hover:text-fg-muted transition-colors"
                >
                  Use a different email
                </button>
              )}
            </div>

            {/* OTP — single input, tabular mono, wide tracking so it reads as slots. */}
            {step === 'otp' && (
              <div className="animate-fade-in">
                <label htmlFor="otp" className="block text-xs font-medium text-fg-muted mb-1.5">
                  Verification code
                </label>
                <input
                  ref={otpRef}
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    // Clear any stale "Invalid credentials" error the moment
                    // the user starts correcting — otherwise a prior failed
                    // attempt's error lingers on screen during the next
                    // submit and reads as "login failed even though it
                    // succeeded".
                    if (error) setError('');
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                  }}
                  placeholder="• • • • • •"
                  required
                  className={cn(
                    'w-full h-14 rounded-lg bg-panel border',
                    'font-mono text-2xl text-center tracking-[0.5em] pl-[0.5em]',
                    'tabular text-fg placeholder:text-fg-subtle',
                    'transition-colors duration-fast',
                    'focus-visible:outline-none focus-visible:border-accent',
                    error && !loading ? 'border-danger' : 'border-default hover:border-strong',
                  )}
                />
                <div className="flex items-center justify-between mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      // Fat-finger guard: a new code replaces the old one in
                      // Redis, so a misclick here would silently invalidate
                      // whatever the user already typed above. Tiny confirm
                      // kills that class of bug.
                      if (otp.length > 0 && !confirm('A new code will replace the one you just received. Continue?')) return;
                      setOtp('');
                      setError('');
                      handleRequestOtp();
                    }}
                    disabled={sendingOtp}
                    className="text-2xs text-fg-subtle hover:text-fg-muted transition-colors disabled:opacity-50"
                  >
                    {sendingOtp ? 'Sending…' : 'Resend code'}
                  </button>
                  {notice && (
                    <span className="inline-flex items-center gap-1 text-2xs text-success">
                      <Check className="w-3 h-3" />
                      Sent
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Feedback — hidden while a request is in flight so a stale
                error from a prior attempt can't flash during the success
                path between setError('') and router.push(). */}
            {error && !loading && !sendingOtp && (
              <div role="alert" className="flex items-start gap-2.5 p-3 rounded-lg border border-danger/30 bg-danger-bg">
                <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                <p className="text-xs text-danger leading-relaxed">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                'group relative w-full h-11 rounded-lg font-medium text-sm',
                'bg-accent text-accent-fg',
                'transition-all duration-fast',
                'hover:bg-accent-hover active:bg-[var(--color-accent-active)]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'focus-visible:outline-none',
              )}
            >
              <span className="inline-flex items-center justify-center gap-2">
                {loading || sendingOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {step === 'email' ? 'Sending…' : 'Signing in…'}
                  </>
                ) : (
                  <>
                    {step === 'email' ? 'Send code' : 'Sign in'}
                    <ArrowRight className="w-4 h-4 transition-transform duration-fast group-hover:translate-x-0.5" />
                  </>
                )}
              </span>
            </button>
          </form>

          <p className="mt-8 text-2xs text-fg-subtle leading-relaxed animate-stagger-4">
            Authorized personnel only. Every action is logged to the audit trail,
            and session activity is attributed to you by email.
          </p>
        </div>
      </section>

      {/* Scoped styles: stagger cascade + noise svg data URI + panel wash. */}
      <style jsx>{`
        @keyframes stagger-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-stagger-1 { animation: stagger-in 500ms var(--ease-out) both; }
        .animate-stagger-2 { animation: stagger-in 500ms var(--ease-out) both; animation-delay: 80ms; }
        .animate-stagger-3 { animation: stagger-in 500ms var(--ease-out) both; animation-delay: 160ms; }
        .animate-stagger-4 { animation: stagger-in 500ms var(--ease-out) both; animation-delay: 240ms; }
        @media (prefers-reduced-motion: reduce) {
          .animate-stagger-1, .animate-stagger-2, .animate-stagger-3, .animate-stagger-4 {
            animation: none;
          }
        }
      `}</style>
    </main>
  );
}

/** Stylised Sellai mark — hexagon with an "S" carved out, rendered in
 *  white over the emerald panel. Single known-weight stroke for
 *  on-brand consistency with the rest of admin. */
function SellaiMark() {
  return (
    <svg
      className="w-6 h-6 text-white"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 8l6-4 6 4M6 8v8l6 4 6-4V8M6 8l6 4m0 0l6-4m-6 4v8" />
    </svg>
  );
}

// Emerald wash built from the existing accent token so theme changes
// cascade. Two soft radial orbs on a deep base for depth without motion.
const panelBackground = {
  background: [
    'radial-gradient(circle at 22% 28%, oklch(0.55 0.20 155 / 0.55), transparent 55%)',
    'radial-gradient(circle at 78% 72%, oklch(0.45 0.18 175 / 0.45), transparent 50%)',
    'linear-gradient(140deg, oklch(0.22 0.06 160) 0%, oklch(0.14 0.03 210) 100%)',
  ].join(', '),
} as const;

// Tiny inline SVG noise. Kept under a few hundred bytes so the login
// page stays fast; overlay at low opacity so the wash reads as a texture
// rather than a grainy photo.
const noiseBackground = {
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
  backgroundSize: '160px 160px',
} as const;

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas" />}>
      <LoginForm />
    </Suspense>
  );
}
