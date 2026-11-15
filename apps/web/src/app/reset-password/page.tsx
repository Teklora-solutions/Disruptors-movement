'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';
import AuthCard, { inputClass, labelClass, Notice } from '../components/AuthCard';
import { postJson } from '../lib/auth-client';

function ResetPasswordForm() {
  const token = useSearchParams().get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('The passwords do not match.');
    setBusy(true);
    const res = await postJson('/api/auth/reset-password', { token, password });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    // The API signed the member in as part of the reset.
    window.location.assign('/dashboard');
  };

  if (!token) {
    return (
      <div className="space-y-5">
        <Notice tone="error">This reset link is incomplete. Open the link from your email again, or ask for a new one.</Notice>
        <Link href="/forgot-password" className="primary-btn w-full">Get a new link</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div>
        <label htmlFor="password" className={labelClass}>New password</label>
        <input id="password" type="password" autoComplete="new-password" minLength={8} value={password} className={inputClass}
          onChange={(e) => setPassword(e.target.value)} />
        <p className="mt-1 text-xs text-gray-500">At least 8 characters.</p>
      </div>
      <div>
        <label htmlFor="confirm" className={labelClass}>Confirm new password</label>
        <input id="confirm" type="password" autoComplete="new-password" value={confirm} className={inputClass}
          onChange={(e) => setConfirm(e.target.value)} />
      </div>
      {error && (
        <Notice tone="error">
          {error}{' '}
          {error.includes('expired') && <Link href="/forgot-password" className="font-semibold underline">Get a new link</Link>}
        </Notice>
      )}
      <button type="submit" disabled={busy} className="primary-btn w-full disabled:opacity-60">
        {busy ? 'Saving…' : 'Set new password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthCard eyebrow="Account help" title="Choose a new password." blurb="Pick something you have not used here before. You will be signed in afterwards.">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
