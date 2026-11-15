'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';
import AuthCard, { inputClass, labelClass, Notice } from '../components/AuthCard';
import { postJson, safeNext } from '../lib/auth-client';

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [unverified, setUnverified] = useState(false);
  const [resent, setResent] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setUnverified(false);
    if (!form.email || !form.password) {
      setError('Please provide both email and password.');
      return;
    }
    setBusy(true);
    const res = await postJson('/api/auth/login', form);
    setBusy(false);
    if (res.ok) {
      // Full navigation so server components (admin layout) see the new cookie.
      window.location.assign(safeNext(params.get('next')));
      return;
    }
    if (res.status === 403 && res.data?.code === 'email_not_verified') setUnverified(true);
    setError(res.error);
  };

  const resend = async () => {
    await postJson('/api/auth/resend-verification', { email: form.email });
    setResent(true);
  };

  return (
    <AuthCard
      eyebrow="Welcome back"
      title="Sign in to continue."
      blurb="Access your dashboard, tickets and opportunities across the Disruptors Movement."
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {params.get('verify') === 'expired' && (
          <Notice tone="error">That confirmation link is invalid or has expired. Sign in to get a new one.</Notice>
        )}
        {params.get('reset') === '1' && <Notice tone="success">Your password has been changed.</Notice>}
        <div>
          <label htmlFor="email" className={labelClass}>Email</label>
          <input id="email" type="email" autoComplete="email" value={form.email} className={inputClass}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
            <Link href="/forgot-password" className="text-sm font-medium text-vividOrange">Forgot password?</Link>
          </div>
          <input id="password" type="password" autoComplete="current-password" value={form.password} className={inputClass}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
        </div>

        {error && (
          <Notice tone="error">
            {error}
            {unverified && !resent && (
              <button type="button" onClick={resend} className="mt-2 block font-semibold text-vividOrange underline">
                Send the confirmation email again
              </button>
            )}
            {resent && <span className="mt-2 block">Sent. Check your inbox (and spam folder).</span>}
          </Notice>
        )}

        <button type="submit" disabled={busy} className="primary-btn w-full disabled:opacity-60">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="text-center text-sm text-gray-600">
          New here?{' '}
          <Link href="/join" className="font-semibold text-vividOrange">Join the movement</Link>
        </p>
      </form>
    </AuthCard>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
