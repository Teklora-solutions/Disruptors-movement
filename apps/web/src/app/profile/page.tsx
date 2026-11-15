'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Skeleton } from '../components/Skeleton';
import { inputClass, labelClass, Notice } from '../components/AuthCard';
import { getMemberJson } from '../lib/auth-client';

type Me = {
  name: string | null;
  email: string;
  createdAt: string;
  memberProfile: {
    phone: string | null;
    county: string | null;
    interests: string[];
    skills: string[];
    consentMarketing: boolean;
  } | null;
};

type Form = { name: string; phone: string; county: string; interests: string; skills: string; consentMarketing: boolean };

const NOT_SET = 'Not added yet';
const list = (xs?: string[]) => (xs && xs.length ? xs.join(', ') : NOT_SET);
const split = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);
const joined = new Intl.DateTimeFormat('en-KE', { month: 'long', year: 'numeric' });

const toForm = (me: Me): Form => ({
  name: me.name ?? '',
  phone: me.memberProfile?.phone ?? '',
  county: me.memberProfile?.county ?? '',
  interests: (me.memberProfile?.interests ?? []).join(', '),
  skills: (me.memberProfile?.skills ?? []).join(', '),
  consentMarketing: me.memberProfile?.consentMarketing ?? false,
});

export default function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // ?edit=1 (from the dashboard's "add your phone…" step) opens the form.
    const startEditing = new URLSearchParams(window.location.search).get('edit') === '1';
    getMemberJson<Me>('/api/members/me').then(
      (data) => {
        setMe(data);
        if (startEditing) {
          setForm(toForm(data));
          setEditing(true);
        }
      },
      () => setLoadError('We could not load your profile. Please refresh the page.'),
    );
  }, []);

  const startEdit = () => {
    if (!me) return;
    setForm(toForm(me));
    setError('');
    setSaved(false);
    setEditing(true);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!form) return;
    if (!form.name.trim()) return setError('Enter your name.');
    setSaving(true);
    setError('');
    const res = await fetch('/api/members/me', {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        phone: form.phone,
        county: form.county,
        interests: split(form.interests),
        skills: split(form.skills),
        consentMarketing: form.consentMarketing,
      }),
    }).catch(() => null);
    setSaving(false);
    if (!res) return setError('Could not reach the server. Check your connection and try again.');
    if (res.status === 401) return window.location.assign('/signin?next=/profile');
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const message = Array.isArray(data?.message) ? data.message[0] : data?.message;
      return setError(message || 'Your changes were not saved. Please try again.');
    }
    setMe(data);
    setEditing(false);
    setSaved(true);
  };

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => f && { ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const p = me?.memberProfile;
  const fields: Array<[string, string]> = me
    ? [
        ['Name', me.name || NOT_SET],
        ['Email', me.email],
        ['Phone', p?.phone || NOT_SET],
        ['County', p?.county || NOT_SET],
        ['Interests', list(p?.interests)],
        ['Skills', list(p?.skills)],
        ['Member since', joined.format(new Date(me.createdAt))],
        ['News and opportunities emails', p?.consentMarketing ? 'Subscribed' : 'Not subscribed'],
      ]
    : [];

  return (
    <main className="page-shell">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Profile</p>
          <h1 className="section-heading text-4xl sm:text-5xl">Your profile</h1>
        </div>
        {me && !editing && (
          <button type="button" onClick={startEdit} className="secondary-btn">Edit profile</button>
        )}
      </section>

      {loadError && <div className="mt-8"><Notice tone="error">{loadError}</Notice></div>}
      {saved && <div className="mt-8"><Notice tone="success">Your profile has been updated.</Notice></div>}

      <section className="mt-10 rounded-[30px] border border-gray-200 bg-white/80 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] sm:p-8">
        {editing && form ? (
          <form onSubmit={save} className="grid gap-5 md:grid-cols-2" noValidate>
            <div>
              <label className={labelClass} htmlFor="name">Name</label>
              <input id="name" autoComplete="name" className={inputClass} value={form.name} onChange={set('name')} />
            </div>
            <div>
              <label className={labelClass} htmlFor="email">Email</label>
              <input id="email" className={`${inputClass} bg-gray-50 text-gray-500`} value={me?.email ?? ''} disabled />
            </div>
            <div>
              <label className={labelClass} htmlFor="phone">Phone</label>
              <input id="phone" type="tel" autoComplete="tel" placeholder="07XXXXXXXX" className={inputClass} value={form.phone} onChange={set('phone')} />
            </div>
            <div>
              <label className={labelClass} htmlFor="county">County</label>
              <input id="county" className={inputClass} value={form.county} onChange={set('county')} />
            </div>
            <div>
              <label className={labelClass} htmlFor="interests">Interests <span className="font-normal text-gray-500">(comma separated)</span></label>
              <input id="interests" placeholder="Leadership, tech, climate" className={inputClass} value={form.interests} onChange={set('interests')} />
            </div>
            <div>
              <label className={labelClass} htmlFor="skills">Skills <span className="font-normal text-gray-500">(comma separated)</span></label>
              <input id="skills" placeholder="Design, public speaking" className={inputClass} value={form.skills} onChange={set('skills')} />
            </div>
            <label className="flex items-start gap-3 text-sm text-gray-700 md:col-span-2" htmlFor="consentMarketing">
              <input id="consentMarketing" type="checkbox" className="mt-1" checked={form.consentMarketing} onChange={set('consentMarketing')} />
              <span>Send me news about events and opportunities.</span>
            </label>
            {error && <div className="md:col-span-2"><Notice tone="error">{error}</Notice></div>}
            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button type="submit" disabled={saving} className="primary-btn disabled:opacity-60">{saving ? 'Saving…' : 'Save changes'}</button>
              <button type="button" onClick={() => setEditing(false)} className="secondary-btn">Cancel</button>
            </div>
          </form>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {me
              ? fields.map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-orange-50 p-5">
                    <p className="text-sm text-gray-600">{label}</p>
                    <p className={`mt-2 break-words text-xl font-semibold ${value === NOT_SET ? 'text-gray-400' : 'text-deepInk'}`}>{value}</p>
                  </div>
                ))
              : Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-[92px] rounded-2xl" />)}
          </div>
        )}
      </section>
    </main>
  );
}
