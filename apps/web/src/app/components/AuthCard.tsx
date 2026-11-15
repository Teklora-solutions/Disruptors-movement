import React from 'react';

/** Two-panel card shared by the sign-in, join and password pages. */
export default function AuthCard({
  eyebrow,
  title,
  blurb,
  children,
  wide = false,
}: {
  eyebrow: string;
  title: string;
  blurb: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <main className="page-shell flex min-h-[calc(100vh-80px)] items-center justify-center">
      <div
        className={`grid w-full overflow-hidden rounded-[30px] border border-gray-200 bg-white/80 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm lg:grid-cols-[0.8fr_1.2fr] ${wide ? 'max-w-5xl' : 'max-w-4xl'}`}
      >
        <div className="bg-deepInk p-8 text-warmPaper sm:p-10">
          <p className="text-sm uppercase tracking-[0.2em] text-orange-200">{eyebrow}</p>
          <h1 className="mt-4 text-4xl font-bold tracking-[-0.05em]">{title}</h1>
          <p className="mt-4 max-w-sm text-orange-100">{blurb}</p>
        </div>
        <div className="p-6 sm:p-8">{children}</div>
      </div>
    </main>
  );
}

export const inputClass =
  'w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-vividOrange focus:ring-2 focus:ring-orange-100';
export const labelClass = 'mb-2 block text-sm font-medium text-gray-700';

export function Notice({ tone, children }: { tone: 'error' | 'info' | 'success'; children: React.ReactNode }) {
  const styles = {
    error: 'border-red-200 bg-red-50 text-red-700',
    info: 'border-orange-200 bg-orange-50 text-deepInk',
    success: 'border-green-200 bg-green-50 text-green-800',
  }[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}
