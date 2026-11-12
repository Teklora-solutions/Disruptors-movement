'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    localStorage.removeItem('authToken');
    router.push('/');
  }, [router]);

  return (
    <main className="page-shell text-center">
      <div className="mx-auto max-w-xl rounded-[28px] border border-gray-200 bg-white/80 p-8 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
        <p className="eyebrow">Session</p>
        <h1 className="mt-4 text-4xl font-bold tracking-[-0.05em] text-deepInk">Signing you out…</h1>
      </div>
    </main>
  );
}
