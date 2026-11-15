'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import AuthCard, { inputClass, labelClass, Notice } from '../components/AuthCard';
import { postJson } from '../lib/auth-client';

export default function JoinPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    county: '',
    interests: '',
    consentMarketing: false,
    consentDataProcessing: false,
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [resent, setResent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    if (form.password !== form.confirmPassword) return setError('The passwords do not match.');
    if (!form.consentDataProcessing) return setError('You must accept data-processing consent to join.');

    setBusy(true);
    const res = await postJson('/api/auth/register', {
      name: form.name,
      email: form.email,
      password: form.password,
      phone: form.phone || undefined,
      county: form.county || undefined,
      interests: form.interests.split(',').map((s) => s.trim()).filter(Boolean),
      consentMarketing: form.consentMarketing,
      consentDataProcessing: form.consentDataProcessing,
    });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    if (res.data?.status === 'signed-in') {
      window.location.assign('/dashboard');
      return;
    }
    setSentTo(form.email);
  };

  const resend = async () => {
    await postJson('/api/auth/resend-verification', { email: sentTo });
    setResent(true);
  };

  if (sentTo) {
    return (
      <AuthCard eyebrow="Almost there" title="Check your inbox." blurb="One last step to finish joining the Disruptors Movement.">
        <div className="space-y-5">
          <Notice tone="info">
            We sent a confirmation link to <strong>{sentTo}</strong>. Open it to activate your account. The link works for 24 hours.
          </Notice>
          <p className="text-sm text-gray-600">Nothing there after a few minutes? Check your spam folder, or send it again.</p>
          {resent ? (
            <Notice tone="success">Sent again.</Notice>
          ) : (
            <button type="button" onClick={resend} className="secondary-btn w-full">Send the link again</button>
          )}
          <p className="text-center text-sm text-gray-600">
            Already confirmed? <Link href="/signin" className="font-semibold text-vividOrange">Sign in</Link>
          </p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      wide
      eyebrow="Join the movement"
      title="Create your account."
      blurb="Find events, fellowships and activities from organisations across the Disruptors Movement."
    >
      <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2" noValidate>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="name">Full name</label>
          <input required id="name" name="name" type="text" autoComplete="name" className={inputClass} value={form.name} onChange={handleChange} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="email">Email</label>
          <input required id="email" name="email" type="email" autoComplete="email" className={inputClass} value={form.email} onChange={handleChange} />
        </div>
        <div>
          <label className={labelClass} htmlFor="password">Password</label>
          <input required id="password" name="password" type="password" autoComplete="new-password" minLength={8} className={inputClass} value={form.password} onChange={handleChange} />
          <p className="mt-1 text-xs text-gray-500">At least 8 characters.</p>
        </div>
        <div>
          <label className={labelClass} htmlFor="confirmPassword">Confirm password</label>
          <input required id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" className={inputClass} value={form.confirmPassword} onChange={handleChange} />
        </div>
        <div>
          <label className={labelClass} htmlFor="phone">Phone <span className="font-normal text-gray-500">(optional)</span></label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="07XXXXXXXX" className={inputClass} value={form.phone} onChange={handleChange} />
        </div>
        <div>
          <label className={labelClass} htmlFor="county">County <span className="font-normal text-gray-500">(optional)</span></label>
          <input id="county" name="county" type="text" className={inputClass} value={form.county} onChange={handleChange} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="interests">Interests <span className="font-normal text-gray-500">(comma separated, optional)</span></label>
          <input id="interests" name="interests" type="text" placeholder="Leadership, tech, climate" className={inputClass} value={form.interests} onChange={handleChange} />
        </div>
        <label className="flex items-start gap-3 text-sm text-gray-700 sm:col-span-2" htmlFor="consentDataProcessing">
          <input id="consentDataProcessing" name="consentDataProcessing" type="checkbox" className="mt-1" checked={form.consentDataProcessing} onChange={handleChange} />
          <span>I consent to my data being processed to run my account (required).</span>
        </label>
        <label className="flex items-start gap-3 text-sm text-gray-700 sm:col-span-2" htmlFor="consentMarketing">
          <input id="consentMarketing" name="consentMarketing" type="checkbox" className="mt-1" checked={form.consentMarketing} onChange={handleChange} />
          <span>Send me news about events and opportunities.</span>
        </label>

        {error && <div className="sm:col-span-2"><Notice tone="error">{error}</Notice></div>}

        <button type="submit" disabled={busy} className="primary-btn w-full disabled:opacity-60 sm:col-span-2">
          {busy ? 'Creating your account…' : 'Join'}
        </button>
        <p className="text-center text-sm text-gray-600 sm:col-span-2">
          Already a member? <Link href="/signin" className="font-semibold text-vividOrange">Sign in</Link>
        </p>
      </form>
    </AuthCard>
  );
}
