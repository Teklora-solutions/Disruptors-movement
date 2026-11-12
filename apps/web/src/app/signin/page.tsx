'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export default function SignInPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!form.email || !form.password) {
      setError('Please provide both email and password.');
      return;
    }

    localStorage.setItem('authToken', 'demo-token');
    router.push('/dashboard');
  };

  return (
    <main className="page-shell flex min-h-[calc(100vh-80px)] items-center justify-center">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-[30px] border border-gray-200 bg-white/80 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm lg:grid-cols-2">
        <div className="bg-deepInk p-8 text-warmPaper sm:p-10">
          <p className="text-sm uppercase tracking-[0.2em] text-orange-200">Welcome back</p>
          <h1 className="mt-4 text-4xl font-bold tracking-[-0.05em]">Sign in to continue.</h1>
          <p className="mt-4 max-w-sm text-orange-100">
            Access your dashboard, tickets and opportunities across the Disruptors Movement.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6 sm:p-8">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-vividOrange focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">Password</label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-vividOrange focus:ring-2 focus:ring-orange-100"
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button type="submit" className="primary-btn w-full">
            Sign in
          </button>

          <p className="text-center text-sm text-gray-600">
            New here?{' '}
            <Link href="/join" className="font-semibold text-vividOrange">
              Join the movement
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
