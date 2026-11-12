'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JoinPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    county: '',
    interests: '',
    consentMarketing: false,
    consentDataProcessing: false,
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.consentDataProcessing) {
      setError('You must accept data‑processing consent');
      return;
    }
    try {
      const res = await fetch('/api/members/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed');
      const { token } = await res.json();
      // assume backend returns JWT token – store it
      localStorage.setItem('authToken', token);
      router.push('/dashboard');
    } catch (err) {
      setError('Registration failed');
    }
  };

  return (
    <section className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-heading mb-4">Join the Movement</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium" htmlFor="name">Name</label>
          <input required id="name" name="name" type="text" className="w-full border p-2" value={form.name} onChange={handleChange} />
        </div>
        <div>
          <label className="block font-medium" htmlFor="phone">Phone (e.g. 07XXXXXXXX)</label>
          <input required id="phone" name="phone" type="tel" className="w-full border p-2" value={form.phone} onChange={handleChange} />
        </div>
        <div>
          <label className="block font-medium" htmlFor="county">County</label>
          <input required id="county" name="county" type="text" className="w-full border p-2" value={form.county} onChange={handleChange} />
        </div>
        <div>
          <label className="block font-medium" htmlFor="interests">Interests (comma separated)</label>
          <input id="interests" name="interests" type="text" className="w-full border p-2" value={form.interests} onChange={handleChange} />
        </div>
        <div className="flex items-center">
          <input id="consentMarketing" name="consentMarketing" type="checkbox" className="mr-2" checked={form.consentMarketing} onChange={handleChange} />
          <label htmlFor="consentMarketing">I would like to receive marketing communications</label>
        </div>
        <div className="flex items-center">
          <input id="consentDataProcessing" name="consentDataProcessing" type="checkbox" className="mr-2" checked={form.consentDataProcessing} onChange={handleChange} />
          <label htmlFor="consentDataProcessing">I consent to data processing (required)</label>
        </div>
        {error && <p className="text-red-600">{error}</p>}
        <button type="submit" className="px-4 py-2 bg-vividOrange text-warmPaper rounded-md font-medium">Join</button>
      </form>
    </section>
  );
}

