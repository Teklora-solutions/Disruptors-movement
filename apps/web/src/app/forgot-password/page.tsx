'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import AuthCard, { inputClass, labelClass, Notice } from '../components/AuthCard';
import { postJson } from '../lib/auth-client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    const res = await postJson('/api/auth/forgot-password', { email });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setSent(true);
  };

  return (
    <AuthCard eyebrow="Account help" title="Forgot your password?" blurb="Enter your email and we will send you a link to choose a new one.">
      {sent ? (
        <div className="space-y-5">
          <Notice tone="info">
            If <strong>{email}</strong> has an account, a reset link is on its way. It works for 1 hour.
          </Notice>
          <p className="text-sm text-gray-600">Nothing after a few minutes? Check your spam folder.</p>
          <Link href="/signin" className="secondary-btn w-full">Back to sign in</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label htmlFor="email" className={labelClass}>Email</label>
            <input id="email" type="email" autoComplete="email" required value={email} className={inputClass}
              onChange={(e) => setEmail(e.target.value)} />
          </div>
          {error && <Notice tone="error">{error}</Notice>}
          <button type="submit" disabled={busy} className="primary-btn w-full disabled:opacity-60">
            {busy ? 'Sending…' : 'Send reset link'}
          </button>
          <p className="text-center text-sm text-gray-600">
            Remembered it? <Link href="/signin" className="font-semibold text-vividOrange">Sign in</Link>
          </p>
        </form>
      )}
    </AuthCard>
  );
}
