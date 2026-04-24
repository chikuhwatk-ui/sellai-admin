'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loginMode, setLoginMode] = useState<'phone' | 'email'>('email');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [otpRequestMessage, setOtpRequestMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const idleExpired = searchParams.get('reason') === 'idle';

  async function handleRequestOtp() {
    if (loginMode !== 'email') {
      setError('OTP request is only supported for email login. Enter any 6-digit code for phone (dev: 123456).');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setSendingOtp(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/admin-request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      if (!res.ok && res.status !== 204) {
        const body = await res.json().catch(() => ({ message: 'Failed to send OTP' }));
        throw new Error(body.message || `Failed to send OTP (${res.status})`);
      }
      setOtpRequestMessage('If that email is registered, an OTP has been sent. Check server logs in dev.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const isV2 = loginMode === 'email';
    const endpoint = isV2 ? `${API_BASE}/api/auth/admin-login-v2` : `${API_BASE}/api/auth/admin-login`;
    const payload: any = { otp };

    if (loginMode === 'phone') {
      const fullPhone = phoneNumber.startsWith('+263')
        ? phoneNumber
        : `+263${phoneNumber.replace(/^0+/, '')}`;
      payload.phoneNumber = fullPhone;
    } else {
      if (!email.includes('@')) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }
      payload.email = email.toLowerCase().trim();
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(body.message || `Login failed (${res.status})`);
      }

      const data = await res.json();

      // V2 response: { access_token, refresh_token, admin: {...} }
      // V1 response: { access_token, refresh_token, user: {...}, adminRole, permissions }
      if (isV2) {
        if (!data.admin) {
          throw new Error('Unexpected login response shape');
        }
        sessionStorage.setItem('adminToken', data.access_token);
        sessionStorage.setItem('adminRefreshToken', data.refresh_token);
        sessionStorage.setItem('adminUser', JSON.stringify(data.admin));
        sessionStorage.setItem('adminRole', data.admin.adminRole);
        sessionStorage.setItem('lastActivity', Date.now().toString());
        document.cookie = `adminToken=${data.access_token};path=/;max-age=7200;SameSite=Strict;Secure`;
      } else {
        if (data.user?.role !== 'ADMIN') {
          throw new Error('Access denied. Admin privileges required.');
        }
        sessionStorage.setItem('adminToken', data.access_token);
        sessionStorage.setItem('adminRefreshToken', data.refresh_token);
        sessionStorage.setItem('adminUser', JSON.stringify(data.user));
        sessionStorage.setItem('lastActivity', Date.now().toString());
        if (data.adminRole) sessionStorage.setItem('adminRole', data.adminRole);
        if (data.permissions) sessionStorage.setItem('adminPermissions', JSON.stringify(data.permissions));
        document.cookie = `adminToken=${data.access_token};path=/;max-age=14400;SameSite=Strict;Secure`;
      }

      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      if (message.includes('fetch') || message.includes('network') || message.includes('ECONNREFUSED')) {
        setError('Unable to connect to server. Please try again.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1117] px-4">
      <div className="w-full max-w-md">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#10B981]/10 mb-4">
            <svg
              className="w-8 h-8 text-[#10B981]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0021 9.349m-18 0a2.999 2.999 0 013-2.599h12a2.999 2.999 0 013 2.599M3.75 6.75h16.5"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#E5E7EB]">Sellai Admin</h1>
          <p className="text-sm text-[#6B7280] mt-1">Sign in to the admin dashboard</p>
        </div>

        {/* Idle timeout message */}
        {idleExpired && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-4">
            <svg className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-yellow-400">Session expired due to inactivity. Please sign in again.</p>
          </div>
        )}

        {/* Card */}
        <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-2xl p-8">
          {/* Login mode toggle */}
          <div className="flex bg-[#0F1117] rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => setLoginMode('phone')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                loginMode === 'phone'
                  ? 'bg-[#10B981] text-white'
                  : 'text-[#6B7280] hover:text-[#E5E7EB]'
              }`}
            >
              Phone
            </button>
            <button
              type="button"
              onClick={() => setLoginMode('email')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                loginMode === 'email'
                  ? 'bg-[#10B981] text-white'
                  : 'text-[#6B7280] hover:text-[#E5E7EB]'
              }`}
            >
              Email
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Phone Number */}
            {loginMode === 'phone' ? (
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-[#E5E7EB] mb-2">
                  Phone Number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-[#2A2D37] bg-[#0F1117] text-sm text-[#6B7280]">
                    +263
                  </span>
                  <input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="7X XXX XXXX"
                    required
                    className="flex-1 px-4 py-2.5 bg-[#0F1117] border border-[#2A2D37] rounded-r-lg text-sm text-[#E5E7EB] placeholder-[#6B7280] focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-colors"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#E5E7EB] mb-2">
                  Email Address
                </label>
                <div className="flex gap-2">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@sellai.com"
                    required
                    className="flex-1 px-4 py-2.5 bg-[#0F1117] border border-[#2A2D37] rounded-lg text-sm text-[#E5E7EB] placeholder-[#6B7280] focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={sendingOtp || !email.includes('@')}
                    className="px-3 py-2.5 rounded-lg text-xs font-medium border border-[#10B981]/40 text-[#10B981] hover:bg-[#10B981]/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  >
                    {sendingOtp ? 'Sending…' : 'Send code'}
                  </button>
                </div>
                {otpRequestMessage && (
                  <p className="mt-1.5 text-xs text-[#10B981]">{otpRequestMessage}</p>
                )}
              </div>
            )}

            {/* OTP */}
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-[#E5E7EB] mb-2">
                OTP Code
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                required
                className="w-full px-4 py-2.5 bg-[#0F1117] border border-[#2A2D37] rounded-lg text-sm text-[#E5E7EB] placeholder-[#6B7280] tracking-widest text-center focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-colors"
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:ring-offset-2 focus:ring-offset-[#1A1D27] transition-colors"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#6B7280] mt-6">
          Sellai Admin Portal &mdash; Authorized personnel only
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0F1117]" />}>
      <LoginForm />
    </Suspense>
  );
}
